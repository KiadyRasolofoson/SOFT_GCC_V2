using System;
using Microsoft.Data.SqlClient;
using System.Text;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.wish_evolution
{
	public class WishEvolutionService
	{
		private readonly ICrudRepository<WishEvolutionCareer> _repository;
		private readonly ApplicationDbContext _context;

		public WishEvolutionService(ICrudRepository<WishEvolutionCareer> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		public async Task<WishEvolutionCareer> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Update(WishEvolutionCareer wishEvolution)
		{
			await _repository.Update(wishEvolution);
		}

		public async Task Add(WishEvolutionCareer wishEvolution)
		{
			await _repository.Add(wishEvolution);
		}

		// Les suggestions de postes
		public async Task<List<PcdSuggestionPosition>> GetSuggestionPosition(int idEmployee)
		{
			return await _context.PcdSuggestionPosition
				.FromSqlRaw($"EXEC pcd_GetSuggestionPosition @idEmployee = {idEmployee}")
				.ToListAsync();
		}

		// Les demandes de souhait d'evolution
		public async Task<object> GetAllWishEvolution(int pageNumber = 1, int pageSize = 10)
		{
			var totalRecords = await _context.VWishEvolution.CountAsync();

			var wishEvolutions = await _context.VWishEvolution
				.FromSqlRaw("SELECT * FROM v_wish_evolution")
				.Skip((pageNumber - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

			return new
			{
				Data = wishEvolutions,
				TotalRecords = totalRecords,
				PageSize = pageSize,
				CurrentPage = pageNumber,
				TotalPages = totalPages
			};
		}

		// Statistiques des demandes de souhaits evolution 
		public async Task<List<VStatWishEvolution>> GetStatWishEvolutionByMonthInYear(int year)
		{
			return await _context.VStatWishEvolution
				.FromSqlRaw("SELECT * FROM v_stat_wish_evolution WHERE Year = {0}", year)
				.ToListAsync();
		}

		// Statistiques des demandes de souhaits evolution 
		public async Task<List<VWishEvolution>> GetWishEvolutionById(int idWishEvolution)
		{
			return await _context.VWishEvolution
				.FromSqlRaw("SELECT * FROM v_wish_evolution WHERE wish_evolution_career_id = {0}", idWishEvolution)
				.ToListAsync();
		}

		// Competence d'une poste
		public async Task<List<VSkillPosition>> GetSkillPosition(int idPosition)
		{
			return await _context.VSkillPosition
				.FromSqlRaw("SELECT * FROM v_skill_position WHERE position_id = {0}", idPosition)
				.ToListAsync();
		}

		// Filtrer les demandes de souhait d'evolution
		public async Task<(List<VWishEvolution> Data, int TotalCount)> GetWishEvolutionFilter(
		string? keyWord = null,
		string? dateRequestMin = null,
		string? dateRequestMax = null,
		string? wishTypeId = null,
		string? positionId = null,
		string? priority = null,
		string? state = null,
		int page = 1,
		int pageSize = 10)
		{
			var sql = new StringBuilder("SELECT * FROM v_wish_evolution WHERE 1=1");
			var parameters = new List<SqlParameter>();

			// Ajouter les conditions de filtrage
			if (!string.IsNullOrWhiteSpace(keyWord))
			{
				sql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
				parameters.Add(new SqlParameter("@KeyWord", $"%{keyWord}%"));
			}

			if (!string.IsNullOrWhiteSpace(dateRequestMin) && !string.IsNullOrWhiteSpace(dateRequestMax))
			{
				sql.Append(" AND Request_date BETWEEN @DateMin AND @DateMax");
				parameters.Add(new SqlParameter("@DateMin", dateRequestMin));
				parameters.Add(new SqlParameter("@DateMax", dateRequestMax));
			}

			if (!string.IsNullOrWhiteSpace(wishTypeId))
			{
				sql.Append(" AND wish_type_id = @WishTypeId");
				parameters.Add(new SqlParameter("@WishTypeId", wishTypeId));
			}

			if (!string.IsNullOrWhiteSpace(positionId))
			{
				sql.Append(" AND Wish_position_id = @PositionId");
				parameters.Add(new SqlParameter("@PositionId", positionId));
			}

			if (!string.IsNullOrWhiteSpace(priority))
			{
				int priorityFormatted = int.Parse(priority);
				if(priorityFormatted > 0 && priorityFormatted < 5)
				{
					sql.Append(" AND priority BETWEEN @Priority AND 4");
					parameters.Add(new SqlParameter("@Priority", priority));
				}
				else if (priorityFormatted >= 5  && priorityFormatted < 10)
				{
					sql.Append(" AND priority BETWEEN @Priority AND 9");
					parameters.Add(new SqlParameter("@Priority", priority));
				}
				else
				{
					sql.Append(" AND priority = @Priority");
					parameters.Add(new SqlParameter("@Priority", priority));
				}
			}

			if (!string.IsNullOrWhiteSpace(state))
			{
				sql.Append(" AND state = @State");
				parameters.Add(new SqlParameter("@State", state));
			}


			// Utilisation de la requête SQL avec des paramètres pour éviter les injections SQL
			var filteredQuery = _context.VWishEvolution
				.FromSqlRaw(sql.ToString(), parameters.ToArray());

			// Compter le nombre total de résultats correspondant au filtre
			var totalRecords = await filteredQuery.CountAsync();


			// Appliquer la pagination aux résultats filtrés
			var wishesEvolution = await filteredQuery
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			
			return (wishesEvolution, totalRecords);
		}

		// Supprimer un souhait d'evolution
		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		// Mettre a jour l'etat d'un souhait evolution
		public async Task<bool> UpdateState(int state, int wishEvolutionCareerId)
		{
			try
			{
				// Construire la requête de mise à jour
				string updateQuery = @"
				UPDATE Wish_evolution_career
				SET state = @State, Updated_date = GETDATE()
				WHERE Wish_evolution_career_id = @WishEvolutionCareerId";

				// Exécuter la requête avec les paramètres
				int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
					updateQuery,
					new SqlParameter("@State", state),
					new SqlParameter("@WishEvolutionCareerId", wishEvolutionCareerId)
				);

				// Vérifier si une ligne a été mise à jour
				return rowsAffected > 0;
			}
			catch (Exception ex)
			{
				// Gestion des erreurs (log si nécessaire)
				Console.Error.WriteLine($"Erreur lors de la mise a jour de l'état : {ex.Message}");
				return false;
			}
		}
	}
}
