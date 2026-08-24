using SoftGcc.Domain.Enums;

namespace SoftGcc.Application.Services.AiAgent;

internal static class AiAgentModeDetector
{
    private static readonly string[] AnalyseKeywords =
    [
        "résume", "resume", "résumé", "analyse", "analyzer", "compare", "comparaison",
        "tendance", "risque", "synthèse", "synthese", "recommande", "recommandation",
        "pourquoi", "forces", "faiblesses", "bilan"
    ];

    private static readonly string[] DataKeywords =
    [
        "fiche", "employé", "employe", "évaluation", "evaluation", "compétence", "competence",
        "retraite", "souhait", "poste", "organigramme", "dashboard", "kpi", "matricule",
        "département", "departement", "carrière", "carriere", "effectif", "langue", "diplôme", "diplome"
    ];

    public static string Detect(string message, string? forcedMode)
    {
        if (TryNormalize(forcedMode, out var forced))
            return forced;

        var text = message.ToLowerInvariant();
        if (AnalyseKeywords.Any(k => text.Contains(k, StringComparison.Ordinal)))
            return nameof(AiAgentMode.Analyse);
        if (DataKeywords.Any(k => text.Contains(k, StringComparison.Ordinal)))
            return nameof(AiAgentMode.Data);

        return nameof(AiAgentMode.Chat);
    }

    public static bool TryNormalize(string? value, out string mode)
    {
        mode = nameof(AiAgentMode.Chat);
        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (Enum.TryParse<AiAgentMode>(value.Trim(), true, out var parsed))
        {
            mode = parsed.ToString();
            return true;
        }

        return false;
    }
}
