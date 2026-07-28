using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Enums;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Authorization.Handlers
{
    /// <summary>
    /// Vérifie si l'utilisateur peut valider une évaluation selon le workflow 3 niveaux.
    /// Workflow :
    ///   Planifiée (10) → EnCours (15) : évaluateur désigné ou manager
    ///   EnCours (15)   → Terminée (20)  : validation N+1 (manager direct)
    ///   Terminée (20)  → (validation RH) : utilisateur avec rôle RH
    ///   Après RH        → (validation DG) : utilisateur avec rôle DG
    ///   Puis Archivée (30)
    /// 
    /// Simplification pour la v1 : tout manager peut valider N+1, tout RH peut valider RH, tout DG peut valider DG.
    /// </summary>
    public class CanValidateEvaluationHandler : AuthorizationHandler<CanValidateEvaluationRequirement>
    {
        private readonly ApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;

        public CanValidateEvaluationHandler(ApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CanValidateEvaluationRequirement requirement)
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
            var isManager = await _hierarchyService.IsManagerOfAsync(userId, evaluation.EmployeeId);

            var status = evaluation.Status;

            switch (status)
            {
                case EvaluationStatus.Planifiee:
                case EvaluationStatus.EnCours:
                    // N+1 : le manager direct peut faire passer de Planifiée/EnCours → Terminée
                    if (isManager)
                    {
                        context.Succeed(requirement);
                        return;
                    }
                    break;

                case EvaluationStatus.Terminee:
                    // Après validation N+1 : le RH valide
                    // Puis le DG valide en dernier
                    // On utilise IsServiceApproved / isDgApproved pour déterminer le niveau
                    if (isRH && evaluation.IsServiceApproved == true && evaluation.isDgApproved != true)
                    {
                        // Le manager a validé (IsServiceApproved), le RH peut maintenant valider
                        context.Succeed(requirement);
                        return;
                    }
                    if (isDG && evaluation.IsServiceApproved == true)
                    {
                        // Le DG peut valider après le manager (et optionnellement après le RH)
                        context.Succeed(requirement);
                        return;
                    }
                    // Si le manager n'a pas encore validé, seul le manager peut valider
                    if (isManager && evaluation.IsServiceApproved != true)
                    {
                        context.Succeed(requirement);
                        return;
                    }
                    break;
            }

            // RH et DG peuvent toujours valider (pouvoir de bypass)
            if (isRH || isDG)
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
