using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class PermissionService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<User> _userRepository;

        public PermissionService(IEvaluationDataService dataService, IGenericRepository<User> userRepository)
        {
            _dataService = dataService;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<Permission>> GetAllAsync()
        {
            var permissions = await _dataService.GetAllPermissionsAsync();
            return permissions.Where(p => p.State == 1);
        }

        public async Task<Permission> GetByIdAsync(int id)
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
            // Supprimer les anciennes permissions
            await _dataService.DeleteRolePermissionsAsync(roleId);

            // Ajouter les nouvelles associations
            foreach (var permissionId in permissionIds)
            {
                // Vérifier si la permission existe et est active
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

        public async Task<IEnumerable<Permission>> GetUserPermissionsAsync(int userId)
        {
            // Récupérer l'utilisateur avec son rôle
            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Id == userId, u => u.Role);

            if (user == null || user.Role == null)
            {
                Console.WriteLine($"Utilisateur {userId} ou son rôle non trouvé");
                return new List<Permission>();
            }

            Console.WriteLine($"Récupération des permissions pour l'utilisateur {userId} avec le rôle {user.Role.Title}");

            // Récupérer les permissions associées au rôle de l'utilisateur
            var rolePermissions = await _dataService.GetPermissionsByRoleIdAsync(user.RoleId);
            var permissions = rolePermissions.Select(rp => rp.Permission).Where(p => p != null).ToList();

            Console.WriteLine($"Nombre de permissions trouvées: {permissions.Count}");
            foreach (var permission in permissions)
            {
                Console.WriteLine($"Permission: {permission.Name}");
            }

            return permissions;
        }
    }
} 