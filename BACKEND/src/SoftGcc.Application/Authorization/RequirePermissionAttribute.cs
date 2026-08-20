using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Application.Authorization
{
    /// <summary>
    /// Attribut pratique : [RequirePermission("VIEW_EVALUATIONS", "MANAGE_EVALUATIONS")]
    /// Autorise si l'utilisateur a AU MOINS une des permissions.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequirePermissionAttribute : AuthorizeAttribute
    {
        public RequirePermissionAttribute(params string[] permissions)
        {
            if (permissions == null || permissions.Length == 0)
                throw new ArgumentException("Au moins une permission est requise.", nameof(permissions));

            Policy = PermissionPolicyProvider.PolicyPrefix + string.Join(",", permissions);
        }
    }
}
