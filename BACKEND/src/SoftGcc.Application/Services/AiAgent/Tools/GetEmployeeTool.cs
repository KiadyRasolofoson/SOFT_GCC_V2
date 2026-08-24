using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEmployeeTool : AiToolBase
{
    private readonly IEmployeeService _employees;

    public GetEmployeeTool(IEmployeeService employees)
    {
        _employees = employees;
    }

    public override string Key => "get_employee";
    public override string Description => "Récupère la fiche d'un employé par identifiant (sans photo).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_EMPLOYEES"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "employeeId": { "type": "integer", "description": "Identifiant interne de l'employé" }
          },
          "required": ["employeeId"]
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        if (!AiJson.TryGetInt(arguments, "employeeId", out var employeeId))
            throw new ValidationException("employeeId est requis.");

        var employee = await _employees.GetById(employeeId);
        if (employee is null)
            throw new NotFoundException("Employé", employeeId);

        return AiJson.SerializeForLlm(new
        {
            employee.EmployeeId,
            employee.RegistrationNumber,
            employee.Name,
            employee.FirstName,
            employee.Birthday,
            employee.Department_id,
            employee.Hiring_date,
            employee.CiviliteId,
            employee.ManagerId,
            employee.Email
        });
    }
}
