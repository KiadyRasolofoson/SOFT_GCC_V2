using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Authorization.Handlers
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
        private readonly IApplicationDbContext _context;
        private readonly IManagerHierarchyService _hierarchyService;

        public CanViewEvaluationHandler(IApplicationDbContext context, IManagerHierarchyService hierarchyService)
        {
            _context = context;
            _hierarchyService = hierarchyService;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, CanViewEvaluationRequirement requirement)
        {
            var evaluationId = GetEvaluationIdFromRoute(context);

            if (await TrySucceedPortalTokenAsync(context, requirement, evaluationId))
                return;

            // 1. Extraire userId du JWT RH
            var userIdClaim = context.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                context.Fail();
                return;
            }

            var userId = int.Parse(userIdClaim);
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

        /// <summary>
        /// JWT temporaire du portail salarié : claims <c>sub</c> = employeeId et <c>evaluationId</c>.
        /// </summary>
        private async Task<bool> TrySucceedPortalTokenAsync(
            AuthorizationHandlerContext context,
            CanViewEvaluationRequirement requirement,
            int? routeEvaluationId)
        {
            var portalEmployeeId = GetPortalEmployeeId(context.User);
            var portalEvaluationClaim = context.User.FindFirst("evaluationId")?.Value;
            if (portalEmployeeId is null || string.IsNullOrWhiteSpace(portalEvaluationClaim))
                return false;

            if (!int.TryParse(portalEvaluationClaim, out var portalEvaluationId))
            {
                context.Fail();
                return true;
            }

            if (routeEvaluationId is null)
            {
                context.Succeed(requirement);
                return true;
            }

            if (portalEvaluationId != routeEvaluationId.Value)
            {
                context.Fail();
                return true;
            }

            var evaluation = await _context.Evaluations
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EvaluationId == routeEvaluationId.Value);

            if (evaluation == null)
            {
                context.Succeed(requirement);
                return true;
            }

            if (evaluation.EmployeeId == portalEmployeeId.Value)
            {
                context.Succeed(requirement);
                return true;
            }

            context.Fail();
            return true;
        }

        private static int? GetPortalEmployeeId(ClaimsPrincipal user)
        {
            var raw = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value;
            return int.TryParse(raw, out var employeeId) && employeeId > 0 ? employeeId : null;
        }
    }
}
