using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.career_plan
{
	public class CareerPlanService
	{
		private readonly ICrudRepository<CareerPlan> _repository;
		private readonly ApplicationDbContext _context;

		public CareerPlanService(ICrudRepository<CareerPlan> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<CareerPlan> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Update(CareerPlan careerPlan)
		{
			await _repository.Update(careerPlan);
		}

		public async Task Add(CareerPlan careerPlan)
		{
			await _repository.Add(careerPlan);
		}

		// Recuperer les nominations d'un employe
		public async Task<List<VAssignmentAppointment>> GetAssignmentAppointment(string registrationNumber)
		{
			return await _context.VAssignmentAppointment
				.FromSqlRaw("SELECT * FROM v_assignment_appointment WHERE Registration_number = {0} AND state > 0", registrationNumber)
				.ToListAsync();
		}

		// Recuperer les avancements d'un employe
		public async Task<List<VAssignmentAdvancement>> GetAssignmentAdvancement(string registrationNumber)
		{
			return await _context.VAssignmentAdvancement
				.FromSqlRaw("SELECT * FROM v_assignment_advancement WHERE Registration_number = {0} AND state > 0", registrationNumber)
				.ToListAsync();
		}

		// Recuperer les mises en disponibilites d'un employe
		public async Task<List<VAssignmentAvailability>> GetAssignmentAvailability(string registrationNumber)
		{
			return await _context.VAssignmentAvailability
				.FromSqlRaw("SELECT * FROM v_assignment_availability WHERE Registration_number = {0} AND state > 0 ", registrationNumber)
				.ToListAsync();
		}

        // Recuperer le dernier plan de carrière de l'employé 
        public async Task<CareerPlan?> GetLastCareerPlanByEmployee(string registrationNumber)
        {
            return await _context.CareerPlan
                .FromSqlRaw(@"SELECT * 
                      FROM Career_plan 
                      WHERE Registration_number = {0} 
                        AND state > 0 
                        AND employee_type = 2 
                      ORDER BY Career_plan_id DESC 
                      LIMIT 1", registrationNumber)
                .AsNoTracking() // (optionnel) pour améliorer les performances si tu ne modifies pas l'objet
                .FirstOrDefaultAsync();
        }

        // Recuperer les mises en disponibilites d'un employe
        public async Task<List<History>> GetHistory(string registrationNumber)
		{
			return await _context.History
				.FromSqlRaw("SELECT * FROM History where Module_id=2 AND  Registration_number = {0} ORDER BY Creation_date DESC", registrationNumber)
				.ToListAsync();
		}

		// Recuperer les mises en disponibilites d'un employe
		public async Task<VEmployeeCareer?> GetCareerByEmployee(string registrationNumber)
		{
			return await _context.VEmployeeCareer
				.FromSqlRaw("SELECT * FROM v_employee_career WHERE Registration_number = @RegistrationNumber",
							new SqlParameter("@RegistrationNumber", registrationNumber))
				.AsNoTracking()
				.FirstOrDefaultAsync();
		}

		// Nombre de carriere des employes
		public async Task<object> GetAllCareers(int pageNumber = 1, int pageSize = 10)
		{
			var totalRecords = await _context.VEmployeeCareer.CountAsync();

			var careers = await _context.VEmployeeCareer
				.FromSqlRaw("SELECT * FROM v_employee_career")
				.Skip((pageNumber - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

			return new
			{
				Data = careers,
				TotalRecords = totalRecords,
				PageSize = pageSize,
				CurrentPage = pageNumber,
				TotalPages = totalPages
			};
		}


		// Filtrer les carrieres
		public async Task<(List<VEmployeeCareer> Data, int TotalCount)> GetAllCareersFilter(
		string? keyWord = null,
		string? departmentId = null,
		string? positionId = null,
		string? dateAssignmentMin = null,
		string? dateAssignmentMax = null,
		int page = 1,
		int pageSize = 10)
		{
			var sql = new StringBuilder("SELECT * FROM v_employee_career WHERE 1=1");
			var countSql = new StringBuilder("SELECT COUNT(*) AS count FROM v_employee_career WHERE 1=1");
			var parameters = new List<SqlParameter>();

			// Ajouter les conditions de filtrage
			if (!string.IsNullOrWhiteSpace(keyWord))
			{
				sql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
				countSql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
				parameters.Add(new SqlParameter("@KeyWord", $"%{keyWord}%"));
			}

			if (!string.IsNullOrWhiteSpace(departmentId))
			{
				sql.Append(" AND department_id = @DepartmentId");
				countSql.Append(" AND department_id = @DepartmentId");
				parameters.Add(new SqlParameter("@DepartmentId", departmentId));
			}

			if (!string.IsNullOrWhiteSpace(positionId))
			{
				sql.Append(" AND position_id = @PositionId");
				countSql.Append(" AND position_id = @PositionId");
				parameters.Add(new SqlParameter("@PositionId", positionId));
			}
			if (!string.IsNullOrWhiteSpace(dateAssignmentMin) && !string.IsNullOrWhiteSpace(dateAssignmentMax))
			{
				sql.Append(" AND Assignment_date BETWEEN @DateAssignmentMin AND @DateAssignmentMax");
				countSql.Append(" AND Assignment_date BETWEEN @DateAssignmentMin AND @DateAssignmentMax");
				parameters.Add(new SqlParameter("@DateAssignmentMin", dateAssignmentMin));
				parameters.Add(new SqlParameter("@DateAssignmentMax", dateAssignmentMax));
			}


			var filteredQuery = _context.VEmployeeCareer
				.FromSqlRaw(sql.ToString(), parameters.ToArray());

			var totalCount = await filteredQuery.CountAsync();

			// Appliquer la pagination aux résultats filtrés
			var data = await filteredQuery
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();


			return (data, totalCount);
		}



		// Filtrer les carrieres
		public async Task<object> GetAllCareersFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
		{
			// Utilisation de la requête SQL avec des paramètres pour éviter les injections SQL
			var filteredQuery = _context.VEmployeeCareer
				.FromSqlRaw("SELECT * FROM v_employee_career WHERE Registration_number LIKE @p0 OR name LIKE @p0 OR firstname LIKE @p0", $"%{keyWord}%");

			// Compter le nombre total de résultats correspondant au filtre
			var totalRecords = await filteredQuery.CountAsync();

			// Appliquer la pagination aux résultats filtrés
			var careers = await filteredQuery
				.Skip((pageNumber - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			// Calculer le nombre total de pages
			var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

			return new
			{
				Data = careers,
				TotalRecords = totalRecords,
				PageSize = pageSize,
				CurrentPage = pageNumber,
				TotalPages = totalPages
			};
		}

		// supprimer un plan de carriere
		public async Task<bool> DeleteCareerPlan(int careerPlanId)
		{
			try
			{
				// Construire la requête de mise à jour
				string updateQuery = @"
				UPDATE career_plan
				SET state = 0
				WHERE career_plan_id = @CareerPlanId";

				// Exécuter la requête avec les paramètres
				int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
					updateQuery,
					new SqlParameter("@CareerPlanId", careerPlanId)
				);

				// Vérifier si une ligne a été mise à jour
				return rowsAffected > 0;
			}
			catch (Exception ex)
			{
				// Gestion des erreurs (log si nécessaire)
				Console.Error.WriteLine($"Erreur lors de la mise à jour de l'état : {ex.Message}");
				return false;
			}
		}

		// Restaurer un plan de carriere
		public async Task<bool> RestoreCareerPlan(int careerPlanId)
		{
			try
			{
				// Construire la requête de mise à jour
				string updateQuery = @"
				UPDATE career_plan
				SET state = 1
				WHERE career_plan_id = @CareerPlanId";

				// Exécuter la requête avec les paramètres
				int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
					updateQuery,
					new SqlParameter("@CareerPlanId", careerPlanId)
				);

				// Vérifier si une ligne a été mise à jour
				return rowsAffected > 0;
			}
			catch (Exception ex)
			{
				// Gestion des erreurs (log si nécessaire)
				Console.Error.WriteLine($"Erreur lors de la restauration de l'état : {ex.Message}");
				return false;
			}
		}

		// Supprimer definitivement un plan de carriere
		public async Task<bool> DeleteDefinitivelyCareerPlan(int careerPlanId)
		{
			try
			{
				// Construire la requête de suppression
				string deleteQuery = @"
				DELETE FROM career_plan
				WHERE career_plan_id = @CareerPlanId";

				// Exécuter la requête avec les paramètres
				int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
					deleteQuery,
					new SqlParameter("@CareerPlanId", careerPlanId)
				);

				// Vérifier si une ligne a été supprimée
				return rowsAffected > 0;
			}
			catch (Exception ex)
			{
				// Gestion des erreurs (log si nécessaire)
				Console.Error.WriteLine($"Erreur lors de la suppression définitive : {ex.Message}");
				return false;
			}
		}

		// Supprimer definitivement un plan de carriere
		public async Task<bool> DeleteHistory(int historyId)
		{
			try
			{
				// Construire la requête de suppression
				string deleteQuery = @"
				DELETE FROM history
				WHERE history_id = @HistoryId";

				// Exécuter la requête avec les paramètres
				int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
					deleteQuery,
					new SqlParameter("@HistoryId", historyId)
				);

				// Vérifier si une ligne a été supprimée
				return rowsAffected > 0;
			}
			catch (Exception ex)
			{
				// Gestion des erreurs (log si nécessaire)
				Console.Error.WriteLine($"Erreur lors de la suppression définitive : {ex.Message}");
				return false;
			}
		}

        // Récuperer la dernière ligne enregistré pour l'employé et le type de contrat correspondant
        public async Task<CareerPlan?> GetByEmployeeAndContractType(string? registrationNumber)
        {
            if (string.IsNullOrEmpty(registrationNumber))
            {
                return null;
            }

            return await _context.Set<CareerPlan>()
				.FromSqlRaw(@"
					SELECT TOP 1 * 
					FROM career_plan
					WHERE Registration_number = @p0
					AND State > 0
					AND Employee_type_id = 2
					ORDER BY Assignment_date DESC", registrationNumber)
                .FirstOrDefaultAsync();
        }
    }
}
