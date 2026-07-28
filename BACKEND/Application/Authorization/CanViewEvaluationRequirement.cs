using Microsoft.AspNetCore.Authorization;

namespace soft_carriere_competence.Application.Authorization
{
    /// <summary>
    /// Requirement : l'utilisateur peut-il consulter une évaluation ?
    /// Conditions : être l'employé évalué, son manager (direct/indirect), le superviseur désigné, ou RH/DG.
    /// </summary>
    public class CanViewEvaluationRequirement : IAuthorizationRequirement
    {
    }
}
