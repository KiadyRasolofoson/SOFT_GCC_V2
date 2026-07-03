using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.history
{
	public class HistoryService
	{
		private readonly ICrudRepository<ActivityLog> _repository;
		private readonly ApplicationDbContext _context;

		public HistoryService(ICrudRepository<ActivityLog> repository, ApplicationDbContext context)
		{
			_repository = repository;
			_context = context;
		}

		// Avoir les historiques
		public async Task<object> GetAllHistory()
		{
			return await _context.ActivityLog
						 .FromSqlRaw("SELECT * FROM activity_logs ORDER BY Creation_date DESC")
						 .ToListAsync();
		}

		public async Task Add(ActivityLog activityLog)
		{
			await _repository.Add(activityLog);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
