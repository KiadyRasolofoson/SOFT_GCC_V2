using soft_carriere_competence.Application.Services.license;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Middleware
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
            "/health"
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
            try
            {
                var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

                // Ignore les chemins exclus
                if (IsPathExcluded(path))
                {
                    await _next(context);
                    return;
                }

                // Vérifie le statut de la licence
                var status = await licenseService.GetStatus();

                if (status.IsValid)
                {
                    // Licence valide : continue le pipeline
                    await _next(context);
                    return;
                }

                // Licence invalide : retourne une réponse structurée
                context.Response.StatusCode = _options.FailureStatusCode;
                context.Response.ContentType = "application/json";

                var response = System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "license_invalid",
                    reason = status.ErrorReason.ToString(),
                    message = status.ErrorMessage,
                    isLicenseValid = false
                });

                await context.Response.WriteAsync(response);
            }
            catch (Exception ex)
            {
                // Capture toutes les exceptions pour ne jamais renvoyer de 500 brute
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";

                var response = System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "internal_server_error",
                    message = "Une erreur interne est survenue. Veuillez réessayer ou contacter l'administrateur.",
                    detail = ex.Message
                });

                await context.Response.WriteAsync(response);
            }
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
