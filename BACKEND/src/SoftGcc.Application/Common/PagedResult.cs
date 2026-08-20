namespace SoftGcc.Application.Common;

/// <summary>Page de résultats renvoyée par tout endpoint exposant une liste.</summary>
public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int CurrentPage,
    int PageSize,
    int TotalPages)
{
    /// <summary>Nombre d'éléments présents dans la page courante.</summary>
    public int TotalItems => Items.Count;

    public static PagedResult<T> Create(IEnumerable<T>? items, PageRequest page, int totalPages)
    {
        IReadOnlyCollection<T> materializedItems = items is null ? Array.Empty<T>() : items.ToList();

        return new PagedResult<T>(materializedItems, page.PageNumber, page.PageSize, totalPages);
    }
}
