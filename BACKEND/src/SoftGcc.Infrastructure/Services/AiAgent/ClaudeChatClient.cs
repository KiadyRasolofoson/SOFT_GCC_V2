using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Infrastructure.Services.AiAgent;

public sealed class ClaudeChatClient : ILlmChatClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;

    public ClaudeChatClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<LlmChatResponse> CompleteAsync(LlmChatRequest request, CancellationToken cancellationToken = default)
    {
        var baseUrl = (request.BaseUrl ?? "https://api.anthropic.com").Trim().TrimEnd('/');
        var url = baseUrl.EndsWith("/v1", StringComparison.OrdinalIgnoreCase)
            ? $"{baseUrl}/messages"
            : $"{baseUrl}/v1/messages";

        var system = request.Messages.FirstOrDefault(m => m.Role == "system")?.Content;
        var payload = new Dictionary<string, object?>
        {
            ["model"] = request.Model,
            ["max_tokens"] = request.MaxTokens,
            ["temperature"] = request.Temperature,
            ["messages"] = BuildMessages(request.Messages)
        };

        if (!string.IsNullOrWhiteSpace(system))
            payload["system"] = system;

        if (request.Tools is { Count: > 0 })
        {
            payload["tools"] = request.Tools.Select(t => new
            {
                name = t.Name,
                description = t.Description,
                input_schema = t.ParametersSchema
            }).ToList();
        }

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Headers.TryAddWithoutValidation("x-api-key", request.ApiKey ?? string.Empty);
        httpRequest.Headers.TryAddWithoutValidation("anthropic-version", "2023-06-01");
        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            if (request.Tools is { Count: > 0 } && body.Contains("tool", StringComparison.OrdinalIgnoreCase))
            {
                return new LlmChatResponse { ToolsRejectedByProvider = true, ToolCalls = Array.Empty<LlmToolCall>() };
            }

            throw new LlmProviderException($"Claude a renvoyé {(int)response.StatusCode} : {Truncate(body)}");
        }

        using var doc = JsonDocument.Parse(body);
        var texts = new List<string>();
        var toolCalls = new List<LlmToolCall>();

        if (doc.RootElement.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
        {
            foreach (var block in content.EnumerateArray())
            {
                var type = block.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : null;
                if (type == "text")
                    texts.Add(block.GetProperty("text").GetString() ?? string.Empty);
                else if (type == "tool_use")
                {
                    toolCalls.Add(new LlmToolCall
                    {
                        Id = block.GetProperty("id").GetString() ?? Guid.NewGuid().ToString("N"),
                        Name = block.GetProperty("name").GetString() ?? string.Empty,
                        ArgumentsJson = block.TryGetProperty("input", out var input)
                            ? input.GetRawText()
                            : "{}"
                    });
                }
            }
        }

        return new LlmChatResponse
        {
            Content = string.Join("\n", texts.Where(t => !string.IsNullOrWhiteSpace(t))),
            ToolCalls = toolCalls
        };
    }

    private static List<object> BuildMessages(IReadOnlyList<LlmMessage> messages)
    {
        var result = new List<object>();
        foreach (var message in messages)
        {
            if (message.Role == "system")
                continue;

            if (message.Role == "tool")
            {
                result.Add(new
                {
                    role = "user",
                    content = new object[]
                    {
                        new
                        {
                            type = "tool_result",
                            tool_use_id = message.ToolCallId,
                            content = message.Content ?? string.Empty
                        }
                    }
                });
                continue;
            }

            if (message.ToolCalls is { Count: > 0 })
            {
                var blocks = new List<object>();
                if (!string.IsNullOrWhiteSpace(message.Content))
                    blocks.Add(new { type = "text", text = message.Content });

                foreach (var call in message.ToolCalls)
                {
                    blocks.Add(new
                    {
                        type = "tool_use",
                        id = call.Id,
                        name = call.Name,
                        input = TryParse(call.ArgumentsJson)
                    });
                }

                result.Add(new { role = "assistant", content = blocks });
                continue;
            }

            result.Add(new
            {
                role = message.Role == "assistant" ? "assistant" : "user",
                content = message.Content ?? string.Empty
            });
        }

        return result;
    }

    private static object TryParse(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(json)
                   ?? new Dictionary<string, object?>();
        }
        catch (JsonException)
        {
            return new Dictionary<string, object?>();
        }
    }

    private static string Truncate(string text) =>
        string.IsNullOrEmpty(text) || text.Length <= 500 ? text : text[..500];
}
