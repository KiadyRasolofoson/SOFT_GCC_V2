using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEmployeeEducationTool : AiToolBase
{
    private readonly IEmployeeEducationService _educations;

    public GetEmployeeEducationTool(IEmployeeEducationService educations)
    {
        _educations = educations;
    }

    public override string Key => "get_employee_education";
    public override string Description => "Liste les formations / diplômes d'un employé.";
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

        var rows = await _educations.GetEmployeeEducations(employeeId);
        var items = AiJson.TakePage(rows.Select(e => new
        {
            e.EmployeeEducationId,
            e.SchoolName,
            e.DegreeName,
            e.StudyPathName,
            e.StartDate,
            e.EndingDate
        }));

        return AiJson.SerializeForLlm(new { employeeId, items });
    }
}
