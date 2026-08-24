using System.Text.Json;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal sealed class SearchWishEvolutionsTool : AiToolBase
{
    private readonly IWishEvolutionService _wishes;

    public SearchWishEvolutionsTool(IWishEvolutionService wishes)
    {
        _wishes = wishes;
    }

    public override string Key => "search_wish_evolutions";
    public override string Description => "Recherche des souhaits d'évolution de carrière.";
    public override IReadOnlyList<string> RequiredPermissions => ["VIEW_WISH_EVOLUTION"];
    public override JsonElement ParametersSchema => Schema("""
        {
          "type": "object",
          "properties": {
            "keyword": { "type": "string" },
            "state": { "type": "string" },
            "page": { "type": "integer" }
          }
        }
        """);

    public override async Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default)
    {
        var keyword = AiJson.GetString(arguments, "keyword");
        var state = AiJson.GetString(arguments, "state");
        AiJson.TryGetInt(arguments, "page", out var page);
        if (page < 1) page = 1;

        var (data, total) = await _wishes.GetWishEvolutionFilter(keyword, null, null, null, null, null, state, page, AiJson.MaxItems);
        var items = data.Select(w => new
        {
            w.WishEvolutionCareerId,
            w.EmployeeId,
            w.RegistrationNumber,
            w.Name,
            w.FirstName,
            w.WishPositionName,
            w.WishTypeName,
            w.PriorityLetter,
            w.StateLetter,
            w.RequestDate,
            w.ActualPositionName,
            w.ActualDepartmentName
        });

        return AiJson.SerializeForLlm(new { totalCount = total, page, items });
    }
}
