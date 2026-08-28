using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class RetirementDataService : IRetirementDataService
    {
        private readonly ApplicationDbContext _context;

        public RetirementDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<VRetirement>> GetRetirementList()
        {
            return await _context.VRetirement
                .FromSqlRaw("SELECT * FROM v_retirement ORDER BY age DESC")
                .ToListAsync();
        }

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
            var countSql = new StringBuilder("SELECT COUNT(*) AS Value FROM v_retirement WHERE 1=1");
            var parameters = new List<SqlParameter>();

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
                var ageSplitted = age.Split("-");
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
                var yearSplitted = year.Split("-");
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

            var filteredQuery = _context.VRetirement
                .FromSqlRaw(sql.ToString(), parameters.ToArray())
                .OrderBy(r => r.RegistrationNumber);

            // Total : compté sur une sous-requête SANS ORDER BY (interdit dans une table dérivée)
            var totalCount = await _context.Database
                .SqlQueryRaw<int>(countSql.ToString(), parameters.ToArray())
                .FirstOrDefaultAsync();

            var data = await filteredQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (data, totalCount);
        }
    }
}
