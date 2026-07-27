using Microsoft.AspNetCore.Authorization;

namespace soft_carriere_competence.Application.Authorization
{
    /// <summary>
    /// Requirement : l'utilisateur peut-il valider une évaluation ?
    /// Workflow 3 niveaux :
    ///   - N+1 (Manager) : statut Planifiée ou EnCours → validation N+1
    ///   - RH : après validation N+1 → validation RH
    ///   - DG : après validation RH → validation finale DG
    /// </summary>
    public class CanValidateEvaluationRequirement : IAuthorizationRequirement
    {
    }
}
