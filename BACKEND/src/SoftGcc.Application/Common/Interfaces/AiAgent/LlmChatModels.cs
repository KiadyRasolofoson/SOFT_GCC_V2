using System.Text.Json;

namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public sealed class LlmChatRequest
{
    public required string Model { get; init; }
    public required IReadOnlyList<LlmMessage> Messages { get; init; }
    public IReadOnlyList<LlmToolDefinition>? Tools { get; init; }
    public double Temperature { get; init; } = 0.3;
    public int MaxTokens { get; init; } = 2048;
    public string? ApiKey { get; init; }
    public string? BaseUrl { get; init; }
}

public sealed class LlmMessage
{
    public required string Role { get; init; }
    public string? Content { get; init; }
    public string? Name { get; init; }
    public string? ToolCallId { get; init; }
    public IReadOnlyList<LlmToolCall>? ToolCalls { get; init; }
}

public sealed class LlmToolCall
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string ArgumentsJson { get; init; }
}

public sealed class LlmToolDefinition
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required JsonElement ParametersSchema { get; init; }
}

public sealed class LlmChatResponse
{
    public string? Content { get; init; }
    public IReadOnlyList<LlmToolCall> ToolCalls { get; init; } = Array.Empty<LlmToolCall>();
    public bool ToolsRejectedByProvider { get; init; }
}
