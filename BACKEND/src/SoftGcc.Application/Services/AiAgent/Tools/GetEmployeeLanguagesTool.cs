using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetEmployeeLanguagesTool : AiToolBase
{
    private readonly IEmployeeLanguageService _languages;

    public GetEmployeeLanguagesTool(IEmployeeLanguageService languages)
    {
        _languages = languages;
    }

    public override string Key => "get_employee_languages";
    public override string Description => "Liste les langues parlées par un employé.";
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

        var rows = await _languages.GetEmployeeLanguages(employeeId);
        var items = AiJson.TakePage(rows.Select(l => new
        {
            l.EmployeeLanguageId,
            l.LanguageName,
            l.Level
        }));

        return AiJson.SerializeForLlm(new { employeeId, items });
    }
}
