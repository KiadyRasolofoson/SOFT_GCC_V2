namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>Bilan d'un import CSV de suggestions de formation : lignes retenues et lignes rejetées.</summary>
public sealed record TrainingSuggestionImportResultDto(
    int Imported,
    IReadOnlyCollection<string> Errors);
