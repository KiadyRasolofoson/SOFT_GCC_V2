using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class RoleService
    {
        private readonly ApplicationDbContext _context;

        public RoleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Role>> GetAllAsync()
        {
            return await _context.Roles
                .Where(r => r.state == null || r.state == 1)
                .ToListAsync();
        }

        public async Task<Role> GetByIdAsync(int id)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.Roleid == id && (r.state == null || r.state == 1));
        }

        public async Task<Role> CreateAsync(Role role)
        {
            role.state = 1;
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<Role> UpdateAsync(Role role)
        {
            var existingRole = await _context.Roles.FindAsync(role.Roleid);
            if (existingRole == null)
                throw new Exception("Rôle non trouvé");

            existingRole.Title = role.Title;
            existingRole.state = role.state;
            await _context.SaveChangesAsync();
            return existingRole;
        }

        public async Task DeleteAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
                throw new Exception("Rôle non trouvé");

            role.state = 0;
            await _context.SaveChangesAsync();
        }
    }
} 