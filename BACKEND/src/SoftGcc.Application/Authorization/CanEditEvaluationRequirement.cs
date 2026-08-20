using Microsoft.AspNetCore.Authorization;

namespace SoftGcc.Application.Authorization
{
    /// <summary>
    /// Requirement : l'utilisateur peut-il modifier une évaluation ?
    /// Mêmes conditions que CanView + statut non terminal (pas Terminée ni Archivée) sauf RH/DG.
    /// </summary>
    public class CanEditEvaluationRequirement : IAuthorizationRequirement
    {
    }
}
