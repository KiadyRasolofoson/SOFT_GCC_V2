using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class CompetenceLineService
    {
        private readonly IEvaluationDataService _dataService;

        public CompetenceLineService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        public async Task<IEnumerable<CompetenceLine>> GetAllAsync()
        {
            return await _dataService.GetAllCompetenceLinesAsync();
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
                throw new Exception("Ligne de compétence non trouvée");

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
                throw new Exception("Ligne de compétence non trouvée");

            competenceLine.State = 0;
            await _dataService.UpdateCompetenceLineAsync(competenceLine);
        }
    }
} 