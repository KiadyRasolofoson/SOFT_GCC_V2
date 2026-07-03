using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Infrastructure.Repositories.DataService
{
    public class HistoryDataService : IHistoryDataService
    {
        private readonly ApplicationDbContext _context;

        public HistoryDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAllHistory()
        {
            return await _context.ActivityLog
                .FromSqlRaw("SELECT * FROM activity_logs ORDER BY Creation_date DESC")
                .ToListAsync();
        }
    }
}
