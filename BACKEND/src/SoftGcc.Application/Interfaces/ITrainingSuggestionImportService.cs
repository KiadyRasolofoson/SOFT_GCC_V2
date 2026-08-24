using Microsoft.AspNetCore.Http;

using SoftGcc.Application.Dtos.EvaluationsDto;

namespace SoftGcc.Application.Interfaces;

/// <summary>Alimente le catalogue de suggestions de formation depuis un fichier CSV.</summary>
public interface ITrainingSuggestionImportService
{
    Task<TrainingSuggestionImportResultDto> ImportFromCsvAsync(IFormFile file);
}
