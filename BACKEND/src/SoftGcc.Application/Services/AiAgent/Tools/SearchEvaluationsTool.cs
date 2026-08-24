using System.Text.Json;
using SoftGcc.Application.Services.Evaluations;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class SearchEvaluationsTool : AiToolBase
{
    private readonly EvaluationHistoryService _history;

    public SearchEvaluationsTool(EvaluationHistoryService history)
    {
        _history = history;
    }

    public override string Key => "search_evaluations";
    public override string Description => "Recherche des évaluations par nom d'employé, type ou département.";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_EVALUATIONS"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "employeeName": { "type": "string" },
            "evaluationType": { "type": "string" },
            "department": { "type": "string" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var employeeName = AiJson.GetString(arguments, "employeeName");
        var evaluationType = AiJson.GetString(arguments, "evaluationType");
        var department = AiJson.GetString(arguments, "department");

        var rows = await _history.GetEvaluationHistoryAsync(null, null, evaluationType, department, employeeName);
        var items = AiJson.TakePage(rows.Select(e => new
        {
            e.EvaluationId,
            e.LastName,
            e.FirstName,
            e.Position,
            e.EvaluationType,
            e.StartDate,
            e.EndDate,
            e.OverallScore,
            e.Status
        }));

        return AiJson.SerializeForLlm(new { items });
    }
}
