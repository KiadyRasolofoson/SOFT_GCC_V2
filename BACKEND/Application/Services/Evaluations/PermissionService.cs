using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class PermissionService
    {
        private readonly ApplicationDbContext _context;

        public PermissionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Permission>> GetAllAsync()
        {
            return await _context.Permissions
                .Where(p => p.State == 1)
                .ToListAsync();
        }

        public async Task<Permission> GetByIdAsync(int id)
        {
            return await _context.Permissions
                .FirstOrDefaultAsync(p => p.PermissionId == id && p.State == 1);
        }

        public async Task<Permission> CreateAsync(Permission permission)
        {
            permission.State = 1;
            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();
            return permission;
        }

        public async Task<Permission> UpdateAsync(Permission permission)
        {
            var existingPermission = await _context.Permissions.FindAsync(permission.PermissionId);
            if (existingPermission == null)
                throw new Exception("Permission non trouvée");

            existingPermission.Name = permission.Name;
            existingPermission.Description = permission.Description;
            existingPermission.State = permission.State;
            await _context.SaveChangesAsync();
            return existingPermission;
        }

        public async Task DeleteAsync(int id)
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null)
                throw new Exception("Permission non trouvée");

            permission.State = 0;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Permission>> GetPermissionsByRoleIdAsync(int roleId)
        {
            return await _context.rolePermissions
                .Where(rp => rp.RoleId == roleId)
                .Include(rp => rp.Permission)
                .Select(rp => rp.Permission)
                .Where(p => p.State == 1)
                .ToListAsync();
        }

        public async Task DeleteRolePermissionsAsync(int roleId)
        {
            // Vérifier si le rôle existe
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
                throw new Exception($"Le rôle avec l'ID {roleId} n'existe pas.");

            // Supprimer les anciennes associations
            var existingPermissions = await _context.rolePermissions
                .Where(rp => rp.RoleId == roleId)
                .ToListAsync();

            if (existingPermissions.Any())
            {
                _context.rolePermissions.RemoveRange(existingPermissions);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateRolePermissionsAsync(int roleId, List<int> permissionIds)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Supprimer les anciennes permissions
                    await DeleteRolePermissionsAsync(roleId);

                    // Ajouter les nouvelles associations
                    foreach (var permissionId in permissionIds)
                    {
                        // Vérifier si la permission existe et est active
                        var permission = await _context.Permissions
                            .FirstOrDefaultAsync(p => p.PermissionId == permissionId && p.State == 1);
                        
                        if (permission == null)
                            throw new Exception($"La permission avec l'ID {permissionId} n'existe pas ou n'est pas active.");

                        _context.rolePermissions.Add(new RolePermission
                        {
                            RoleId = roleId,
                            PermissionId = permissionId
                        });
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw new Exception($"Erreur lors de la mise à jour des permissions : {ex.Message}");
                }
            }
        }

        public async Task<IEnumerable<Permission>> GetUserPermissionsAsync(int userId)
        {
            // Récupérer l'utilisateur avec son rôle
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role == null)
            {
                Console.WriteLine($"Utilisateur {userId} ou son rôle non trouvé");
                return new List<Permission>();
            }

            Console.WriteLine($"Récupération des permissions pour l'utilisateur {userId} avec le rôle {user.Role.Title}");

            // Récupérer les permissions associées au rôle de l'utilisateur
            var permissions = await _context.rolePermissions
                .Where(rp => rp.RoleId == user.RoleId)
                .Include(rp => rp.Permission)
                .Select(rp => rp.Permission)
                .ToListAsync();

            Console.WriteLine($"Nombre de permissions trouvées: {permissions.Count}");
            foreach (var permission in permissions)
            {
                Console.WriteLine($"Permission: {permission.Name}");
            }

            return permissions;
        }
    }
} 