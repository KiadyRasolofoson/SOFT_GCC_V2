using Microsoft.AspNetCore.Http;

using soft_carriere_competence.Application.Dtos.EvaluationsDto;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Alimente le catalogue de suggestions de formation depuis un fichier CSV.</summary>
public interface ITrainingSuggestionImportService
{
    Task<TrainingSuggestionImportResultDto> ImportFromCsvAsync(IFormFile file);
}
