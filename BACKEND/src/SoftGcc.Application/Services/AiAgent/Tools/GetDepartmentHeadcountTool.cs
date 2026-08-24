using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetDepartmentHeadcountTool : AiToolBase
{
    private readonly IOrgService _org;

    public GetDepartmentHeadcountTool(IOrgService org)
    {
        _org = org;
    }

    public override string Key => "get_department_headcount";
    public override string Description => "Effectif par département.";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_ORGANIZATION"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {}
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var rows = await _org.GetNEmployeeByDepartment();
        var items = AiJson.TakePage(rows.Select(r => new
        {
            r.DepartmentId,
            r.DepartmentName,
            headcount = r.NEmployee
        }));
        return AiJson.SerializeForLlm(new { items });
    }
}
