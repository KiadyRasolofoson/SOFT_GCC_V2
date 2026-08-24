using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Application.Services.Evaluations;

namespace SoftGcc.Application.Services.AiAgent;

public sealed class AiToolPermissionResolver : IAiToolPermissionResolver
{
    private readonly IApplicationDbContext _db;
    private readonly PermissionService _permissionService;

    public AiToolPermissionResolver(IApplicationDbContext db, PermissionService permissionService)
    {
        _db = db;
        _permissionService = permissionService;
    }

    public async Task<bool> IsToolAllowedAsync(int userId, int roleId, IAiTool tool, CancellationToken cancellationToken = default)
    {
        var hasRbac = await _permissionService.UserHasAnyPermissionAsync(userId, tool.RequiredPermissions.ToArray());
        if (!hasRbac)
            return false;

        var userOverride = await _db.AiToolPermissions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ToolKey == tool.Key, cancellationToken);

        if (userOverride is not null)
            return userOverride.IsAllowed;

        var roleRule = await _db.AiToolPermissions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.RoleId == roleId && p.UserId == null && p.ToolKey == tool.Key, cancellationToken);

        if (roleRule is not null)
            return roleRule.IsAllowed;

        return true;
    }
}
