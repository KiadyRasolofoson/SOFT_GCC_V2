using SoftGcc.Application.Dtos.AiAgent;
using SoftGcc.Domain.Enums;

namespace SoftGcc.Application.Services.AiAgent;

public static class AiProviderCatalog
{
    public static readonly IReadOnlyList<AiProviderCatalogDto> All =
    [
        new()
        {
            Id = "Deepseek",
            DisplayName = "Deepseek",
            RequiresApiKey = true,
            SupportsTools = true,
            DefaultBaseUrl = "https://api.deepseek.com",
            SuggestedModels = ["deepseek-chat", "deepseek-reasoner"]
        },
        new()
        {
            Id = "OpenAI",
            DisplayName = "OpenAI",
            RequiresApiKey = true,
            SupportsTools = true,
            DefaultBaseUrl = "https://api.openai.com/v1",
            SuggestedModels = ["gpt-4o", "gpt-4o-mini"]
        },
        new()
        {
            Id = "Ollama",
            DisplayName = "Ollama (local)",
            RequiresApiKey = false,
            SupportsTools = true,
            DefaultBaseUrl = "http://localhost:11434/v1",
            SuggestedModels = ["llama3.1", "mistral", "qwen2.5"]
        },
        new()
        {
            Id = "Gemini",
            DisplayName = "Google Gemini",
            RequiresApiKey = true,
            SupportsTools = true,
            DefaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta",
            SuggestedModels = ["gemini-2.0-flash", "gemini-1.5-pro"]
        },
        new()
        {
            Id = "Claude",
            DisplayName = "Anthropic Claude",
            RequiresApiKey = true,
            SupportsTools = true,
            DefaultBaseUrl = "https://api.anthropic.com",
            SuggestedModels = ["claude-sonnet-4-20250514", "claude-3-5-haiku-latest"]
        }
    ];

    public static AiProviderCatalogDto? Get(string provider) =>
        All.FirstOrDefault(p => string.Equals(p.Id, provider, StringComparison.OrdinalIgnoreCase));

    public static AiProviderCatalogDto GetRequired(AiProvider provider) =>
        Get(AiProviderNames.ToName(provider))
        ?? throw new InvalidOperationException($"Provider inconnu : {provider}");
}
