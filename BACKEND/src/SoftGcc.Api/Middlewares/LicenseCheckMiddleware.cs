using SoftGcc.Application.Services.license;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Dtos.LicenseDto;

namespace SoftGcc.Api.Middlewares
{
    /// <summary>
    /// Options de configuration du middleware de vérification de licence.
    /// </summary>
    public class LicenseCheckMiddlewareOptions
    {
        /// <summary>
        /// Chemins exclus de la vérification (ex: /api/auth, /api/license, /swagger).
        /// </summary>
        public List<string> ExcludedPaths { get; set; } = new()
        {
            "/api/auth",
            "/api/license",
            "/swagger",
            "/health",
            "/hubs" // SignalR (negotiate / WebSocket) — la licence est déjà vérifiée via les API REST
        };

        /// <summary>
        /// Code de statut HTTP retourné en cas de licence invalide. Défaut : 403.
        /// </summary>
        public int FailureStatusCode { get; set; } = StatusCodes.Status403Forbidden;
    }

    /// <summary>
    /// Middleware ASP.NET Core qui vérifie le statut de la licence
    /// sur les routes protégées et retourne une réponse structurée en cas d'échec.
    /// 
    /// Inséré après UseAuthentication et avant UseAuthorization dans le pipeline.
    /// Toutes les exceptions sont capturées pour ne jamais renvoyer de 500 brute.
    /// </summary>
    public class LicenseCheckMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly LicenseCheckMiddlewareOptions _options;

        public LicenseCheckMiddleware(
            RequestDelegate next,
            LicenseCheckMiddlewareOptions? options = null)
        {
            _next = next;
            _options = options ?? new LicenseCheckMiddlewareOptions();
        }

        public async Task InvokeAsync(HttpContext context, ILicenseService licenseService)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

            if (IsPathExcluded(path))
            {
                await _next(context);
                return;
            }

            LicenseValidationResult status;
            try
            {
                status = await licenseService.GetStatus();
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var response = System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "internal_server_error",
                    message = "Une erreur interne est survenue. Veuillez réessayer ou contacter l'administrateur.",
                    detail = ex.Message
                });

                await context.Response.WriteAsync(response);
                return;
            }

            if (status.IsValid)
            {
                await _next(context);
                return;
            }

            context.Response.StatusCode = _options.FailureStatusCode;
            context.Response.ContentType = "application/json";

            var invalid = System.Text.Json.JsonSerializer.Serialize(new
            {
                error = "license_invalid",
                reason = status.ErrorReason.ToString(),
                message = status.ErrorMessage,
                isLicenseValid = false
            });

            await context.Response.WriteAsync(invalid);
        }

        /// <summary>
        /// Vérifie si le chemin demandé est exclu de la vérification de licence.
        /// </summary>
        private bool IsPathExcluded(string path)
        {
            foreach (var excluded in _options.ExcludedPaths)
            {
                if (path.StartsWith(excluded.ToLowerInvariant()))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
