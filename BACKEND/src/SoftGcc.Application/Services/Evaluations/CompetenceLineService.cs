using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces.Data;

namespace SoftGcc.Application.Services.Evaluations
{
    public class CompetenceLineService : ICompetenceLineService
    {
        private const string MissingSkillLabel = "Non défini";
        private const string MissingDescriptionLabel = "Sans description";

        private readonly IEvaluationDataService _dataService;

        public CompetenceLineService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        public async Task<IEnumerable<CompetenceLine>> GetAllAsync()
        {
            return await _dataService.GetAllCompetenceLinesAsync();
        }

        public async Task<IEnumerable<CompetenceLineSummaryDto>> GetSummariesAsync()
        {
            var competenceLines = await _dataService.GetAllCompetenceLinesAsync();
            if (competenceLines is null)
            {
                return Array.Empty<CompetenceLineSummaryDto>();
            }

            return competenceLines.Select(line => new CompetenceLineSummaryDto(
                line.CompetenceLineId,
                line.SkillPositionId,
                string.IsNullOrEmpty(line.Description) ? MissingDescriptionLabel : line.Description,
                line.SkillPosition?.Skill?.Name ?? MissingSkillLabel,
                line.SkillPosition?.Position?.PositionName ?? MissingSkillLabel,
                line.SkillPosition?.Position?.PositionId ?? 0,
                line.SkillPosition?.Skill?.SkillId ?? 0,
                line.State)).ToList();
        }

        public async Task<CompetenceLine?> GetByIdAsync(int id)
        {
            return await _dataService.GetCompetenceLineByIdAsync(id);
        }

        public async Task<IEnumerable<CompetenceLine>> GetByPositionIdAsync(int positionId)
        {
            return await _dataService.GetCompetenceLinesByPositionIdAsync(positionId);
        }

        public async Task<IEnumerable<CompetenceLine>> GetBySkillPositionIdAsync(int skillPositionId)
        {
            return await _dataService.GetCompetenceLinesBySkillPositionIdAsync(skillPositionId);
        }

        public async Task<CompetenceLine> CreateAsync(CompetenceLine competenceLine)
        {
            await EnsureMatrixLinkAsync(competenceLine.SkillPositionId);
            competenceLine.State = 1;
            await _dataService.CreateCompetenceLineAsync(competenceLine);
            return competenceLine;
        }

        public async Task<CompetenceLine> UpdateAsync(CompetenceLine competenceLine)
        {
            var existingCompetenceLine = await _dataService.GetCompetenceLineByIdAsync(competenceLine.CompetenceLineId);
            if (existingCompetenceLine == null)
                throw new NotFoundException("Ligne de compétence", competenceLine.CompetenceLineId);

            await EnsureMatrixLinkAsync(competenceLine.SkillPositionId);

            existingCompetenceLine.SkillPositionId = competenceLine.SkillPositionId;
            existingCompetenceLine.Description = competenceLine.Description;
            existingCompetenceLine.State = competenceLine.State;
            
            await _dataService.UpdateCompetenceLineAsync(existingCompetenceLine);
            return existingCompetenceLine;
        }

        /// <summary>
        /// Règle A1.3 : une ligne de questionnaire doit référencer une compétence ACTIVE de la matrice
        /// (<c>Skill_position</c>, <c>State &gt; 0</c>). Sinon, on n'évalue pas une compétence absente du poste.
        /// </summary>
        private async Task EnsureMatrixLinkAsync(int skillPositionId)
        {
            var matrixRow = await _dataService.GetSkillPositionByIdAsync(skillPositionId);
            if (matrixRow is null || matrixRow.State <= 0)
            {
                throw new ValidationException(
                    "La ligne de compétence doit référencer une compétence active de la matrice poste (SkillPositionId).");
            }
        }

        public async Task DeleteAsync(int id)
        {
            var competenceLine = await _dataService.GetCompetenceLineByIdAsync(id);
            if (competenceLine == null)
                throw new NotFoundException("Ligne de compétence", id);

            competenceLine.State = 0;
            await _dataService.UpdateCompetenceLineAsync(competenceLine);
        }
    }
} 