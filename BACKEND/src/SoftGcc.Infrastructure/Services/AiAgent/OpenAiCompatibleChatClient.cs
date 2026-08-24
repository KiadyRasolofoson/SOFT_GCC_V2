using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Infrastructure.Services.AiAgent;

public sealed class OpenAiCompatibleChatClient : ILlmChatClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;

    public OpenAiCompatibleChatClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<LlmChatResponse> CompleteAsync(LlmChatRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            return await SendAsync(request, includeTools: request.Tools is { Count: > 0 }, cancellationToken);
        }
        catch (LlmProviderException ex) when (request.Tools is { Count: > 0 } && LooksLikeToolsUnsupported(ex.Message))
        {
            var fallback = await SendAsync(request, includeTools: false, cancellationToken);
            return new LlmChatResponse
            {
                Content = fallback.Content,
                ToolCalls = Array.Empty<LlmToolCall>(),
                ToolsRejectedByProvider = true
            };
        }
    }

    private async Task<LlmChatResponse> SendAsync(LlmChatRequest request, bool includeTools, CancellationToken cancellationToken)
    {
        var url = Combine(request.BaseUrl, "/chat/completions");
        var payload = new Dictionary<string, object?>
        {
            ["model"] = request.Model,
            ["temperature"] = request.Temperature,
            ["max_tokens"] = request.MaxTokens,
            ["messages"] = request.Messages.Select(MapMessage).ToList()
        };

        if (includeTools && request.Tools is { Count: > 0 })
        {
            payload["tools"] = request.Tools.Select(t => new
            {
                type = "function",
                function = new
                {
                    name = t.Name,
                    description = t.Description,
                    parameters = t.ParametersSchema
                }
            }).ToList();
        }

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        if (!string.IsNullOrWhiteSpace(request.ApiKey))
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.ApiKey);

        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new LlmProviderException($"Le fournisseur a renvoyé {(int)response.StatusCode} : {Truncate(body)}");

        using var doc = JsonDocument.Parse(body);
        var choice = doc.RootElement.GetProperty("choices")[0].GetProperty("message");
        var content = choice.TryGetProperty("content", out var contentEl) && contentEl.ValueKind == JsonValueKind.String
            ? contentEl.GetString()
            : null;

        var toolCalls = new List<LlmToolCall>();
        if (choice.TryGetProperty("tool_calls", out var toolsEl) && toolsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var tool in toolsEl.EnumerateArray())
            {
                var id = tool.TryGetProperty("id", out var idEl) ? idEl.GetString() : Guid.NewGuid().ToString("N");
                var fn = tool.GetProperty("function");
                toolCalls.Add(new LlmToolCall
                {
                    Id = id ?? Guid.NewGuid().ToString("N"),
                    Name = fn.GetProperty("name").GetString() ?? string.Empty,
                    ArgumentsJson = fn.TryGetProperty("arguments", out var argsEl) ? argsEl.GetString() ?? "{}" : "{}"
                });
            }
        }

        return new LlmChatResponse
        {
            Content = content,
            ToolCalls = toolCalls
        };
    }

    private static object MapMessage(LlmMessage message)
    {
        if (message.Role == "tool")
        {
            return new
            {
                role = "tool",
                content = message.Content ?? string.Empty,
                tool_call_id = message.ToolCallId,
                name = message.Name
            };
        }

        if (message.ToolCalls is { Count: > 0 })
        {
            return new
            {
                role = "assistant",
                content = message.Content,
                tool_calls = message.ToolCalls.Select(c => new
                {
                    id = c.Id,
                    type = "function",
                    function = new { name = c.Name, arguments = c.ArgumentsJson }
                }).ToList()
            };
        }

        return new
        {
            role = message.Role,
            content = message.Content ?? string.Empty
        };
    }

    private static bool LooksLikeToolsUnsupported(string message)
    {
        if (message.Contains("preceding message", StringComparison.OrdinalIgnoreCase)
            || message.Contains("tool_calls", StringComparison.OrdinalIgnoreCase)
               && message.Contains("must be a response", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return message.Contains("not support", StringComparison.OrdinalIgnoreCase)
            || message.Contains("unsupported", StringComparison.OrdinalIgnoreCase)
            || message.Contains("does not have access to tools", StringComparison.OrdinalIgnoreCase);
    }

    private static string Combine(string? baseUrl, string path)
    {
        var root = string.IsNullOrWhiteSpace(baseUrl) ? "https://api.deepseek.com" : baseUrl.Trim().TrimEnd('/');
        return root + path;
    }

    private static string Truncate(string text) =>
        string.IsNullOrEmpty(text) || text.Length <= 500 ? text : text[..500];
}
