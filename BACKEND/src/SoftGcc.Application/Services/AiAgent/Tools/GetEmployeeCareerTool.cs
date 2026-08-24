using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEmployeeCareerTool : AiToolBase
{
    private readonly IEmployeeService _employees;
    private readonly ICareerPlanService _careers;

    public GetEmployeeCareerTool(IEmployeeService employees, ICareerPlanService careers)
    {
        _employees = employees;
        _careers = careers;
    }

    public override string Key => "get_employee_career";
    public override string Description => "Récupère le plan de carrière / affectation actuelle d'un employé (sans salaires).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_CAREER"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "employeeId": { "type": "integer" },
            "registrationNumber": { "type": "string" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var registration = AiJson.GetString(arguments, "registrationNumber");
        if (string.IsNullOrWhiteSpace(registration))
        {
            if (!AiJson.TryGetInt(arguments, "employeeId", out var employeeId))
                throw new ValidationException("employeeId ou registrationNumber est requis.");

            var employee = await _employees.GetById(employeeId);
            if (employee is null)
                throw new NotFoundException("Employé", employeeId);

            registration = employee.RegistrationNumber;
        }

        if (string.IsNullOrWhiteSpace(registration))
            return AiJson.SerializeForLlm(new { error = "Matricule introuvable pour cet employé." });

        var career = await _careers.GetCareerByEmployee(registration);
        if (career is null)
            return AiJson.SerializeForLlm(new { registrationNumber = registration, career = (object?)null });

        return AiJson.SerializeForLlm(new
        {
            career.RegistrationNumber,
            career.Name,
            career.FirstName,
            career.HiringDate,
            career.DepartmentName,
            career.PositionName,
            career.AssignmentDate,
            career.EndingContract,
            career.Email
        });
    }
}
