using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Enums;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Authorization.Handlers
{
    /// <summary>
    /// Vérifie si l'utilisateur peut consulter une évaluation.
    /// Règles (OR) :
    ///   1. L'utilisateur est l'employé évalué lui-même
    ///   2. L'utilisateur est un superviseur désigné de l'évaluation
    ///   3. L'utilisateur est le manager (direct ou indirect) de l'employé évalué
    ///   4. L'utilisateur a le rôle RH ou DG
    /// </summary>
    public class CanViewEvaluationHandler : AuthorizationHandler<CanViewEvaluationRequirement>
    {
        private readonly ApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;

        public CanViewEvaluationHandler(ApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CanViewEvaluationRequirement requirement)
        {
            // 1. Extraire userId du JWT
            var userIdClaim = context.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                context.Fail();
                return;
            }

            var userId = int.Parse(userIdClaim);

            // 2. Extraire evaluationId de la route
            var evaluationId = GetEvaluationIdFromRoute(context);
            if (evaluationId == null)
            {
                // Pas d'ID d'évaluation dans la route → on laisse passer (le contrôleur gérera)
                context.Succeed(requirement);
                return;
            }

            // 3. Récupérer l'évaluation
            var evaluation = await _context.Evaluations
                .Include(e => e.Supervisors)
                .FirstOrDefaultAsync(e => e.EvaluationId == evaluationId.Value);

            if (evaluation == null)
            {
                // L'évaluation n'existe pas → on laisse le contrôleur retourner 404
                context.Succeed(requirement);
                return;
            }

            // 4. Règle 1 : L'utilisateur est l'employé évalué
            var userEmployeeId = await _hierarchyService.GetEmployeeIdForUserAsync(userId);
            if (userEmployeeId != null && evaluation.EmployeeId == userEmployeeId.Value)
            {
                context.Succeed(requirement);
                return;
            }

            // 5. Règle 2 : L'utilisateur est un superviseur désigné
            if (evaluation.Supervisors.Any(s => s.SupervisorId == userId))
            {
                context.Succeed(requirement);
                return;
            }

            // 6. Règle 3 : L'utilisateur est le manager (direct ou indirect)
            if (await _hierarchyService.IsManagerOfAsync(userId, evaluation.EmployeeId))
            {
                context.Succeed(requirement);
                return;
            }

            // 7. Règle 4 : RH ou DG
            if (await _hierarchyService.IsUserRHAsync(userId) || await _hierarchyService.IsUserDGAsync(userId))
            {
                context.Succeed(requirement);
                return;
            }

            // Aucune règle satisfaite → refus
            context.Fail();
        }

        /// <summary>
        /// Extrait l'ID d'évaluation depuis les données de route HTTP.
        /// Supporte les patterns : {id}, {evaluationId}, {evaluation_id}.
        /// </summary>
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
