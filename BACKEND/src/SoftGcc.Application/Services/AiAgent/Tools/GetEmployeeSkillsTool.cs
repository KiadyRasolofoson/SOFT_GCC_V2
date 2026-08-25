using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEmployeeSkillsTool : AiToolBase
{
    private readonly IEmployeeSkillService _skills;

    public GetEmployeeSkillsTool(IEmployeeSkillService skills)
    {
        _skills = skills;
    }

    public override string Key => "get_employee_skills";
    public override string Description => "Liste les compétences d'un employé (domaine, nom, niveau).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_SKILLS_PROFILES"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "employeeId": { "type": "integer" }
          },
          "required": ["employeeId"]
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        if (!AiJson.TryGetInt(arguments, "employeeId", out var employeeId))
            throw new ValidationException("employeeId est requis.");

        var skills = await _skills.GetEmployeeSkills(employeeId);
        var items = AiJson.TakePage(skills.Select(s => new
        {
            s.EmployeeSkillId,
            s.DomainSkillName,
            s.SkillName,
            s.Level,
            s.AcquiredLevel,
            s.SkillVersionId,
            s.Source,
            s.State
        }));

        return AiJson.SerializeForLlm(new { employeeId, items });
    }
}
