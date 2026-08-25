using System.Globalization;

namespace SoftGcc.Domain.SkillReferential;

public static class ReferentialCode
{
    public const string DomainPrefix = "DOMAIN-";
    public const string FamilyPrefix = "FAM-";
    public const string SkillPrefix = "SKILL-";

    public static string Suggest(IEnumerable<string> existingCodes, string sequentialPrefix)
    {
        var existing = existingCodes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToList();
        return NextSequential(sequentialPrefix, existing);
    }

    public static string NextSequential(string prefix, IEnumerable<string> existingCodes)
    {
        var max = 0;
        foreach (var code in existingCodes)
        {
            if (code.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                && int.TryParse(code[prefix.Length..], NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
            {
                max = Math.Max(max, n);
            }
        }

        return $"{prefix}{(max + 1).ToString("D5", CultureInfo.InvariantCulture)}";
    }

    public static string Normalize(string code) => code.Trim().ToUpperInvariant();
}
