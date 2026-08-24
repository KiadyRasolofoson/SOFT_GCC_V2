using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class SearchEmployeesTool : AiToolBase
{
    private readonly IEmployeeService _employees;

    public SearchEmployeesTool(IEmployeeService employees)
    {
        _employees = employees;
    }

    public override string Key => "search_employees";
    public override string Description =>
        "Recherche des employés par nom, prénom, matricule ou département. Lecture seule, résultats paginés.";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_EMPLOYEES"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "keyword": { "type": "string", "description": "Nom, prénom ou matricule" },
            "departmentId": { "type": "string", "description": "Identifiant du département (optionnel)" },
            "page": { "type": "integer", "description": "Page (défaut 1)" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var keyword = AiJson.GetString(arguments, "keyword");
        var departmentId = AiJson.GetString(arguments, "departmentId");
        AiJson.TryGetInt(arguments, "page", out var page);
        if (page < 1) page = 1;

        var (data, total) = await _employees.GetEmployeeFilter(keyword, departmentId, null, null, page, AiJson.MaxItems);
        var items = data.Select(e => new
        {
            e.EmployeeId,
            e.RegistrationNumber,
            e.Name,
            e.FirstName,
            e.DepartmentName,
            e.HiringDate,
            e.ManagerName,
            e.ManagerFirstName
        });

        return AiJson.SerializeForLlm(new { totalCount = total, page, items });
    }
}
