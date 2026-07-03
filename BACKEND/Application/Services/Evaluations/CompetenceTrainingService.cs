using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class CompetenceTrainingService
    {
        private readonly IEvaluationDataService _dataService;

        public CompetenceTrainingService(IEvaluationDataService dataService)
        {
            _dataService = dataService;
        }

        public async Task<IEnumerable<CompetenceTraining>> GetAllAsync()
        {
            return await _dataService.GetAllCompetenceTrainingsAsync();
        }

        public async Task<CompetenceTraining> GetByIdAsync(int id)
        {
            return await _dataService.GetCompetenceTrainingByIdAsync(id);
        }

        public async Task<IEnumerable<CompetenceTraining>> GetByCompetenceLineIdAsync(int competenceLineId)
        {
            return await _dataService.GetCompetenceTrainingsByLineIdAsync(competenceLineId);
        }

        public async Task<CompetenceTraining> CreateAsync(CompetenceTraining training)
        {
            training.State = 1;
            await _dataService.CreateCompetenceTrainingAsync(training);
            return training;
        }

        public async Task<CompetenceTraining> UpdateAsync(CompetenceTraining training)
        {
            var existingTraining = await _dataService.GetCompetenceTrainingByIdAsync(training.TrainingId);
            if (existingTraining == null)
                throw new Exception("Formation non trouvée");

            existingTraining.CompetenceLineId = training.CompetenceLineId;
            existingTraining.TrainingName = training.TrainingName;
            existingTraining.Description = training.Description;
            existingTraining.Duration = training.Duration;
            existingTraining.Provider = training.Provider;
            existingTraining.Level = training.Level;
            existingTraining.State = training.State;
            
            await _dataService.UpdateCompetenceTrainingAsync(existingTraining);
            return existingTraining;
        }

        public async Task DeleteAsync(int id)
        {
            var training = await _dataService.GetCompetenceTrainingByIdAsync(id);
            if (training == null)
                throw new Exception("Formation non trouvée");

            training.State = 0;
            await _dataService.UpdateCompetenceTrainingAsync(training);
        }
    }
} 