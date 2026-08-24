using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetDashboardKpisTool : AiToolBase
{
    private readonly IDashboardService _dashboard;

    public GetDashboardKpisTool(IDashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    public override string Key => "get_dashboard_kpis";
    public override string Description => "Indicateurs RH globaux (effectifs, compétences, souhaits, attestations).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_DASHBOARD"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {}
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var employeeCount = await _dashboard.GetEmployeeCount();
        var wishTotal = await _dashboard.GetWishEvolutionTotal();
        var avgSkills = await _dashboard.GetAverageSkillPerEmployee();
        var attestations = await _dashboard.GetNumberAllAttestation();
        var coverage = await _dashboard.GetCoverageRatios();
        var skillRepertory = await _dashboard.GetSkillRepertory();
        var activePositions = await _dashboard.GetActivePosition();

        return AiJson.SerializeForLlm(new
        {
            employeeCount,
            wishEvolutionTotal = wishTotal,
            averageSkillPerEmployee = avgSkills,
            attestationsCount = attestations,
            coverageRatio = coverage,
            skillRepertoryCount = skillRepertory,
            activePositions
        });
    }
}
