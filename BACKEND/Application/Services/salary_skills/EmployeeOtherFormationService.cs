using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeOtherFormationService
	{
		private readonly ICrudRepository<EmployeeOtherFormation> _repository;
		private readonly ApplicationDbContext _context;

		public EmployeeOtherFormationService(ICrudRepository<EmployeeOtherFormation> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<IEnumerable<EmployeeOtherFormation>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeOtherFormation> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeOtherFormation employeeOtherFormation)
		{
			await _repository.Add(employeeOtherFormation);
		}

		public async Task Update(EmployeeOtherFormation employeeOtherFormation)
		{
			await _repository.Update(employeeOtherFormation);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		// Recuperer les autres competences d'un employee
		public async Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee)
		{
			return await _context.VEmployeeOtherSkill
					 .FromSqlRaw("SELECT * FROM v_employee_other_formation WHERE Employee_id = {0}", idEmployee)
					 .ToListAsync();
		}

        // Recuperer une autre formation par son id
        public async Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id)
        {
            return await _context.VEmployeeOtherSkill
                .FromSqlRaw("SELECT * FROM v_employee_other_formation WHERE Employee_other_formation_id = {0}", id)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
    }
}
