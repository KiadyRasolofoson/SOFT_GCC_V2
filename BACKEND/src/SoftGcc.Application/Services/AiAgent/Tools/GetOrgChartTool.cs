using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.entrepriseOrg;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class GetOrgChartTool : AiToolBase
{
    private readonly IOrgService _org;

    public GetOrgChartTool(IOrgService org)
    {
        _org = org;
    }

    public override string Key => "get_org_chart";
    public override string Description => "Retourne un aperçu aplati de l'organigramme (max 50 nœuds).";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_ORGANIZATION"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {}
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var roots = await _org.GetOrgChart();
        var flat = new List<object>();
        Flatten(roots, parentId: null, flat, remaining: 50);
        return AiJson.SerializeForLlm(new { nodeCount = flat.Count, nodes = flat });
    }

    private static void Flatten(IEnumerable<EmployeeNode> nodes, int? parentId, List<object> target, int remaining)
    {
        foreach (var node in nodes)
        {
            if (target.Count >= remaining)
                return;

            target.Add(new
            {
                node.EmployeeId,
                node.Name,
                node.FirstName,
                node.Department,
                node.Position,
                parentEmployeeId = parentId
            });

            if (node.Children.Count > 0)
                Flatten(node.Children, node.EmployeeId, target, remaining);
        }
    }
}
