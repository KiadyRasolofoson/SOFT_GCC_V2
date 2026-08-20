using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Enums;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Authorization.Handlers
{
    /// <summary>
    /// Vérifie si l'utilisateur peut modifier une évaluation.
    /// Mêmes conditions que CanView PLUS :
    ///   - Le statut ne doit pas être Terminée ou Archivée (sauf RH/DG qui peuvent toujours modifier).
    ///   - Le statut ne doit pas être Annulée.
    /// </summary>
    public class CanEditEvaluationHandler : AuthorizationHandler<CanEditEvaluationRequirement>
    {
        private readonly IApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;

        public CanEditEvaluationHandler(IApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CanEditEvaluationRequirement requirement)
        {
            var userIdClaim = context.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                context.Fail();
                return;
            }

            var userId = int.Parse(userIdClaim);
            var evaluationId = GetEvaluationIdFromRoute(context);
            if (evaluationId == null)
            {
                context.Succeed(requirement);
                return;
            }

            var evaluation = await _context.Evaluations
                .Include(e => e.Supervisors)
                .FirstOrDefaultAsync(e => e.EvaluationId == evaluationId.Value);

            if (evaluation == null)
            {
                context.Succeed(requirement);
                return;
            }

            var isRH = await _hierarchyService.IsUserRHAsync(userId);
            var isDG = await _hierarchyService.IsUserDGAsync(userId);

            // RH et DG peuvent toujours éditer, même les évaluations terminées/archivées
            if (isRH || isDG)
            {
                context.Succeed(requirement);
                return;
            }

            // Vérifier le statut : bloquer l'édition si l'évaluation est terminée, archivée ou annulée
            var status = evaluation.Status;
            if (status == EvaluationStatus.Terminee ||
                status == EvaluationStatus.Archivee ||
                status == EvaluationStatus.Annulee)
            {
                context.Fail();
                return;
            }

            // Vérifier les droits de base (employé évalué, superviseur, manager)
            var userEmployeeId = await _hierarchyService.GetEmployeeIdForUserAsync(userId);
            if (userEmployeeId != null && evaluation.EmployeeId == userEmployeeId.Value)
            {
                context.Succeed(requirement);
                return;
            }

            if (evaluation.Supervisors.Any(s => s.SupervisorId == userId))
            {
                context.Succeed(requirement);
                return;
            }

            if (await _hierarchyService.IsManagerOfAsync(userId, evaluation.EmployeeId))
            {
                context.Succeed(requirement);
                return;
            }

            context.Fail();
        }

        private static int? GetEvaluationIdFromRoute(AuthorizationHandlerContext context)
        {
            if (context.Resource is HttpContext httpContext)
            {
                var routeValues = httpContext.Request.RouteValues;
                if (routeValues.TryGetValue("evaluationId", out var evalIdObj) ||
                    routeValues.TryGetValue("evaluation_id", out evalIdObj) ||
                    routeValues.TryGetValue("id", out evalIdObj))
                {
                    if (evalIdObj is string idStr && int.TryParse(idStr, out var id))
                        return id;
                    if (evalIdObj is int idInt)
                        return idInt;
                }
            }
            return null;
        }
    }
}
