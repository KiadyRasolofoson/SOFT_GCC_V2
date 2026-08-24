using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Infrastructure.Services.AiAgent;

public sealed class GeminiChatClient : ILlmChatClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;

    public GeminiChatClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<LlmChatResponse> CompleteAsync(LlmChatRequest request, CancellationToken cancellationToken = default)
    {
        var baseUrl = (request.BaseUrl ?? "https://generativelanguage.googleapis.com/v1beta").Trim().TrimEnd('/');
        var url = $"{baseUrl}/models/{Uri.EscapeDataString(request.Model)}:generateContent";
        if (!string.IsNullOrWhiteSpace(request.ApiKey))
            url += $"?key={Uri.EscapeDataString(request.ApiKey)}";

        var system = request.Messages.FirstOrDefault(m => m.Role == "system")?.Content;
        var contents = BuildContents(request.Messages);

        var payload = new Dictionary<string, object?>
        {
            ["contents"] = contents,
            ["generationConfig"] = new
            {
                temperature = request.Temperature,
                maxOutputTokens = request.MaxTokens
            }
        };

        if (!string.IsNullOrWhiteSpace(system))
        {
            payload["systemInstruction"] = new
            {
                parts = new[] { new { text = system } }
            };
        }

        if (request.Tools is { Count: > 0 })
        {
            payload["tools"] = new[]
            {
                new
                {
                    functionDeclarations = request.Tools.Select(t => new
                    {
                        name = t.Name,
                        description = t.Description,
                        parameters = t.ParametersSchema
                    }).ToList()
                }
            };
        }

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
        };

        using var response = await _http.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            if (request.Tools is { Count: > 0 } && body.Contains("function", StringComparison.OrdinalIgnoreCase))
            {
                return new LlmChatResponse { ToolsRejectedByProvider = true, ToolCalls = Array.Empty<LlmToolCall>() };
            }

            throw new LlmProviderException($"Gemini a renvoyé {(int)response.StatusCode} : {Truncate(body)}");
        }

        using var doc = JsonDocument.Parse(body);
        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            return new LlmChatResponse { Content = string.Empty, ToolCalls = Array.Empty<LlmToolCall>() };

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        var texts = new List<string>();
        var toolCalls = new List<LlmToolCall>();

        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textEl) && textEl.ValueKind == JsonValueKind.String)
                texts.Add(textEl.GetString() ?? string.Empty);

            if (part.TryGetProperty("functionCall", out var fn))
            {
                var name = fn.GetProperty("name").GetString() ?? string.Empty;
                var args = fn.TryGetProperty("args", out var argsEl) ? argsEl.GetRawText() : "{}";
                toolCalls.Add(new LlmToolCall
                {
                    Id = $"gemini-{name}-{toolCalls.Count + 1}",
                    Name = name,
                    ArgumentsJson = args
                });
            }
        }

        return new LlmChatResponse
        {
            Content = string.Join("\n", texts.Where(t => !string.IsNullOrWhiteSpace(t))),
            ToolCalls = toolCalls
        };
    }

    private static List<object> BuildContents(IReadOnlyList<LlmMessage> messages)
    {
        var contents = new List<object>();
        foreach (var message in messages)
        {
            if (message.Role == "system")
                continue;

            if (message.Role == "tool")
            {
                contents.Add(new
                {
                    role = "user",
                    parts = new object[]
                    {
                        new
                        {
                            functionResponse = new
                            {
                                name = message.Name,
                                response = TryParseObject(message.Content)
                            }
                        }
                    }
                });
                continue;
            }

            if (message.ToolCalls is { Count: > 0 })
            {
                var parts = new List<object>();
                if (!string.IsNullOrWhiteSpace(message.Content))
                    parts.Add(new { text = message.Content });

                foreach (var call in message.ToolCalls)
                {
                    parts.Add(new
                    {
                        functionCall = new
                        {
                            name = call.Name,
                            args = TryParseObject(call.ArgumentsJson)
                        }
                    });
                }

                contents.Add(new { role = "model", parts });
                continue;
            }

            contents.Add(new
            {
                role = message.Role == "assistant" ? "model" : "user",
                parts = new object[] { new { text = message.Content ?? string.Empty } }
            });
        }

        return contents;
    }

    private static object TryParseObject(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, object?>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(json)
                   ?? new Dictionary<string, object?>();
        }
        catch (JsonException)
        {
            return new Dictionary<string, object?> { ["result"] = json };
        }
    }

    private static string Truncate(string text) =>
        string.IsNullOrEmpty(text) || text.Length <= 500 ? text : text[..500];
}
