namespace soft_carriere_competence.Application.Common;

/// <summary>
/// Paramètres de pagination normalisés. Le plafonnement de <see cref="PageSize"/> protège
/// la base d'une requête volontairement démesurée depuis le client.
/// </summary>
public sealed record PageRequest
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    private PageRequest(int pageNumber, int pageSize)
    {
        PageNumber = pageNumber;
        PageSize = pageSize;
    }

    public int PageNumber { get; }

    public int PageSize { get; }

    public static PageRequest Create(int pageNumber, int pageSize)
    {
        var normalizedPageSize = pageSize switch
        {
            < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => pageSize
        };

        return new PageRequest(pageNumber < 1 ? 1 : pageNumber, normalizedPageSize);
    }
}
