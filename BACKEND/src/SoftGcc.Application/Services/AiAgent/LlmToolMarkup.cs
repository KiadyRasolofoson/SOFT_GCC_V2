using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using SoftGcc.Application.Common.Interfaces.AiAgent;

namespace SoftGcc.Application.Services.AiAgent;

public static class LlmToolMarkup
{
    private static readonly Regex DsmlBlock = new(
        @"<\s*/?\s*[|｜]{0,4}\s*DSML\s*[|｜]{0,4}[^>]*>",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DsmlToolCalls = new(
        @"<\s*[^>]*DSML[^>]*tool_calls[^>]*>[\s\S]*?<\s*/\s*[^>]*DSML[^>]*tool_calls[^>]*>",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex InvokeBlock = new(
        @"invoke\s+name\s*=\s*[""']([^""']+)[""'][^>]*>([\s\S]*?)<\s*/[^>]*invoke",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex ParameterBlock = new(
        @"parameter\s+name\s*=\s*[""']([^""']+)[""'][^>]*>([\s\S]*?)<\s*/[^>]*parameter",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex XmlToolCalls = new(
        @"<\s*tool_calls\s*>[\s\S]*?<\s*/\s*tool_calls\s*>",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DeepSeekTokenBlock = new(
        @"<\|?｜tool[\s▁]*calls[\s▁]*begin\|?｜>[\s\S]*?<\|?｜tool[\s▁]*calls[\s▁]*end\|?｜>",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DeepSeekTokens = new(
        @"<\|?｜tool[\s▁][^>]*\|?｜>",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static (string? Content, IReadOnlyList<LlmToolCall> ToolCalls) Extract(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return (content, Array.Empty<LlmToolCall>());

        var calls = new List<LlmToolCall>();
        foreach (Match block in DsmlToolCalls.Matches(content))
            calls.AddRange(ParseInvokes(block.Value));
        foreach (Match block in XmlToolCalls.Matches(content))
            calls.AddRange(ParseInvokes(block.Value));

        return (Strip(content), calls);
    }

    public static string Strip(string? content)
    {
        if (string.IsNullOrEmpty(content))
            return content ?? string.Empty;

        var cleaned = DsmlToolCalls.Replace(content, string.Empty);
        cleaned = XmlToolCalls.Replace(cleaned, string.Empty);
        cleaned = DeepSeekTokenBlock.Replace(cleaned, string.Empty);
        cleaned = DsmlBlock.Replace(cleaned, string.Empty);
        cleaned = DeepSeekTokens.Replace(cleaned, string.Empty);
        cleaned = Regex.Replace(cleaned, @"[ \t]+\n", "\n");
        cleaned = Regex.Replace(cleaned, @"\n{3,}", "\n\n");
        return cleaned.Trim();
    }

    private static IEnumerable<LlmToolCall> ParseInvokes(string block)
    {
        foreach (Match invoke in InvokeBlock.Matches(block))
        {
            var name = invoke.Groups[1].Value.Trim();
            if (string.IsNullOrWhiteSpace(name))
                continue;

            var args = new Dictionary<string, object?>();
            foreach (Match param in ParameterBlock.Matches(invoke.Groups[2].Value))
                args[param.Groups[1].Value.Trim()] = Coerce(param.Groups[2].Value);

            yield return new LlmToolCall
            {
                Id = Guid.NewGuid().ToString("N"),
                Name = name,
                ArgumentsJson = JsonSerializer.Serialize(args)
            };
        }
    }

    private static object? Coerce(string raw)
    {
        var value = raw.Trim();
        if (value.Length == 0)
            return "";
        if (bool.TryParse(value, out var flag))
            return flag;
        if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var integer))
            return integer;
        if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number))
            return number;
        return value;
    }
}
