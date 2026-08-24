using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SoftGcc.Application.Services.AiAgent;

internal static class AiJson
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    public const int MaxChars = 8000;
    public const int MaxItems = 20;

    public static JsonElement ParseSchema(string json) => JsonSerializer.Deserialize<JsonElement>(json);

    public static string SerializeForLlm(object? value)
    {
        if (value is null)
            return "null";

        try
        {
            var json = JsonSerializer.Serialize(value, Options);
            return Truncate(json, MaxChars);
        }
        catch (Exception ex)
        {
            return $"{{\"error\":\"Impossible de sérialiser le résultat ({ex.Message})\"}}";
        }
    }

    public static string Truncate(string text, int maxChars)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxChars)
            return text;

        return text[..maxChars] + "… [tronqué]";
    }

    public static IReadOnlyList<T> TakePage<T>(IEnumerable<T> source, int? pageSize = null)
    {
        return source.Take(pageSize is > 0 and <= MaxItems ? pageSize.Value : MaxItems).ToList();
    }

    public static bool TryGetInt(JsonElement arguments, string name, out int value)
    {
        value = 0;
        if (arguments.ValueKind != JsonValueKind.Object || !arguments.TryGetProperty(name, out var prop))
            return false;

        if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out value))
            return true;

        if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out value))
            return true;

        return false;
    }

    public static string? GetString(JsonElement arguments, string name)
    {
        if (arguments.ValueKind != JsonValueKind.Object || !arguments.TryGetProperty(name, out var prop))
            return null;

        return prop.ValueKind switch
        {
            JsonValueKind.String => prop.GetString(),
            JsonValueKind.Number => prop.GetRawText(),
            _ => null
        };
    }

    public static string ToUtf8(object value) => JsonSerializer.Serialize(value, Options);

    public static byte[] ToUtf8Bytes(object value) => Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value, Options));
}
