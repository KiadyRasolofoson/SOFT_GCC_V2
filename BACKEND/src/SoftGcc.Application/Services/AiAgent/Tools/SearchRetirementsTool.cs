using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class SearchRetirementsTool : AiToolBase
{
    private readonly IRetirementService _retirements;

    public SearchRetirementsTool(IRetirementService retirements)
    {
        _retirements = retirements;
    }

    public override string Key => "search_retirements";
    public override string Description => "Recherche des départs à la retraite prévus (sans salaires).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_RETIREMENT"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "keyword": { "type": "string" },
            "departmentId": { "type": "string" },
            "year": { "type": "string", "description": "Année de départ" },
            "page": { "type": "integer" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var keyword = AiJson.GetString(arguments, "keyword");
        var departmentId = AiJson.GetString(arguments, "departmentId");
        var year = AiJson.GetString(arguments, "year");
        AiJson.TryGetInt(arguments, "page", out var page);
        if (page < 1) page = 1;

        var (data, total) = await _retirements.GetRetirementFilter(keyword, null, departmentId, null, null, year, page, AiJson.MaxItems);
        var items = data.Select(r => new
        {
            r.RegistrationNumber,
            r.Name,
            r.FirstName,
            r.DepartmentName,
            r.PositionName,
            r.Age,
            r.DateDepart,
            r.YearRetirement
        });

        return AiJson.SerializeForLlm(new { totalCount = total, page, items });
    }
}
