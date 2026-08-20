namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>Type de réponse exposé au client, avec libellés de repli si la base est incomplète.</summary>
public sealed record ResponseTypeSummaryDto(
    int ResponseTypeId,
    string TypeName,
    string Description);
