using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEvaluationTool : AiToolBase
{
    private readonly IGenericRepository<Evaluation> _evaluations;
    private readonly ISensitiveDataFilterService _sensitiveFilter;

    public GetEvaluationTool(IGenericRepository<Evaluation> evaluations, ISensitiveDataFilterService sensitiveFilter)
    {
        _evaluations = evaluations;
        _sensitiveFilter = sensitiveFilter;
    }

    public override string Key => "get_evaluation";
    public override string Description => "Détail d'une évaluation par identifiant (champs sensibles filtrés selon le rôle).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_EVALUATIONS"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "evaluationId": { "type": "integer" }
          },
          "required": ["evaluationId"]
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        if (!AiJson.TryGetInt(arguments, "evaluationId", out var evaluationId))
            throw new ValidationException("evaluationId est requis.");

        var evaluation = await _evaluations.GetByIdAsync(evaluationId);
        if (evaluation is null)
            throw new NotFoundException("Évaluation", evaluationId);

        evaluation = await _sensitiveFilter.FilterEvaluationAsync(evaluation, userId);

        return AiJson.SerializeForLlm(new
        {
            evaluation.EvaluationId,
            evaluation.EmployeeId,
            evaluation.EvaluationTypeId,
            evaluation.StartDate,
            evaluation.EndDate,
            evaluation.OverallScore,
            evaluation.Comments,
            evaluation.strengths,
            evaluation.weaknesses,
            evaluation.state,
            status = evaluation.Status.ToString(),
            evaluation.completionDate
        });
    }
}
