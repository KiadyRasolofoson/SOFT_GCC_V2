using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationTypeService
    {
        private readonly IGenericRepository<EvaluationType> _repository;
        private readonly ApplicationDbContext _context;

        public EvaluationTypeService(IGenericRepository<EvaluationType> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }
        public async Task<IEnumerable<EvaluationType>> GetAllEvaluationTypeAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<EvaluationType> GetEvaluationTypeByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<EvaluationType> CreateEvaluationTypeAsync(EvaluationType evaluationType)
        {
            // Potentiellement ajouter une validation ou une logique métier ici
            // Par exemple, vérifier si un type avec le même nom existe déjà
            await _repository.CreateAsync(evaluationType);
            return evaluationType; // L'objet créé peut contenir l'ID généré
        }

        public async Task UpdateEvaluationTypeAsync(EvaluationType evaluationType)
        {
            // Potentiellement ajouter une validation ou une logique métier ici
            await _repository.UpdateAsync(evaluationType);
        }

        public async Task DeleteEvaluationTypeAsync(int id)
        {
            var evaluationType = await _repository.GetByIdAsync(id);
            if (evaluationType != null)
            {
                await _repository.DeleteAsync(evaluationType);
            }
            // Gérer le cas où evaluationType est null si nécessaire (par exemple, lever une exception)
        }
    }
}
