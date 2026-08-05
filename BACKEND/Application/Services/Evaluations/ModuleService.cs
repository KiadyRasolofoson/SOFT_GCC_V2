using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class ModuleService : IModuleService
    {
        private readonly ApplicationDbContext _context;

        public ModuleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Module>> GetAllAsync()
        {
            return await _context.Modules
                .Where(m => m.State == 1)
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }

        public async Task<IEnumerable<Module>> GetAllWithChildrenAsync()
        {
            // Récupère les modules racines avec leurs enfants
            var modules = await _context.Modules
                .Where(m => m.State == 1 && m.ParentModuleId == null)
                .Include(m => m.ChildModules.OrderBy(c => c.SortOrder))
                .OrderBy(m => m.SortOrder)
                .ToListAsync();

            return modules;
        }

        public async Task<Module?> GetByIdAsync(int id)
        {
            return await _context.Modules
                .Include(m => m.ChildModules)
                .FirstOrDefaultAsync(m => m.ModuleId == id);
        }

        public async Task<Module> CreateAsync(Module module)
        {
            module.State = 1;
            _context.Modules.Add(module);
            await _context.SaveChangesAsync();
            return module;
        }

        public async Task<Module> UpdateAsync(Module module)
        {
            var existing = await _context.Modules.FindAsync(module.ModuleId);
            if (existing == null)
                throw new Exception("Module non trouvé.");

            existing.Name = module.Name;
            existing.DisplayName = module.DisplayName;
            existing.Icon = module.Icon;
            existing.Route = module.Route;
            existing.ParentModuleId = module.ParentModuleId;
            existing.SortOrder = module.SortOrder;
            existing.Description = module.Description;
            existing.State = module.State;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task DeleteAsync(int id)
        {
            var module = await _context.Modules.FindAsync(id);
            if (module == null)
                throw new Exception("Module non trouvé.");

            // Soft delete : on désactive le module et ses enfants
            module.State = 0;
            var children = await _context.Modules
                .Where(m => m.ParentModuleId == id)
                .ToListAsync();

            foreach (var child in children)
                child.State = 0;

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Module>> GetModulesByRoleIdAsync(int roleId)
        {
            var moduleIds = await _context.RoleModules
                .Where(rm => rm.RoleId == roleId)
                .Select(rm => rm.ModuleId)
                .ToListAsync();

            if (!moduleIds.Any())
                return Enumerable.Empty<Module>();

            return await _context.Modules
                .Where(m => moduleIds.Contains(m.ModuleId) && m.State == 1)
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }

        public async Task UpdateRoleModulesAsync(int roleId, List<int> moduleIds)
        {
            // Supprimer les assignations existantes
            var existing = await _context.RoleModules
                .Where(rm => rm.RoleId == roleId)
                .ToListAsync();
            _context.RoleModules.RemoveRange(existing);

            // Créer les nouvelles assignations
            var newAssignments = moduleIds.Select(moduleId => new RoleModule
            {
                RoleId = roleId,
                ModuleId = moduleId
            });
            _context.RoleModules.AddRange(newAssignments);

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Module>> GetMyModulesAsync(int userId)
        {
            // Récupère le rôle de l'utilisateur
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Enumerable.Empty<Module>();

            // Récupère les IDs des modules assignés au rôle
            var moduleIds = await _context.RoleModules
                .Where(rm => rm.RoleId == user.RoleId)
                .Select(rm => rm.ModuleId)
                .ToListAsync();

            if (!moduleIds.Any())
                return Enumerable.Empty<Module>();

            // Récupère les modules racines avec leurs enfants
            var modules = await _context.Modules
                .Where(m => moduleIds.Contains(m.ModuleId) && m.State == 1 && m.ParentModuleId == null)
                .Include(m => m.ChildModules.Where(c => c.State == 1).OrderBy(c => c.SortOrder))
                .OrderBy(m => m.SortOrder)
                .ToListAsync();

            return modules;
        }

        public async Task<IEnumerable<Module>> GetModulesWithPermissionsAsync()
        {
            return await _context.Modules
                .Where(m => m.State == 1)
                .Include(m => m.Permissions.Where(p => p.State == 1))
                .Include(m => m.ChildModules)
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }
    }
}
