using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.retirement
{
	public class RetirementService
	{
		private readonly ICrudRepository<RetirementParameter> _repository;
		private readonly ApplicationDbContext _context;

		public RetirementService(ICrudRepository<RetirementParameter> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<IEnumerable<RetirementParameter>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<RetirementParameter> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Update(RetirementParameter echelon)
		{
			await _repository.Update(echelon);
		}

		// Recuperer les departs a la retraite
		public async Task<List<VRetirement>> GetRetirementList()
		{
			return await _context.VRetirement
				.FromSqlRaw("SELECT * FROM v_retirement ORDER BY age DESC")
				.ToListAsync();
		}

		// Filtrer les departs a la retraite
		public async Task<(List<VRetirement> Data, int TotalCount)> GetRetirementFilter(
		string? keyWord = null,
		string? civiliteId = null,
		string? departmentId = null,
		string? positionId = null,
		string? age = null,
		string? year = null,
		int page = 1,
		int pageSize = 10)
		{
			var sql = new StringBuilder("SELECT * FROM v_retirement WHERE 1=1");
			var countSql = new StringBuilder("SELECT COUNT(*) AS count FROM v_retirement WHERE 1=1");
			var parameters = new List<SqlParameter>();

			// Ajouter les conditions de filtrage
			if (!string.IsNullOrWhiteSpace(keyWord))
			{
				sql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
				countSql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
				parameters.Add(new SqlParameter("@KeyWord", $"%{keyWord}%"));
			}

			if (!string.IsNullOrWhiteSpace(civiliteId))
			{
				sql.Append(" AND civilite_id = @CiviliteId");
				countSql.Append(" AND civilite_id = @CiviliteId");
				parameters.Add(new SqlParameter("@CiviliteId", civiliteId));
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

			if (!string.IsNullOrWhiteSpace(age))
			{
				string[] ageSplitted = age.Split("-");

				var ageParts = age.Split("-");
				if (ageParts.Any(part => !int.TryParse(part, out _)))
				{
					throw new ArgumentException("Age doit contenir des donnees de cette forme : nombre ou nombre1-nombre2.");
				}
				if (ageSplitted.Length > 1)
				{
					sql.Append(" AND age BETWEEN @Age1 AND @Age2");
					countSql.Append(" AND age BETWEEN @Age1 AND @Age2");
					parameters.Add(new SqlParameter("@Age1", ageSplitted[0]));
					parameters.Add(new SqlParameter("@Age2", ageSplitted[1]));
				}
				else
				{
					sql.Append(" AND age = @Age");
					countSql.Append(" AND age = @Age");
					parameters.Add(new SqlParameter("@Age", ageSplitted[0]));
				}
			}

			if (!string.IsNullOrWhiteSpace(year))
			{
				string[] yearSplitted = year.Split("-");
				var yearParts = year.Split("-");

				if (yearParts.Any(part => !int.TryParse(part, out _)))
				{
					throw new ArgumentException("Annee doit contenir des donnees de cette forme : 'nombre' ou 'nombre1-nombre2'.");
				}
				if (yearSplitted.Length > 1)
				{
					sql.Append(" AND Year_retirement BETWEEN @Year1 AND @Year2");
					countSql.Append(" AND Year_retirement BETWEEN @Year1 AND @Year2");
					parameters.Add(new SqlParameter("@Year1", yearSplitted[0]));
					parameters.Add(new SqlParameter("@Year2", yearSplitted[1]));
				}
				else
				{
					sql.Append(" AND Year_retirement = @Year");
					countSql.Append(" AND Year_retirement = @Year");
					parameters.Add(new SqlParameter("@Year", yearSplitted[0]));
				}
			}

			// Utilisation de la requête SQL avec des paramètres pour éviter les injections SQL
			var filteredQuery = _context.VRetirement
				.FromSqlRaw(sql.ToString(), parameters.ToArray());

			// Compter le nombre total de résultats correspondant au filtre
			var totalCount = await filteredQuery.CountAsync();


			// Appliquer la pagination aux résultats filtrés
			var data= await filteredQuery
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			return (data, totalCount);
		}
	}
}
