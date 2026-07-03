using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeLanguageService
	{
		private readonly ICrudRepository<EmployeeLanguage> _repository;
		private readonly ApplicationDbContext _context;

		public EmployeeLanguageService(ICrudRepository<EmployeeLanguage> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<IEnumerable<EmployeeLanguage>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeLanguage> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeLanguage employeeLanguage)
		{
			await _repository.Add(employeeLanguage);
		}

		public async Task Update(EmployeeLanguage employeeLanguage)
		{
			await _repository.Update(employeeLanguage);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		// Recuperer les competences linguistiques d'un employee
		public async Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee)
		{
			return await _context.VEmployeeLanguage
					 .FromSqlRaw("SELECT * FROM v_employee_language WHERE Employee_id = {0}", idEmployee)
					 .ToListAsync();
		}

        // Recuperer une language d'un employé par son id
        public async Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id)
        {
            return await _context.VEmployeeLanguage
                .FromSqlRaw("SELECT * FROM v_employee_language WHERE Employee_language_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
    }
}
