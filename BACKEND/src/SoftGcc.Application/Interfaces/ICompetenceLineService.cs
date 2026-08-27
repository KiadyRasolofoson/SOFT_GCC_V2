using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Application.Interfaces;

/// <summary>Expose les lignes de compétence sous forme aplatie pour la couche présentation.</summary>
public interface ICompetenceLineService
{
    Task<IEnumerable<CompetenceLine>> GetAllAsync();

    Task<IEnumerable<CompetenceLineSummaryDto>> GetSummariesAsync();

    Task<CompetenceLine?> GetByIdAsync(int id);

    Task<IEnumerable<CompetenceLine>> GetByPositionIdAsync(int positionId);

    Task<IEnumerable<CompetenceLine>> GetBySkillPositionIdAsync(int skillPositionId);

    Task<CompetenceLine> CreateAsync(CompetenceLine competenceLine);

    Task<CompetenceLine> UpdateAsync(CompetenceLine competenceLine);

    Task DeleteAsync(int id);

    /// <summary>
    /// Pont entre le référentiel de questions (organisé par compétence) et la notation
    /// (indexée par ligne de questionnaire) : retourne la ligne active du couple
    /// (poste, compétence) et la crée si la matrice contient bien ce couple.
    /// Retourne <c>null</c> si la compétence n'est pas attendue sur ce poste.
    /// </summary>
    Task<CompetenceLine?> EnsureForPositionSkillAsync(int positionId, int skillId);
}
