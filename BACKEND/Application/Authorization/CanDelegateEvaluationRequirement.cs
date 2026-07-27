using Microsoft.AspNetCore.Authorization;

namespace soft_carriere_competence.Application.Authorization
{
    /// <summary>
    /// Requirement : l'utilisateur peut-il déléguer ses évaluations à un autre utilisateur ?
    /// Conditions : être superviseur désigné d'une évaluation en statut éligible (non archivée/annulée).
    /// </summary>
    public class CanDelegateEvaluationRequirement : IAuthorizationRequirement
    {
    }
}
