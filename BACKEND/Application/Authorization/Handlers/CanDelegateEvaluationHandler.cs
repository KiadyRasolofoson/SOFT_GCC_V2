using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Enums;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Authorization.Handlers
{
    /// <summary>
    /// Vérifie si l'utilisateur peut déléguer ses évaluations.
    /// Conditions :
    ///   - L'utilisateur est superviseur désigné de l'évaluation
    ///   - L'évaluation n'est pas dans un statut terminal (Annulée, Archivée)
    /// </summary>
    public class CanDelegateEvaluationHandler : AuthorizationHandler<CanDelegateEvaluationRequirement>
    {
        private readonly ApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;

        public CanDelegateEvaluationHandler(ApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CanDelegateEvaluationRequirement requirement)
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

            // Vérifier que le statut est éligible à la délégation
            var status = evaluation.Status;
            if (status == EvaluationStatus.Archivee || status == EvaluationStatus.Annulee)
            {
                context.Fail();
                return;
            }

            // L'utilisateur doit être superviseur désigné OU manager
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

            // RH/DG peuvent déléguer
            if (await _hierarchyService.IsUserRHAsync(userId) || await _hierarchyService.IsUserDGAsync(userId))
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
