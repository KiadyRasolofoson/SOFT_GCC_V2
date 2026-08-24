using SoftGcc.Domain.Enums;

namespace SoftGcc.Application.Services.AiAgent;

internal static class AiProviderNames
{
    public static readonly IReadOnlyDictionary<AiProvider, string> Map = new Dictionary<AiProvider, string>
    {
        [AiProvider.Deepseek] = "Deepseek",
        [AiProvider.OpenAI] = "OpenAI",
        [AiProvider.Ollama] = "Ollama",
        [AiProvider.Gemini] = "Gemini",
        [AiProvider.Claude] = "Claude"
    };

    public static bool TryParse(string? value, out AiProvider provider)
    {
        provider = AiProvider.Deepseek;
        if (string.IsNullOrWhiteSpace(value))
            return false;

        foreach (var pair in Map)
        {
            if (string.Equals(pair.Value, value.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                provider = pair.Key;
                return true;
            }
        }

        return false;
    }

    public static string ToName(AiProvider provider) => Map[provider];
}
