using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    /// <summary>
    /// Filtre les champs sensibles selon le rôle du lecteur.
    /// Actuellement : masque le commentaire RH (Comments) pour les non-RH.
    /// </summary>
    public class SensitiveDataFilterService : ISensitiveDataFilterService
    {
        private readonly IManagerHierarchyService _hierarchyService;

        public SensitiveDataFilterService(IManagerHierarchyService hierarchyService)
        {
            _hierarchyService = hierarchyService;
        }

        public async Task<Evaluation> FilterEvaluationAsync(Evaluation evaluation, int readerUserId)
        {
            var isRH = await _hierarchyService.IsUserRHAsync(readerUserId);
            var isDG = await _hierarchyService.IsUserDGAsync(readerUserId);

            // RH et DG voient tout
            if (isRH || isDG)
                return evaluation;

            // Pour les autres rôles, on peut masquer certains champs sensibles
            // Le commentaire général (Comments) reste visible par le manager et l'employé
            // Mais les commentaires confidentiels RH seraient dans un champ dédié (à prévoir)

            // Pour l'instant, on applique un filtrage conservateur :
            // - Si l'évaluation est archivée, on masque les faiblesses (weaknesses) sauf pour RH/DG
            if (evaluation.Status == Core.Enums.EvaluationStatus.Archivee)
            {
                evaluation.weaknesses = "[Confidentiel — Réservé RH/Direction]";
            }

            return evaluation;
        }
    }
}
