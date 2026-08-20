using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Dtos.Profile;

namespace SoftGcc.Application.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IApplicationDbContext _context;
    private readonly IManagerHierarchyService _hierarchyService;
    private readonly IModuleService _moduleService;

    public UserProfileService(
        IApplicationDbContext context,
        IManagerHierarchyService hierarchyService,
        IModuleService moduleService)
    {
        _context = context;
        _hierarchyService = hierarchyService;
        _moduleService = moduleService;
    }

    public async Task<UserProfileDto?> GetProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        var employeeId = await _hierarchyService.GetEmployeeIdForUserAsync(userId);
        string? registrationNumber = null;
        string? departmentName = null;

        if (employeeId != null)
        {
            var employee = await _context.Employee
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId.Value);

            registrationNumber = employee?.RegistrationNumber;

            if (employee?.Department_id != null)
            {
                var dept = await _context.Department
                    .FirstOrDefaultAsync(d => d.DepartmentId == employee.Department_id.Value);
                departmentName = dept?.Name;
            }
        }

        var permissions = await _context.rolePermissions
            .Where(rp => rp.RoleId == user.RoleId)
            .Join(_context.Permissions,
                rp => rp.PermissionId,
                p => p.PermissionId,
                (rp, p) => p.Name)
            .ToListAsync();

        List<string> moduleNames;
        try
        {
            var visibleModules = await _moduleService.GetMyModulesAsync(user.Id);
            moduleNames = visibleModules.Select(m => m.Name).Distinct().ToList();
        }
        catch (Exception)
        {
            moduleNames = DetermineVisibleModulesFallback(permissions, user.RoleId);
        }

        return new UserProfileDto
        {
            UserId = user.Id,
            UserName = user.Username ?? $"{user.FirstName} {user.LastName}",
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleTitle = user.Role?.Title ?? "Inconnu",
            EmployeeId = employeeId,
            RegistrationNumber = registrationNumber,
            DepartmentName = departmentName,
            VisibleModules = moduleNames,
            Permissions = permissions
        };
    }

    private static List<string> DetermineVisibleModulesFallback(List<string> permissions, int roleId)
    {
        var modules = new List<string>
        {
            "dashboard", "competences", "carrieres", "retraite",
            "souhaits", "organigramme", "historique"
        };

        if (permissions.Any(p => p.Contains("EVALUATION")) || roleId == 2)
            modules.Add("evaluations");

        if (roleId == 1 || roleId == 3 || roleId == 4)
            modules.Add("parametrage");

        if (permissions.Any(p => p.Contains("CERTIFICATE") || p.Contains("ATTESTATION")))
            modules.Add("attestations");

        return modules.Distinct().ToList();
    }
}
