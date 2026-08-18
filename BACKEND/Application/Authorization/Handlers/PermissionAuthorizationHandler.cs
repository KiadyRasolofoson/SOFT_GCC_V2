using Microsoft.AspNetCore.Authorization;
using soft_carriere_competence.Application.Services.Evaluations;

namespace soft_carriere_competence.Application.Authorization.Handlers
{
    /// <summary>
    /// Autorise si le rôle de l'utilisateur possède au moins une des permissions exigées
    /// (table Role_Permissions).
    /// </summary>
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly PermissionService _permissionService;

        public PermissionAuthorizationHandler(PermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (requirement.Permissions.Count == 0)
            {
                context.Fail();
                return;
            }

            // Bypass Admin via claim JWT roleTitle uniquement (pas role_id = 1)
            var roleIdClaim = context.User.FindFirst("roleId")?.Value;
            var roleTitleClaim = context.User.FindFirst("roleTitle")?.Value;
            _ = int.TryParse(roleIdClaim, out var roleId);
            if (PermissionService.IsAdminRole(roleId, roleTitleClaim))
            {
                context.Succeed(requirement);
                return;
            }

            var userIdClaim = context.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                // Comptes temporaires (portail salarié) : pas de userId → pas de RBAC Role_Permissions
                context.Fail();
                return;
            }

            var hasPermission = await _permissionService.UserHasAnyPermissionAsync(
                userId,
                requirement.Permissions.ToArray());

            if (hasPermission)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }
        }
    }
}
