using soft_carriere_competence.Application.Dtos.EvaluationsDto;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Expose les lignes de compétence sous forme aplatie pour la couche présentation.</summary>
public interface ICompetenceLineService
{
    Task<IEnumerable<CompetenceLineSummaryDto>> GetSummariesAsync();
}
