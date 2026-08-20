using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
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
