using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Api.Middlewares
{
    /// <summary>
    /// Filtre d'action pour journaliser automatiquement les consultations de données sensibles.
    /// Conformité RGPD : traçabilité des accès en lecture (pas seulement les écritures).
    /// 
    /// Utilisation : [ServiceFilter(typeof(AuditTrailActionFilter))]
    /// ou [AuditTrail("Evaluation", "id")] si on crée un attribut dédié.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class AuditTrailAttribute : ActionFilterAttribute
    {
        public string ResourceType { get; }
        public string RouteParamName { get; }
        public string AccessType { get; set; } = "Read";

        public AuditTrailAttribute(string resourceType, string routeParamName = "id")
        {
            ResourceType = resourceType;
            RouteParamName = routeParamName;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Exécuter l'action d'abord pour savoir si elle a réussi
            var executedContext = await next();

            // Ne journaliser que les accès réussis (2xx)
            if (executedContext.Result is ObjectResult objectResult &&
                objectResult.StatusCode >= 200 && objectResult.StatusCode < 300)
            {
                await LogAccessAsync(context, success: true, details: null);
            }
            else if (executedContext.Result is StatusCodeResult statusResult &&
                     statusResult.StatusCode >= 400)
            {
                await LogAccessAsync(context, success: false, details: $"HTTP {statusResult.StatusCode}");
            }
        }

        private async Task LogAccessAsync(ActionExecutingContext context, bool success, string? details)
        {
            try
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();

                var userIdClaim = context.HttpContext.User.FindFirst("userId")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return;

                var userId = int.Parse(userIdClaim);

                // Extraire l'ID de ressource de la route
                int? resourceId = null;
                if (context.RouteData.Values.TryGetValue(RouteParamName, out var idObj))
                {
                    if (idObj is string idStr && int.TryParse(idStr, out var id))
                        resourceId = id;
                    else if (idObj is int idInt)
                        resourceId = idInt;
                }

                var auditLog = new AccessAuditLog
                {
                    UserId = userId,
                    ResourceType = ResourceType,
                    ResourceId = resourceId ?? 0,
                    AccessType = AccessType,
                    AccessedAt = DateTime.UtcNow,
                    IpAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
                    UserAgent = context.HttpContext.Request.Headers["User-Agent"].FirstOrDefault() ?? "",
                    Success = success,
                    Details = details
                };

                dbContext.AccessAuditLogs.Add(auditLog);
                await dbContext.SaveChangesAsync();
            }
            catch
            {
                // L'audit ne doit jamais bloquer la réponse — on ignore silencieusement
            }
        }
    }
}
