using System.Text.Json;
using MediatR;
using SoftGcc.Application.Positions.Queries.GetPositions;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class SearchPositionsTool : AiToolBase
{
    private readonly IMediator _mediator;

    public SearchPositionsTool(IMediator mediator)
    {
        _mediator = mediator;
    }

    public override string Key => "search_positions";
    public override string Description => "Liste ou filtre les postes de l'entreprise.";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_POSITIONS"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "keyword": { "type": "string", "description": "Filtre sur le nom du poste" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var keyword = AiJson.GetString(arguments, "keyword");
        var positions = await _mediator.Send(new GetPositionsQuery(), cancellationToken);
        var filtered = positions.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            filtered = filtered.Where(p =>
                p.PositionName != null &&
                p.PositionName.Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }

        var items = AiJson.TakePage(filtered.Select(p => new { p.PositionId, p.PositionName }));
        return AiJson.SerializeForLlm(new { items });
    }
}
