using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class WishEvolutionDataService : IWishEvolutionDataService
    {
        private readonly ApplicationDbContext _context;

        public WishEvolutionDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Postes suggérés : ceux dont l'employé satisfait déjà l'essentiel des exigences
        /// critiques, les mieux couverts d'abord (voir <see cref="PositionSuggestionRanker"/>).
        /// Remplace l'ancienne procédure stockée qui suggérait tout poste partageant une seule
        /// compétence — devenu du bruit dès que la matrice emplois est remplie.
        /// </summary>
        public async Task<List<PcdSuggestionPosition>> GetSuggestionPosition(int idEmployee)
        {
            var acquired = await _context.EmployeeSkill
                .AsNoTracking()
                .Where(es => es.EmployeeId == idEmployee)
                .GroupBy(es => es.SkillId)
                .Select(group => new
                {
                    SkillId = group.Key,
                    Level = group.Max(es => es.AcquiredLevel)
                })
                .ToListAsync();

            if (acquired.Count == 0)
            {
                return [];
            }

            var acquiredLevels = acquired.ToDictionary(item => item.SkillId, item => item.Level ?? 0);

            var requirements = await _context.SkillPosition
                .AsNoTracking()
                .Where(sp => sp.State > 0)
                .Select(sp => new PositionRequirementRow(
                    sp.PositionId,
                    sp.Position.PositionName ?? string.Empty,
                    sp.SkillId,
                    sp.ExpectedLevel,
                    sp.RequirementKind))
                .ToListAsync();

            return PositionSuggestionRanker
                .Rank(requirements, acquiredLevels)
                .Select(suggestion => new PcdSuggestionPosition
                {
                    PositionId = suggestion.PositionId,
                    PositionName = suggestion.PositionName
                })
                .ToList();
        }

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

        public async Task<List<VStatWishEvolution>> GetStatWishEvolutionByMonthInYear(int year)
        {
            return await _context.VStatWishEvolution
                .FromSqlRaw("SELECT * FROM v_stat_wish_evolution WHERE Year = {0}", year)
                .ToListAsync();
        }

        public async Task<List<VWishEvolution>> GetWishEvolutionById(int idWishEvolution)
        {
            return await _context.VWishEvolution
                .FromSqlRaw("SELECT * FROM v_wish_evolution WHERE wish_evolution_career_id = {0}", idWishEvolution)
                .ToListAsync();
        }

        public async Task<List<VSkillPosition>> GetSkillPosition(int idPosition)
        {
            return await _context.VSkillPosition
                .FromSqlRaw("SELECT * FROM v_skill_position WHERE position_id = {0}", idPosition)
                .ToListAsync();
        }

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
                if (priorityFormatted > 0 && priorityFormatted < 5)
                {
                    sql.Append(" AND priority BETWEEN @Priority AND 4");
                    parameters.Add(new SqlParameter("@Priority", priority));
                }
                else if (priorityFormatted >= 5 && priorityFormatted < 10)
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

            var filteredQuery = _context.VWishEvolution
                .FromSqlRaw(sql.ToString(), parameters.ToArray());

            var totalRecords = await filteredQuery.CountAsync();

            var wishesEvolution = await filteredQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (wishesEvolution, totalRecords);
        }

        public async Task<bool> UpdateState(int state, int wishEvolutionCareerId)
        {
            try
            {
                string updateQuery = @"
                UPDATE Wish_evolution_career
                SET state = @State, Updated_date = GETDATE()
                WHERE Wish_evolution_career_id = @WishEvolutionCareerId";

                int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                    updateQuery,
                    new SqlParameter("@State", state),
                    new SqlParameter("@WishEvolutionCareerId", wishEvolutionCareerId)
                );

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur lors de la mise a jour de l'état : {ex.Message}");
                return false;
            }
        }
    }
}
