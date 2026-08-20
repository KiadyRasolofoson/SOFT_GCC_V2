using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;

namespace SoftGcc.Application.Services.Evaluations
{
    public class PermissionService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IApplicationDbContext _context;

        public PermissionService(
            IEvaluationDataService dataService,
            IGenericRepository<User> userRepository,
            IApplicationDbContext context)
        {
            _dataService = dataService;
            _userRepository = userRepository;
            _context = context;
        }

        public async Task<IEnumerable<Permission>> GetAllAsync()
        {
            var permissions = await _dataService.GetAllPermissionsAsync();
            return permissions.Where(p => p.State == 1);
        }

        public async Task<Permission?> GetByIdAsync(int id)
        {
            return await _dataService.GetPermissionByIdAsync(id);
        }

        public async Task<Permission> CreateAsync(Permission permission)
        {
            permission.State = 1;
            await _dataService.CreatePermissionAsync(permission);
            return permission;
        }

        public async Task<Permission> UpdateAsync(Permission permission)
        {
            var existingPermission = await _dataService.GetPermissionByIdAsync(permission.PermissionId);
            if (existingPermission == null)
                throw new Exception("Permission non trouvée");

            existingPermission.Name = permission.Name;
            existingPermission.Description = permission.Description;
            existingPermission.State = permission.State;
            existingPermission.ModuleId = permission.ModuleId;
            await _dataService.UpdatePermissionAsync(existingPermission);
            return existingPermission;
        }

        public async Task DeleteAsync(int id)
        {
            var permission = await _dataService.GetPermissionByIdAsync(id);
            if (permission == null)
                throw new Exception("Permission non trouvée");

            permission.State = 0;
            await _dataService.UpdatePermissionAsync(permission);
        }

        public async Task<IEnumerable<Permission>> GetPermissionsByRoleIdAsync(int roleId)
        {
            var rolePermissions = await _dataService.GetPermissionsByRoleIdAsync(roleId);
            return rolePermissions.Select(rp => rp.Permission).Where(p => p != null).ToList();
        }

        public async Task DeleteRolePermissionsAsync(int roleId)
        {
            // Vérifier si le rôle existe
            var role = await _dataService.GetRoleByIdAsync(roleId);
            if (role == null)
                throw new Exception($"Le rôle avec l'ID {roleId} n'existe pas.");

            await _dataService.DeleteRolePermissionsAsync(roleId);
        }

        public async Task UpdateRolePermissionsAsync(int roleId, List<int> permissionIds)
        {
            var role = await _dataService.GetRoleByIdAsync(roleId);
            if (role == null)
                throw new Exception($"Le rôle avec l'ID {roleId} n'existe pas.");

            // Remplacer entièrement l'affectation
            await _dataService.DeleteRolePermissionsAsync(roleId);

            permissionIds ??= new List<int>();
            foreach (var permissionId in permissionIds.Distinct())
            {
                var permission = await _dataService.GetPermissionByIdAsync(permissionId);
                if (permission == null || permission.State != 1)
                    throw new Exception($"La permission avec l'ID {permissionId} n'existe pas ou n'est pas active.");

                await _dataService.AddRolePermissionAsync(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permissionId
                });
            }
        }

        /// <summary>
        /// Détecte un rôle Administrateur uniquement par titre.
        /// Ne pas s'appuyer sur role_id = 1 : sur les bases existantes l'Admin
        /// a souvent un autre id (ex. 3), et l'id 1 peut être Manager / RH.
        /// </summary>
        public static bool IsAdminRole(int roleId, string? roleTitle = null)
        {
            _ = roleId; // conservé pour compatibilité des appels existants (plus de bypass par id)

            if (string.IsNullOrWhiteSpace(roleTitle))
                return false;

            var t = roleTitle.Trim();
            return t.Equals("Admin", StringComparison.OrdinalIgnoreCase)
                || t.Equals("Administrator", StringComparison.OrdinalIgnoreCase)
                || t.Equals("Administrateur", StringComparison.OrdinalIgnoreCase);
        }

        public async Task<IEnumerable<Permission>> GetUserPermissionsAsync(int userId)
        {
            // Ne pas exiger la navigation Role (Include peut être null sans bloquer RoleId)
            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return new List<Permission>();
            }

            var rolePermissions = await _dataService.GetPermissionsByRoleIdAsync(user.RoleId);
            return rolePermissions.Select(rp => rp.Permission).Where(p => p != null).Select(p => p!).ToList();
        }

        /// <summary>
        /// Vérifie si l'utilisateur possède au moins une des permissions nommées (Role_Permissions).
        /// </summary>
        public async Task<bool> UserHasAnyPermissionAsync(int userId, params string[] permissionNames)
        {
            if (permissionNames == null || permissionNames.Length == 0)
                return false;

            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Id == userId, u => u.Role);
            if (user == null)
                return false;

            // Admin : accès complet (évite le blocage si le seed Role_Permissions cible le mauvais id)
            if (IsAdminRole(user.RoleId, user.Role?.Title))
                return true;

            var permissions = await GetUserPermissionsAsync(userId);
            var owned = permissions
                .Select(p => p.Name)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return permissionNames.Any(n => owned.Contains(n));
        }

        /// <summary>
        /// Vérifie si l'utilisateur possède toutes les permissions nommées.
        /// </summary>
        public async Task<bool> UserHasAllPermissionsAsync(int userId, params string[] permissionNames)
        {
            if (permissionNames == null || permissionNames.Length == 0)
                return false;

            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Id == userId, u => u.Role);
            if (user == null)
                return false;

            if (IsAdminRole(user.RoleId, user.Role?.Title))
                return true;

            var permissions = await GetUserPermissionsAsync(userId);
            var owned = permissions
                .Select(p => p.Name)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return permissionNames.All(n => owned.Contains(n));
        }

        public Task<List<Permission>> GetActiveWithModulesAsync()
            => _context.Permissions
                .AsNoTracking()
                .Where(p => p.State == 1)
                .OrderBy(p => p.Name)
                .ToListAsync();

        public Task<Permission?> GetByIdWithModuleAsync(int id)
            => _context.Permissions
                .Include(p => p.Module)
                .FirstOrDefaultAsync(p => p.PermissionId == id);

        public Task<List<Permission>> GetByModuleWithModuleAsync(int moduleId)
            => _context.Permissions
                .Where(p => p.State == 1 && p.ModuleId == moduleId)
                .Include(p => p.Module)
                .ToListAsync();

        public async Task<Dictionary<int, Module>> GetModulesByIdsAsync(IEnumerable<int> moduleIds)
        {
            var ids = moduleIds.Distinct().ToList();
            if (ids.Count == 0)
                return new Dictionary<int, Module>();

            return await _context.Modules
                .AsNoTracking()
                .Where(m => ids.Contains(m.ModuleId))
                .ToDictionaryAsync(m => m.ModuleId);
        }

        public async Task<Dictionary<int, (string Name, string DisplayName)>> GetModuleLookupAsync(IEnumerable<Permission> permissions)
        {
            var moduleIds = permissions
                .Select(p => p.ModuleId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            return await _context.Modules
                .Where(m => moduleIds.Contains(m.ModuleId))
                .ToDictionaryAsync(m => m.ModuleId, m => (m.Name, m.DisplayName));
        }
    }
} 