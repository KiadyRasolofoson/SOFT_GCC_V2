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
            var modules = await _context.Modules
                .Where(m => m.State == 1 && m.ParentModuleId == null)
                .Include(m => m.ChildModules.Where(c => c.State == 1).OrderBy(c => c.SortOrder))
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
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Enumerable.Empty<Module>();

            // Tous les modules actifs (pour construire l'arbre filtrée)
            var allActive = await _context.Modules
                .Where(m => m.State == 1)
                .OrderBy(m => m.SortOrder)
                .ToListAsync();

            // Admin (titre Admin / Administrator / Administrateur) : tous les modules
            HashSet<int> assignedSet;
            if (PermissionService.IsAdminRole(user.RoleId, user.Role?.Title))
            {
                assignedSet = allActive.Select(m => m.ModuleId).ToHashSet();
            }
            else
            {
                var assignedIds = await _context.RoleModules
                    .Where(rm => rm.RoleId == user.RoleId)
                    .Select(rm => rm.ModuleId)
                    .ToListAsync();

                if (!assignedIds.Any())
                    return Enumerable.Empty<Module>();

                assignedSet = assignedIds.ToHashSet();
            }

            var byId = allActive.ToDictionary(m => m.ModuleId);

            // Parents auto-inclus si un enfant est assigné
            var visibleRootIds = new HashSet<int>();
            foreach (var id in assignedSet)
            {
                if (!byId.TryGetValue(id, out var mod))
                    continue;

                if (mod.ParentModuleId == null)
                {
                    visibleRootIds.Add(mod.ModuleId);
                }
                else
                {
                    visibleRootIds.Add(mod.ParentModuleId.Value);
                }
            }

            var result = new List<Module>();
            foreach (var root in allActive.Where(m => m.ParentModuleId == null && visibleRootIds.Contains(m.ModuleId)))
            {
                var visibleChildren = allActive
                    .Where(c => c.ParentModuleId == root.ModuleId && assignedSet.Contains(c.ModuleId))
                    .OrderBy(c => c.SortOrder)
                    .ToList();

                // Cloner sans navigation inverse pour éviter les cycles de sérialisation
                result.Add(new Module
                {
                    ModuleId = root.ModuleId,
                    Name = root.Name,
                    DisplayName = root.DisplayName,
                    Icon = root.Icon,
                    Route = root.Route,
                    ParentModuleId = root.ParentModuleId,
                    SortOrder = root.SortOrder,
                    State = root.State,
                    Description = root.Description,
                    ChildModules = visibleChildren.Select(c => new Module
                    {
                        ModuleId = c.ModuleId,
                        Name = c.Name,
                        DisplayName = c.DisplayName,
                        Icon = c.Icon,
                        Route = c.Route,
                        ParentModuleId = c.ParentModuleId,
                        SortOrder = c.SortOrder,
                        State = c.State,
                        Description = c.Description,
                        ChildModules = new List<Module>()
                    }).ToList()
                });
            }

            return result.OrderBy(m => m.SortOrder).ToList();
        }

        public async Task<(List<string> AllowedRoutes, List<string> CatalogRoutes)> GetAccessMapAsync(int userId)
        {
            var allActive = await _context.Modules
                .Where(m => m.State == 1)
                .ToListAsync();

            var catalogRoutes = allActive
                .Where(m => !string.IsNullOrWhiteSpace(m.Route))
                .Select(m => m.Route!)
                .Distinct()
                .ToList();

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return (new List<string>(), catalogRoutes);

            // Admin : toutes les routes du catalogue
            if (PermissionService.IsAdminRole(user.RoleId, user.Role?.Title))
                return (catalogRoutes, catalogRoutes);

            var assignedIds = await _context.RoleModules
                .Where(rm => rm.RoleId == user.RoleId)
                .Select(rm => rm.ModuleId)
                .ToListAsync();

            var assignedSet = assignedIds.ToHashSet();

            var allowedRoutes = allActive
                .Where(m => assignedSet.Contains(m.ModuleId) && !string.IsNullOrWhiteSpace(m.Route))
                .Select(m => m.Route!)
                .Distinct()
                .ToList();

            return (allowedRoutes, catalogRoutes);
        }

        public async Task<IEnumerable<Module>> GetModulesWithPermissionsAsync()
        {
            // Racines uniquement — les enfants sont embarqués via ChildModules (évite la duplication UI)
            return await _context.Modules
                .Where(m => m.State == 1 && m.ParentModuleId == null)
                .Include(m => m.Permissions.Where(p => p.State == 1))
                .Include(m => m.ChildModules.Where(c => c.State == 1).OrderBy(c => c.SortOrder))
                    .ThenInclude(c => c.Permissions.Where(p => p.State == 1))
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }

        public async Task ReorderModulesAsync(List<ModuleReorderItem> items)
        {
            if (items == null || !items.Any())
                return;

            var ids = items.Select(i => i.ModuleId).ToList();
            var modules = await _context.Modules
                .Where(m => ids.Contains(m.ModuleId))
                .ToListAsync();

            foreach (var item in items)
            {
                var mod = modules.FirstOrDefault(m => m.ModuleId == item.ModuleId);
                if (mod == null)
                    continue;

                mod.SortOrder = item.SortOrder;
                // Réordre au même niveau : le parent envoyé doit rester celui déjà présent (validé côté UI)
                mod.ParentModuleId = item.ParentModuleId;
            }

            await _context.SaveChangesAsync();
        }
    }
}
