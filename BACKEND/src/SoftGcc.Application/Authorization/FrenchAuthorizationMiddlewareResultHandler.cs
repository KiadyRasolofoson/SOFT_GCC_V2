using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;

namespace SoftGcc.Application.Authorization
{
    /// <summary>
    /// Renvoie des messages JSON clairs en français pour 401 (non authentifié)
    /// et 403 (permission refusée / Role_Permissions).
    /// </summary>
    public sealed class FrenchAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
    {
        private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

        public const string PermissionDeniedError = "permission_denied";
        public const string UnauthorizedError = "unauthorized";

        public const string PermissionDeniedMessage =
            "Vous n'avez pas les droits nécessaires pour effectuer cette action. " +
            "Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.";

        public const string UnauthorizedMessage =
            "Votre session a expiré ou vous n'êtes pas connecté. Veuillez vous reconnecter.";

        public async Task HandleAsync(
            RequestDelegate next,
            HttpContext context,
            AuthorizationPolicy policy,
            PolicyAuthorizationResult authorizeResult)
        {
            if (authorizeResult.Challenged)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = UnauthorizedError,
                    title = "Authentification requise",
                    message = UnauthorizedMessage
                });
                return;
            }

            if (authorizeResult.Forbidden)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = PermissionDeniedError,
                    title = "Permission refusée",
                    message = PermissionDeniedMessage
                });
                return;
            }

            await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
        }
    }
}
