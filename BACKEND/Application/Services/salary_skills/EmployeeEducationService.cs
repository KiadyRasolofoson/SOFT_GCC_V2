using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Infrastructure.Repositories;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeEducationService
	{
		private readonly ICrudRepository<EmployeeEducation> _repository;
		private readonly ApplicationDbContext _context;

		public EmployeeEducationService(ICrudRepository<EmployeeEducation> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<IEnumerable<EmployeeEducation>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeEducation> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeEducation education)
		{
			await _repository.Add(education);
		}

		public async Task Update(EmployeeEducation education)
		{
			await _repository.Update(education);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		// Recuperer les diplomes et formations d'un employee
		public async Task<List<VEmployeeEducation>> GetEmployeeEducations(int idEmployee)
		{
			return await _context.VEmployeeEducation
					 .FromSqlRaw("SELECT * FROM v_employee_education WHERE Employee_id = {0}", idEmployee)
					 .ToListAsync();
		}

        // Recuperer un diplome et formation par son id
        public async Task<VEmployeeEducation?> GetEmployeeEducationById(int idEmployeeEducation)
        {
            return await _context.VEmployeeEducation
                .FromSqlRaw("SELECT * FROM v_employee_education WHERE Employee_education_id = {0}", idEmployeeEducation)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
    }

}
