using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Application.Authorization
{
    /// <summary>
    /// Requirement RBAC : l'utilisateur doit posséder au moins une des permissions listées
    /// via Role_Permissions.
    /// </summary>
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public IReadOnlyList<string> Permissions { get; }

        public PermissionRequirement(params string[] permissions)
        {
            Permissions = permissions?.Where(p => !string.IsNullOrWhiteSpace(p)).ToArray()
                ?? Array.Empty<string>();
        }
    }
}
