using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
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
				.AsNoTracking()
				.FirstOrDefaultAsync(c => c.RegistrationNumber == registrationNumber);
		}

		public async Task<object> GetAllCareers(int pageNumber = 1, int pageSize = 10)
		{
			var query = _context.VEmployeeCareer.AsNoTracking();
			var totalRecords = await query.CountAsync();

			var careers = await query
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
			IQueryable<VEmployeeCareer> query = _context.VEmployeeCareer.AsNoTracking();

			if (!string.IsNullOrWhiteSpace(keyWord))
			{
				var kw = keyWord.Trim();
				query = query.Where(c =>
					(c.RegistrationNumber != null && c.RegistrationNumber.Contains(kw)) ||
					(c.Name != null && c.Name.Contains(kw)) ||
					(c.FirstName != null && c.FirstName.Contains(kw)));
			}

			if (!string.IsNullOrWhiteSpace(departmentId) && int.TryParse(departmentId, out var deptId))
			{
				query = query.Where(c => c.DepartmentId == deptId);
			}

			if (!string.IsNullOrWhiteSpace(positionId) && int.TryParse(positionId, out var posId))
			{
				query = query.Where(c => c.PositionId == posId);
			}

			if (!string.IsNullOrWhiteSpace(dateAssignmentMin) && !string.IsNullOrWhiteSpace(dateAssignmentMax)
				&& DateTime.TryParse(dateAssignmentMin, out var dateMin)
				&& DateTime.TryParse(dateAssignmentMax, out var dateMax))
			{
				query = query.Where(c => c.AssignmentDate != null
					&& c.AssignmentDate >= dateMin
					&& c.AssignmentDate <= dateMax);
			}

			var totalCount = await query.CountAsync();

			var data = await query
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync();

			return (data, totalCount);
		}

		public async Task<object> GetAllCareersFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
		{
			IQueryable<VEmployeeCareer> filteredQuery = _context.VEmployeeCareer.AsNoTracking();

			if (!string.IsNullOrWhiteSpace(keyWord))
			{
				var kw = keyWord.Trim();
				filteredQuery = filteredQuery.Where(c =>
					(c.RegistrationNumber != null && c.RegistrationNumber.Contains(kw)) ||
					(c.Name != null && c.Name.Contains(kw)) ||
					(c.FirstName != null && c.FirstName.Contains(kw)));
			}

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
