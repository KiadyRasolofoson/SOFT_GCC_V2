using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class CompetenceTrainingService
    {
        private readonly ApplicationDbContext _context;

        public CompetenceTrainingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CompetenceTraining>> GetAllAsync()
        {
            return await _context.competenceTrainings
                .Include(c => c.CompetenceLine)
                .Where(c => c.State == 1)
                .ToListAsync();
        }

        public async Task<CompetenceTraining> GetByIdAsync(int id)
        {
            return await _context.competenceTrainings
                .Include(c => c.CompetenceLine)
                .FirstOrDefaultAsync(c => c.TrainingId == id && c.State == 1);
        }

        public async Task<IEnumerable<CompetenceTraining>> GetByCompetenceLineIdAsync(int competenceLineId)
        {
                return await _context.competenceTrainings
                .Include(c => c.CompetenceLine)
                .Where(c => c.CompetenceLineId == competenceLineId && c.State == 1)
                .ToListAsync();
        }

        public async Task<CompetenceTraining> CreateAsync(CompetenceTraining training)
        {
            training.State = 1;
            _context.competenceTrainings.Add(training);
            await _context.SaveChangesAsync();
            return training;
        }

        public async Task<CompetenceTraining> UpdateAsync(CompetenceTraining training)
        {
            var existingTraining = await _context.competenceTrainings.FindAsync(training.TrainingId);
            if (existingTraining == null)
                throw new Exception("Formation non trouvée");

            existingTraining.CompetenceLineId = training.CompetenceLineId;
            existingTraining.TrainingName = training.TrainingName;
            existingTraining.Description = training.Description;
            existingTraining.Duration = training.Duration;
            existingTraining.Provider = training.Provider;
            existingTraining.Level = training.Level;
            existingTraining.State = training.State;
            
            await _context.SaveChangesAsync();
            return existingTraining;
        }

        public async Task DeleteAsync(int id)
        {
            var training = await _context.competenceTrainings.FindAsync(id);
            if (training == null)
                throw new Exception("Formation non trouvée");

            training.State = 0;
            await _context.SaveChangesAsync();
        }
    }
} 