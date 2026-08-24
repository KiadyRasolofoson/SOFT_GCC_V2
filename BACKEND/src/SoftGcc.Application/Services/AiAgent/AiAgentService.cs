using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Application.Dtos.AiAgent;
using SoftGcc.Domain.Entities.AiAgent;
using SoftGcc.Domain.Enums;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent;

public sealed class AiAgentService : IAiAgentService
{
    private const int DefaultMaxToolRounds = 15;
    private const int MinToolRounds = 1;
    private const int MaxToolRoundsCap = 40;
    private const int MaxHistoryMessages = 20;

    private static readonly JsonSerializerOptions ToolCallJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IApplicationDbContext _db;
    private readonly ILlmProviderFactory _factory;
    private readonly ISecretProtector _protector;
    private readonly IAiToolRegistry _tools;

    public AiAgentService(
        IApplicationDbContext db,
        ILlmProviderFactory factory,
        ISecretProtector protector,
        IAiToolRegistry tools)
    {
        _db = db;
        _factory = factory;
        _protector = protector;
        _tools = tools;
    }

    public async Task<AiChatResponseDto> ChatAsync(int userId, int roleId, AiChatRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ValidationException("Le message est requis.");

        var setting = await GetOrCreateSettingsAsync(cancellationToken);
        if (!setting.IsEnabled)
            throw new ValidationException("L'agent IA est désactivé. Un administrateur doit l'activer dans les paramètres.");

        if (!AiProviderNames.TryParse(setting.ActiveProvider, out var provider))
            throw new ValidationException($"Fournisseur actif invalide : {setting.ActiveProvider}.");

        var providerConfig = await GetProviderConfigAsync(setting.ActiveProvider, cancellationToken);
        var catalog = AiProviderCatalog.GetRequired(provider);
        var apiKey = ResolveApiKey(providerConfig, catalog);

        var conversation = await ResolveConversationAsync(userId, request.ConversationId, setting, cancellationToken);
        var mode = AiAgentModeDetector.Detect(request.Message, request.Mode);

        conversation.LastMode = mode;
        conversation.Provider = setting.ActiveProvider;
        conversation.Model = setting.ActiveModel;
        conversation.UpdatedAt = DateTime.UtcNow;
        var needsTitle = conversation.Title == "Nouvelle conversation";
        if (needsTitle)
            conversation.Title = TruncateTitle(request.Message);

        _db.AiMessages.Add(new AiMessage
        {
            Conversation = conversation,
            Role = "user",
            Content = request.Message.Trim(),
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);

        IReadOnlyList<IAiTool> allowedTools = await _tools.GetAllowedAsync(userId, roleId, cancellationToken);

        var llmMessages = await BuildLlmMessagesAsync(conversation.Id, mode, allowedTools, cancellationToken);
        var toolDefs = allowedTools.Select(ToDefinition).ToList();
        var client = _factory.GetClient(provider);
        var titleTask = needsTitle
            ? GenerateTitleAsync(client, setting, apiKey, providerConfig.BaseUrl, request.Message, cancellationToken)
            : Task.FromResult<string?>(null);
        var toolsUsed = new List<string>();
        string? warning = null;
        string? reply = null;

        var toolRounds = Math.Clamp(setting.MaxToolRounds > 0 ? setting.MaxToolRounds : DefaultMaxToolRounds, MinToolRounds, MaxToolRoundsCap);
        for (var round = 0; round < toolRounds; round++)
        {
            var response = await client.CompleteAsync(new LlmChatRequest
            {
                Model = setting.ActiveModel,
                Messages = llmMessages,
                Tools = toolDefs.Count == 0 ? null : toolDefs,
                Temperature = setting.Temperature,
                MaxTokens = setting.MaxTokens,
                ApiKey = apiKey,
                BaseUrl = providerConfig.BaseUrl
            }, cancellationToken);

            if (response.ToolsRejectedByProvider && toolDefs.Count > 0)
            {
                warning = "Le modèle ne prend pas en charge les outils ; réponse en mode chat.";
                toolDefs.Clear();
                continue;
            }

            var (cleanContent, parsedCalls) = LlmToolMarkup.Extract(response.Content);
            var toolCalls = response.ToolCalls.Count > 0
                ? response.ToolCalls
                : toolDefs.Count > 0 ? parsedCalls : Array.Empty<LlmToolCall>();

            if (toolCalls.Count == 0)
            {
                reply = string.IsNullOrWhiteSpace(cleanContent)
                    ? "Je n'ai pas pu produire de réponse."
                    : cleanContent;
                break;
            }

            var assistantToolMessage = new LlmMessage
            {
                Role = "assistant",
                Content = cleanContent,
                ToolCalls = toolCalls
            };
            llmMessages.Add(assistantToolMessage);

            _db.AiMessages.Add(new AiMessage
            {
                ConversationId = conversation.Id,
                Role = "assistant",
                Content = cleanContent ?? string.Empty,
                ToolCallJson = JsonSerializer.Serialize(toolCalls, ToolCallJsonOptions),
                CreatedAt = DateTime.UtcNow
            });

            foreach (var call in toolCalls)
            {
                toolsUsed.Add(call.Name);
                var result = await ExecuteToolAsync(allowedTools, call, userId, cancellationToken);

                llmMessages.Add(new LlmMessage
                {
                    Role = "tool",
                    Name = call.Name,
                    ToolCallId = call.Id,
                    Content = result
                });

                _db.AiMessages.Add(new AiMessage
                {
                    ConversationId = conversation.Id,
                    Role = "tool",
                    Content = result,
                    ToolName = call.Name,
                    ToolCallId = call.Id,
                    ToolCallJson = call.ArgumentsJson,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        reply ??= "Nombre maximal d'appels d'outils atteint. Augmentez la limite dans les paramètres de l'agent ou reformulez votre question.";
        reply = LlmToolMarkup.Strip(reply);

        if (needsTitle)
        {
            var generated = await titleTask;
            if (!string.IsNullOrWhiteSpace(generated))
                conversation.Title = generated;
        }

        _db.AiMessages.Add(new AiMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = reply,
            CreatedAt = DateTime.UtcNow
        });
        conversation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new AiChatResponseDto
        {
            ConversationId = conversation.Id,
            Mode = mode,
            Provider = setting.ActiveProvider,
            Model = setting.ActiveModel,
            Reply = reply,
            Title = conversation.Title,
            ToolsUsed = toolsUsed.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            Warning = warning
        };
    }

    public async Task<IReadOnlyList<AiConversationSummaryDto>> GetConversationsAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _db.AiConversations
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new AiConversationSummaryDto
            {
                Id = c.Id,
                Title = c.Title,
                LastMode = c.LastMode,
                Provider = c.Provider,
                Model = c.Model,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<AiConversationDetailDto> GetConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
    {
        var conversation = await _db.AiConversations
            .AsNoTracking()
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);

        if (conversation is null)
            throw new NotFoundException("Conversation", conversationId);

        return new AiConversationDetailDto
        {
            Id = conversation.Id,
            Title = conversation.Title,
            LastMode = conversation.LastMode,
            Provider = conversation.Provider,
            Model = conversation.Model,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            Messages = conversation.Messages
                .OrderBy(m => m.CreatedAt)
                .ThenBy(m => m.Id)
                .Select(m => new AiMessageDto
                {
                    Id = m.Id,
                    Role = m.Role,
                    Content = m.Role == "assistant" ? LlmToolMarkup.Strip(m.Content) : m.Content,
                    ToolName = m.ToolName,
                    CreatedAt = m.CreatedAt
                })
                .ToList()
        };
    }

    public async Task DeleteConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default)
    {
        var conversation = await _db.AiConversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);

        if (conversation is null)
            throw new NotFoundException("Conversation", conversationId);

        _db.AiConversations.Remove(conversation);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<AiAgentSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var setting = await GetOrCreateSettingsAsync(cancellationToken);
        var configs = await _db.AiProviderConfigs.AsNoTracking().OrderBy(c => c.Id).ToListAsync(cancellationToken);
        return MapSettings(setting, configs);
    }

    public async Task<AiAgentSettingsDto> UpdateSettingsAsync(UpdateAiAgentSettingsDto request, CancellationToken cancellationToken = default)
    {
        var setting = await GetOrCreateSettingsAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.Provider))
        {
            if (!AiProviderNames.TryParse(request.Provider, out _))
                throw new ValidationException($"Fournisseur inconnu : {request.Provider}.");

            setting.ActiveProvider = AiProviderCatalog.Get(request.Provider)!.Id;
        }

        if (!string.IsNullOrWhiteSpace(request.Model))
            setting.ActiveModel = request.Model.Trim();

        if (request.IsEnabled.HasValue)
            setting.IsEnabled = request.IsEnabled.Value;

        if (request.MaxTokens is > 0)
            setting.MaxTokens = Math.Clamp(request.MaxTokens.Value, 64, 8192);

        if (request.MaxToolRounds is > 0)
            setting.MaxToolRounds = Math.Clamp(request.MaxToolRounds.Value, MinToolRounds, MaxToolRoundsCap);

        if (request.Temperature is >= 0)
            setting.Temperature = Math.Clamp(request.Temperature.Value, 0, 2);

        if (setting.IsEnabled)
        {
            var config = await GetProviderConfigAsync(setting.ActiveProvider, cancellationToken);
            var catalog = AiProviderCatalog.Get(setting.ActiveProvider)!;
            _ = ResolveApiKey(config, catalog);
        }

        setting.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return await GetSettingsAsync(cancellationToken);
    }

    public IReadOnlyList<AiProviderCatalogDto> GetProviderCatalog() => AiProviderCatalog.All;

    public async Task<AiProviderConfigDto> UpdateProviderConfigAsync(string provider, UpdateAiProviderConfigDto request, CancellationToken cancellationToken = default)
    {
        if (!AiProviderNames.TryParse(provider, out var parsed))
            throw new ValidationException($"Fournisseur inconnu : {provider}.");

        var name = AiProviderNames.ToName(parsed);
        var config = await GetProviderConfigAsync(name, cancellationToken);

        if (request.ClearApiKey)
            config.EncryptedApiKey = null;
        else if (!string.IsNullOrWhiteSpace(request.ApiKey))
            config.EncryptedApiKey = _protector.Protect(request.ApiKey.Trim());

        if (request.BaseUrl is not null)
            config.BaseUrl = string.IsNullOrWhiteSpace(request.BaseUrl) ? null : request.BaseUrl.Trim().TrimEnd('/');

        if (request.DefaultModel is not null)
            config.DefaultModel = string.IsNullOrWhiteSpace(request.DefaultModel) ? null : request.DefaultModel.Trim();

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return MapProvider(config);
    }

    public async Task<AiProviderTestResultDto> TestProviderAsync(string provider, CancellationToken cancellationToken = default)
    {
        if (!AiProviderNames.TryParse(provider, out var parsed))
            throw new ValidationException($"Fournisseur inconnu : {provider}.");

        var name = AiProviderNames.ToName(parsed);
        var setting = await GetOrCreateSettingsAsync(cancellationToken);
        var config = await GetProviderConfigAsync(name, cancellationToken);
        var catalog = AiProviderCatalog.GetRequired(parsed);
        var apiKey = ResolveApiKey(config, catalog);
        var model = setting.ActiveProvider.Equals(name, StringComparison.OrdinalIgnoreCase)
            ? setting.ActiveModel
            : config.DefaultModel ?? catalog.SuggestedModels.First();

        try
        {
            var client = _factory.GetClient(parsed);
            var response = await client.CompleteAsync(new LlmChatRequest
            {
                Model = model,
                Messages =
                [
                    new LlmMessage { Role = "system", Content = "Tu es un ping de test. Réponds uniquement par OK." },
                    new LlmMessage { Role = "user", Content = "ping" }
                ],
                Temperature = 0,
                MaxTokens = 16,
                ApiKey = apiKey,
                BaseUrl = config.BaseUrl
            }, cancellationToken);

            return new AiProviderTestResultDto
            {
                Success = true,
                Provider = name,
                Model = model,
                Message = string.IsNullOrWhiteSpace(response.Content) ? "Connexion réussie." : response.Content.Trim()
            };
        }
        catch (Exception ex) when (ex is LlmProviderException or HttpRequestException)
        {
            return new AiProviderTestResultDto
            {
                Success = false,
                Provider = name,
                Model = model,
                Message = ex.Message
            };
        }
    }

    public async Task<AiToolsCatalogDto> GetToolsCatalogAsync(int userId, int roleId, CancellationToken cancellationToken = default)
    {
        var allowed = await _tools.GetAllowedAsync(userId, roleId, cancellationToken);
        var allowedKeys = allowed.Select(t => t.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

        return new AiToolsCatalogDto
        {
            Tools = _tools.All.Select(t => new AiToolInfoDto
            {
                Key = t.Key,
                Description = t.Description,
                RequiredPermissions = t.RequiredPermissions,
                AllowedForCurrentUser = allowedKeys.Contains(t.Key)
            }).ToList()
        };
    }

    public async Task<IReadOnlyList<AiToolPermissionDto>> GetToolPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _db.AiToolPermissions.AsNoTracking().OrderBy(p => p.Id).ToListAsync(cancellationToken);
        return rows.Select(MapPermission).ToList();
    }

    public async Task<IReadOnlyList<AiToolPermissionDto>> ReplaceToolPermissionsAsync(ReplaceAiToolPermissionsDto request, CancellationToken cancellationToken = default)
    {
        var knownKeys = _tools.All.Select(t => t.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var items = request.Items ?? Array.Empty<UpsertAiToolPermissionDto>();

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.ToolKey) || !knownKeys.Contains(item.ToolKey))
                throw new ValidationException($"Outil inconnu : {item.ToolKey}.");

            var hasRole = item.RoleId.HasValue;
            var hasUser = item.UserId.HasValue;
            if (hasRole == hasUser)
                throw new ValidationException("Chaque règle doit cibler soit un rôle, soit un utilisateur.");
        }

        var existing = await _db.AiToolPermissions.ToListAsync(cancellationToken);
        _db.AiToolPermissions.RemoveRange(existing);

        foreach (var item in items)
        {
            _db.AiToolPermissions.Add(new AiToolPermission
            {
                RoleId = item.UserId.HasValue ? null : item.RoleId,
                UserId = item.UserId,
                ToolKey = item.ToolKey.Trim(),
                IsAllowed = item.IsAllowed
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await GetToolPermissionsAsync(cancellationToken);
    }

    private async Task<List<LlmMessage>> BuildLlmMessagesAsync(
        int conversationId,
        string mode,
        IReadOnlyList<IAiTool> allowedTools,
        CancellationToken cancellationToken)
    {
        var history = await _db.AiMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .Take(MaxHistoryMessages * 4)
            .ToListAsync(cancellationToken);
        history.Reverse();

        var toolKeys = allowedTools.Select(t => t.Key).ToList();
        var messages = new List<LlmMessage>
        {
            new() { Role = "system", Content = AiAgentPrompts.ForMode(mode, toolKeys) }
        };

        messages.AddRange(TrimHistory(ReconstructLlmMessages(history)));
        return messages;
    }

    private static List<LlmMessage> ReconstructLlmMessages(IReadOnlyList<AiMessage> history)
    {
        var messages = new List<LlmMessage>();
        var i = 0;

        while (i < history.Count)
        {
            var row = history[i];
            if (row.Role == "tool")
            {
                i += 1;
                continue;
            }

            var toolCalls = row.Role == "assistant" ? TryParseToolCalls(row.ToolCallJson) : null;
            messages.Add(new LlmMessage
            {
                Role = row.Role,
                Content = row.Role == "assistant" ? LlmToolMarkup.Strip(row.Content) : row.Content,
                ToolCalls = toolCalls is { Count: > 0 } ? toolCalls : null
            });
            i += 1;

            if (toolCalls is not { Count: > 0 })
                continue;

            var pending = toolCalls
                .Select(c => c.Id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.Ordinal);

            while (i < history.Count && history[i].Role == "tool")
            {
                var tool = history[i];
                i += 1;
                if (string.IsNullOrWhiteSpace(tool.ToolCallId) || !pending.Remove(tool.ToolCallId))
                    continue;

                messages.Add(new LlmMessage
                {
                    Role = "tool",
                    Name = tool.ToolName,
                    ToolCallId = tool.ToolCallId,
                    Content = AiJson.Truncate(tool.Content, 4000)
                });
            }

            if (pending.Count == 0)
                continue;

            if (pending.Count == toolCalls.Count)
            {
                messages[^1] = new LlmMessage { Role = "assistant", Content = messages[^1].Content };
                continue;
            }

            foreach (var call in toolCalls.Where(c => pending.Contains(c.Id)))
            {
                messages.Add(new LlmMessage
                {
                    Role = "tool",
                    Name = call.Name,
                    ToolCallId = call.Id,
                    Content = "{\"error\":\"Résultat d'outil indisponible.\"}"
                });
            }
        }

        return messages;
    }

    private static List<LlmMessage> TrimHistory(List<LlmMessage> messages)
    {
        if (messages.Count <= MaxHistoryMessages)
            return messages;

        var start = messages.Count - MaxHistoryMessages;
        while (start < messages.Count && messages[start].Role == "tool")
            start += 1;

        return start >= messages.Count
            ? new List<LlmMessage>()
            : messages.GetRange(start, messages.Count - start);
    }

    private static IReadOnlyList<LlmToolCall>? TryParseToolCalls(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        var trimmed = json.TrimStart();
        if (trimmed.StartsWith('{') == false && trimmed.StartsWith('[') == false)
            return null;

        try
        {
            if (trimmed.StartsWith('['))
                return JsonSerializer.Deserialize<List<LlmToolCall>>(json, ToolCallJsonOptions);

            var single = JsonSerializer.Deserialize<LlmToolCall>(json, ToolCallJsonOptions);
            return single is null ? null : new[] { single };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string NormalizeToolName(string name)
    {
        var trimmed = name.Trim();
        if (trimmed.EndsWith("_detail", StringComparison.OrdinalIgnoreCase))
            return trimmed[..^7];
        if (trimmed.EndsWith("_info", StringComparison.OrdinalIgnoreCase))
            return trimmed[..^5];
        return trimmed;
    }

    private async Task<string> ExecuteToolAsync(IReadOnlyList<IAiTool> allowed, LlmToolCall call, int userId, CancellationToken cancellationToken)
    {
        var tool = allowed.FirstOrDefault(t => string.Equals(t.Key, call.Name, StringComparison.OrdinalIgnoreCase))
            ?? allowed.FirstOrDefault(t => string.Equals(t.Key, NormalizeToolName(call.Name), StringComparison.OrdinalIgnoreCase));
        if (tool is null)
            return AiJson.SerializeForLlm(new
            {
                error = "permission_denied",
                message = $"Vous n'avez pas la permission d'utiliser l'outil « {call.Name} ». Un administrateur peut l'accorder dans Paramètres > Agent IA."
            });

        JsonElement args;
        try
        {
            args = string.IsNullOrWhiteSpace(call.ArgumentsJson)
                ? JsonDocument.Parse("{}").RootElement.Clone()
                : JsonDocument.Parse(call.ArgumentsJson).RootElement.Clone();
        }
        catch (JsonException)
        {
            return AiJson.SerializeForLlm(new { error = "Arguments JSON invalides." });
        }

        try
        {
            return await tool.ExecuteAsync(args, userId, cancellationToken);
        }
        catch (DomainException ex)
        {
            return AiJson.SerializeForLlm(new { error = ex.Message });
        }
        catch (Exception)
        {
            return AiJson.SerializeForLlm(new { error = "Erreur lors de l'exécution de l'outil." });
        }
    }

    private async Task<AiConversation> ResolveConversationAsync(int userId, int? conversationId, AiAgentSetting setting, CancellationToken cancellationToken)
    {
        if (conversationId is null or 0)
        {
            var created = new AiConversation
            {
                UserId = userId,
                Provider = setting.ActiveProvider,
                Model = setting.ActiveModel,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.AiConversations.Add(created);
            await _db.SaveChangesAsync(cancellationToken);
            return created;
        }

        var existing = await _db.AiConversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, cancellationToken);

        return existing ?? throw new NotFoundException("Conversation", conversationId);
    }

    private async Task<AiAgentSetting> GetOrCreateSettingsAsync(CancellationToken cancellationToken)
    {
        var setting = await _db.AiAgentSettings.FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);
        if (setting is not null)
            return setting;

        setting = new AiAgentSetting { Id = 1 };
        _db.AiAgentSettings.Add(setting);
        await _db.SaveChangesAsync(cancellationToken);
        return setting;
    }

    private async Task<AiProviderConfig> GetProviderConfigAsync(string provider, CancellationToken cancellationToken)
    {
        var config = await _db.AiProviderConfigs
            .FirstOrDefaultAsync(c => c.Provider == provider, cancellationToken);

        if (config is not null)
            return config;

        var catalog = AiProviderCatalog.Get(provider);
        config = new AiProviderConfig
        {
            Provider = provider,
            BaseUrl = catalog?.DefaultBaseUrl,
            DefaultModel = catalog?.SuggestedModels.FirstOrDefault(),
            UpdatedAt = DateTime.UtcNow
        };
        _db.AiProviderConfigs.Add(config);
        await _db.SaveChangesAsync(cancellationToken);
        return config;
    }

    private string? ResolveApiKey(AiProviderConfig config, AiProviderCatalogDto catalog)
    {
        if (!string.IsNullOrWhiteSpace(config.EncryptedApiKey))
            return _protector.Unprotect(config.EncryptedApiKey);

        if (catalog.RequiresApiKey)
            throw new ValidationException($"Aucune clé API n'est configurée pour {catalog.Id}.");

        return null;
    }

    private static LlmToolDefinition ToDefinition(IAiTool tool) => new()
    {
        Name = tool.Key,
        Description = tool.Description,
        ParametersSchema = tool.ParametersSchema
    };

    private static AiAgentSettingsDto MapSettings(AiAgentSetting setting, IEnumerable<AiProviderConfig> configs) => new()
    {
        ActiveProvider = setting.ActiveProvider,
        ActiveModel = setting.ActiveModel,
        IsEnabled = setting.IsEnabled,
        MaxTokens = setting.MaxTokens,
        MaxToolRounds = setting.MaxToolRounds > 0 ? setting.MaxToolRounds : DefaultMaxToolRounds,
        Temperature = setting.Temperature,
        Providers = configs.Select(MapProvider).ToList()
    };

    private static AiProviderConfigDto MapProvider(AiProviderConfig config) => new()
    {
        Provider = config.Provider,
        BaseUrl = config.BaseUrl,
        DefaultModel = config.DefaultModel,
        HasApiKey = !string.IsNullOrWhiteSpace(config.EncryptedApiKey)
    };

    private static AiToolPermissionDto MapPermission(AiToolPermission permission) => new()
    {
        Id = permission.Id,
        RoleId = permission.RoleId,
        UserId = permission.UserId,
        ToolKey = permission.ToolKey,
        IsAllowed = permission.IsAllowed
    };

    private async Task<string?> GenerateTitleAsync(
        ILlmChatClient client,
        AiAgentSetting setting,
        string? apiKey,
        string? baseUrl,
        string userMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await client.CompleteAsync(new LlmChatRequest
            {
                Model = setting.ActiveModel,
                Messages =
                [
                    new LlmMessage { Role = "system", Content = AiAgentPrompts.Title },
                    new LlmMessage { Role = "user", Content = userMessage.Trim() }
                ],
                Temperature = 0.2,
                MaxTokens = 40,
                ApiKey = apiKey,
                BaseUrl = baseUrl
            }, cancellationToken);

            return SanitizeTitle(response.Content);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private static string TruncateTitle(string message)
    {
        var trimmed = message.Trim().ReplaceLineEndings(" ");
        return trimmed.Length <= 80 ? trimmed : trimmed[..80] + "…";
    }

    private static string? SanitizeTitle(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var text = raw.Trim();
        var lineEnd = text.IndexOfAny(['\r', '\n']);
        if (lineEnd >= 0)
            text = text[..lineEnd].Trim();

        text = text.Trim(' ', '"', '\'', '`', '*', '#', '-', ':', '«', '»', '“', '”');
        text = Regex.Replace(text, @"\s+", " ").Trim();

        if (text.StartsWith("Titre", StringComparison.OrdinalIgnoreCase))
        {
            var colon = text.IndexOf(':');
            if (colon is >= 0 and < 12)
                text = text[(colon + 1)..].Trim().Trim('"', '«', '»', '\'');
        }

        if (text.Length == 0)
            return null;

        return text.Length <= 50 ? text : text[..50].TrimEnd();
    }
}
