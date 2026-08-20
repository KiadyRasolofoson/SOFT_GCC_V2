using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    /// <summary>
    /// Implémentation du service de résolution hiérarchique.
    /// Parcourt Employee.ManagerId récursivement.
    /// </summary>
    public class ManagerHierarchyService : IManagerHierarchyService
    {
        private readonly ApplicationDbContext _context;

        // Rôle IDs basés sur les seeds connus du projet (bdd/eval/03_DONNEES_ESSENTIELLES.sql)
        private const int RHRoleId = 3;
        private const int DGRoleId = 4;

        public ManagerHierarchyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int?> GetEmployeeIdForUserAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user?.EmployeeId;
        }

        public async Task<int?> GetDirectManagerIdAsync(int employeeId)
        {
            var employee = await _context.Employee
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);

            return employee?.ManagerId;
        }

        public async Task<bool> IsManagerOfAsync(int managerUserId, int employeeId)
        {
            // Résoudre User → Employee pour le manager
            var managerEmployeeId = await GetEmployeeIdForUserAsync(managerUserId);
            if (managerEmployeeId == null)
                return false;

            // Parcourir la chaîne hiérarchique de l'employé vers le haut
            return await IsInManagementChainAsync(employeeId, managerEmployeeId.Value);
        }

        public async Task<List<int>> GetManagedEmployeeIdsAsync(int managerUserId)
        {
            var managerEmployeeId = await GetEmployeeIdForUserAsync(managerUserId);
            if (managerEmployeeId == null)
                return new List<int>();

            // Récupérer tous les employés et construire l'arbre descendant
            var allEmployees = await _context.Employee
                .AsNoTracking()
                .Select(e => new EmployeeHierarchyNode { EmployeeId = e.EmployeeId, ManagerId = e.ManagerId })
                .ToListAsync();

            var result = new List<int>();
            CollectSubordinates(allEmployees, managerEmployeeId.Value, result);
            return result;
        }

        public async Task<bool> IsUserRHAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user?.RoleId == RHRoleId;
        }

        public async Task<bool> IsUserDGAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user?.RoleId == DGRoleId;
        }

        /// <summary>
        /// Vérifie récursivement si un employé est dans la chaîne managériale d'un manager donné.
        /// Remonte la hiérarchie de l'employé vers le haut (ManagerId → ManagerId → ...).
        /// </summary>
        private async Task<bool> IsInManagementChainAsync(int employeeId, int targetManagerEmployeeId)
        {
            var visited = new HashSet<int>();
            var currentEmployeeId = employeeId;

            while (currentEmployeeId != 0 && visited.Add(currentEmployeeId))
            {
                if (currentEmployeeId == targetManagerEmployeeId)
                    return true; // L'employé EST le manager (un manager peut s'auto-évaluer ? non, mais le manager peut être aussi un employé)

                var employee = await _context.Employee
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.EmployeeId == currentEmployeeId);

                if (employee?.ManagerId == null)
                    break;

                if (employee.ManagerId.Value == targetManagerEmployeeId)
                    return true;

                currentEmployeeId = employee.ManagerId.Value;
            }

            return false;
        }

        /// <summary>
        /// Parcourt récursivement l'arbre descendant pour collecter tous les subordonnés.
        /// </summary>
        private void CollectSubordinates(List<EmployeeHierarchyNode> allEmployees, int managerEmployeeId, List<int> result)
        {
            var directReports = allEmployees
                .Where(e => e.ManagerId == managerEmployeeId)
                .Select(e => e.EmployeeId)
                .ToList();

            foreach (var reportId in directReports)
            {
                result.Add(reportId);
                CollectSubordinates(allEmployees, reportId, result);
            }
        }

        /// <summary>
        /// DTO interne pour la représentation hiérarchique.
        /// </summary>
        private class EmployeeHierarchyNode
        {
            public int EmployeeId { get; set; }
            public int? ManagerId { get; set; }
        }
    }
}
