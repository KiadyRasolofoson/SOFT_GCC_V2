using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Infrastructure.Repositories.DataService
{
    public class CareerPlanDataService : ICareerPlanDataService
    {
        private readonly ApplicationDbContext _context;

        public CareerPlanDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<VAssignmentAppointment>> GetAssignmentAppointment(string registrationNumber)
        {
            return await _context.VAssignmentAppointment
                .FromSqlRaw("SELECT * FROM v_assignment_appointment WHERE Registration_number = {0} AND state > 0", registrationNumber)
                .ToListAsync();
        }

        public async Task<List<VAssignmentAdvancement>> GetAssignmentAdvancement(string registrationNumber)
        {
            return await _context.VAssignmentAdvancement
                .FromSqlRaw("SELECT * FROM v_assignment_advancement WHERE Registration_number = {0} AND state > 0", registrationNumber)
                .ToListAsync();
        }

        public async Task<List<VAssignmentAvailability>> GetAssignmentAvailability(string registrationNumber)
        {
            return await _context.VAssignmentAvailability
                .FromSqlRaw("SELECT * FROM v_assignment_availability WHERE Registration_number = {0} AND state > 0 ", registrationNumber)
                .ToListAsync();
        }

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
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

        public async Task<List<History>> GetHistory(string registrationNumber)
        {
            return await _context.History
                .FromSqlRaw("SELECT * FROM History where Module_id=2 AND  Registration_number = {0} ORDER BY Creation_date DESC", registrationNumber)
                .ToListAsync();
        }

        public async Task<VEmployeeCareer?> GetCareerByEmployee(string registrationNumber)
        {
            return await _context.VEmployeeCareer
                .FromSqlRaw("SELECT * FROM v_employee_career WHERE Registration_number = @RegistrationNumber",
                            new SqlParameter("@RegistrationNumber", registrationNumber))
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }

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
            var parameters = new List<SqlParameter>();

            if (!string.IsNullOrWhiteSpace(keyWord))
            {
                sql.Append(" AND (registration_number LIKE @KeyWord OR name LIKE @KeyWord OR firstname LIKE @KeyWord)");
                parameters.Add(new SqlParameter("@KeyWord", $"%{keyWord}%"));
            }

            if (!string.IsNullOrWhiteSpace(departmentId))
            {
                sql.Append(" AND department_id = @DepartmentId");
                parameters.Add(new SqlParameter("@DepartmentId", departmentId));
            }

            if (!string.IsNullOrWhiteSpace(positionId))
            {
                sql.Append(" AND position_id = @PositionId");
                parameters.Add(new SqlParameter("@PositionId", positionId));
            }
            if (!string.IsNullOrWhiteSpace(dateAssignmentMin) && !string.IsNullOrWhiteSpace(dateAssignmentMax))
            {
                sql.Append(" AND Assignment_date BETWEEN @DateAssignmentMin AND @DateAssignmentMax");
                parameters.Add(new SqlParameter("@DateAssignmentMin", dateAssignmentMin));
                parameters.Add(new SqlParameter("@DateAssignmentMax", dateAssignmentMax));
            }

            var filteredQuery = _context.VEmployeeCareer
                .FromSqlRaw(sql.ToString(), parameters.ToArray());

            var totalCount = await filteredQuery.CountAsync();

            var data = await filteredQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (data, totalCount);
        }

        public async Task<object> GetAllCareersFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
        {
            var filteredQuery = _context.VEmployeeCareer
                .FromSqlRaw("SELECT * FROM v_employee_career WHERE Registration_number LIKE @p0 OR name LIKE @p0 OR firstname LIKE @p0", $"%{keyWord}%");

            var totalRecords = await filteredQuery.CountAsync();

            var careers = await filteredQuery
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

        public async Task<bool> DeleteCareerPlan(int careerPlanId)
        {
            try
            {
                string updateQuery = @"
                UPDATE career_plan
                SET state = 0
                WHERE career_plan_id = @CareerPlanId";

                int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                    updateQuery,
                    new SqlParameter("@CareerPlanId", careerPlanId)
                );

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur lors de la mise à jour de l'état : {ex.Message}");
                return false;
            }
        }

        public async Task<bool> RestoreCareerPlan(int careerPlanId)
        {
            try
            {
                string updateQuery = @"
                UPDATE career_plan
                SET state = 1
                WHERE career_plan_id = @CareerPlanId";

                int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                    updateQuery,
                    new SqlParameter("@CareerPlanId", careerPlanId)
                );

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur lors de la restauration de l'état : {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteDefinitivelyCareerPlan(int careerPlanId)
        {
            try
            {
                string deleteQuery = @"
                DELETE FROM career_plan
                WHERE career_plan_id = @CareerPlanId";

                int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                    deleteQuery,
                    new SqlParameter("@CareerPlanId", careerPlanId)
                );

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur lors de la suppression définitive : {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteHistory(int historyId)
        {
            try
            {
                string deleteQuery = @"
                DELETE FROM history
                WHERE history_id = @HistoryId";

                int rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                    deleteQuery,
                    new SqlParameter("@HistoryId", historyId)
                );

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur lors de la suppression définitive : {ex.Message}");
                return false;
            }
        }

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

        public async Task<List<CertificateHistory>> GetCertificateByEmployee(string registrationNumber)
        {
            return await _context.CertificateHistory
                .FromSqlRaw("SELECT * FROM certificate_history WHERE Registration_number = {0}", registrationNumber)
                .ToListAsync();
        }

        public async Task<bool> ExistsCertificateByReferenceAsync(string reference)
        {
            return await _context.CertificateHistory
                .AnyAsync(c => c.Reference == reference);
        }

        public async Task<WorkCertificates?> GetValidCertificateByToken(string token)
        {
            return await _context.WorkCertificates
                .FirstOrDefaultAsync(c => c.Token == token);
        }

        public async Task<bool> IsWorkCertificateExist(string token)
        {
            return await _context.WorkCertificates.AnyAsync(c => c.Token == token);
        }
    }
}
