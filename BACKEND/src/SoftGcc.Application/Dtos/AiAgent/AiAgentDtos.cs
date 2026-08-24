namespace SoftGcc.Application.Dtos.AiAgent;

public sealed class AiChatRequestDto
{
    public int? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Mode { get; set; }
}

public sealed class AiChatResponseDto
{
    public int ConversationId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Reply { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public IReadOnlyList<string> ToolsUsed { get; set; } = Array.Empty<string>();
    public string? Warning { get; set; }
}

public sealed class AiConversationSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string LastMode { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public sealed class AiConversationDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string LastMode { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public IReadOnlyList<AiMessageDto> Messages { get; set; } = Array.Empty<AiMessageDto>();
}

public sealed class AiMessageDto
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ToolName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class AiAgentSettingsDto
{
    public string ActiveProvider { get; set; } = string.Empty;
    public string ActiveModel { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public int MaxTokens { get; set; }
    public int MaxToolRounds { get; set; }
    public double Temperature { get; set; }
    public IReadOnlyList<AiProviderConfigDto> Providers { get; set; } = Array.Empty<AiProviderConfigDto>();
}

public sealed class UpdateAiAgentSettingsDto
{
    public string? Provider { get; set; }
    public string? Model { get; set; }
    public bool? IsEnabled { get; set; }
    public int? MaxTokens { get; set; }
    public int? MaxToolRounds { get; set; }
    public double? Temperature { get; set; }
}

public sealed class AiProviderCatalogDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool RequiresApiKey { get; set; }
    public bool SupportsTools { get; set; }
    public string DefaultBaseUrl { get; set; } = string.Empty;
    public IReadOnlyList<string> SuggestedModels { get; set; } = Array.Empty<string>();
}

public sealed class AiProviderConfigDto
{
    public string Provider { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public string? DefaultModel { get; set; }
    public bool HasApiKey { get; set; }
}

public sealed class UpdateAiProviderConfigDto
{
    public string? ApiKey { get; set; }
    public string? BaseUrl { get; set; }
    public string? DefaultModel { get; set; }
    public bool ClearApiKey { get; set; }
}

public sealed class AiProviderTestResultDto
{
    public bool Success { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed class AiToolsCatalogDto
{
    public IReadOnlyList<AiToolInfoDto> Tools { get; set; } = Array.Empty<AiToolInfoDto>();
}

public sealed class AiToolInfoDto
{
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IReadOnlyList<string> RequiredPermissions { get; set; } = Array.Empty<string>();
    public bool AllowedForCurrentUser { get; set; }
}

public sealed class AiToolPermissionDto
{
    public int Id { get; set; }
    public int? RoleId { get; set; }
    public int? UserId { get; set; }
    public string ToolKey { get; set; } = string.Empty;
    public bool IsAllowed { get; set; }
}

public sealed class ReplaceAiToolPermissionsDto
{
    public IReadOnlyList<UpsertAiToolPermissionDto> Items { get; set; } = Array.Empty<UpsertAiToolPermissionDto>();
}

public sealed class UpsertAiToolPermissionDto
{
    public int? RoleId { get; set; }
    public int? UserId { get; set; }
    public string ToolKey { get; set; } = string.Empty;
    public bool IsAllowed { get; set; }
}
