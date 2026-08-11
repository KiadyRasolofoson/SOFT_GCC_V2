using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Exceptions;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.Evaluations
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
            competenceLine.State = 1;
            await _dataService.CreateCompetenceLineAsync(competenceLine);
            return competenceLine;
        }

        public async Task<CompetenceLine> UpdateAsync(CompetenceLine competenceLine)
        {
            var existingCompetenceLine = await _dataService.GetCompetenceLineByIdAsync(competenceLine.CompetenceLineId);
            if (existingCompetenceLine == null)
                throw new NotFoundException("Ligne de compétence", competenceLine.CompetenceLineId);

            existingCompetenceLine.SkillPositionId = competenceLine.SkillPositionId;
            existingCompetenceLine.Description = competenceLine.Description;
            existingCompetenceLine.State = competenceLine.State;
            
            await _dataService.UpdateCompetenceLineAsync(existingCompetenceLine);
            return existingCompetenceLine;
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