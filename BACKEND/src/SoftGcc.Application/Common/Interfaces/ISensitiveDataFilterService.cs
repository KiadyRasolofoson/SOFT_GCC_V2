using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Application.Common.Interfaces
{
    /// <summary>
    /// Filtre les champs sensibles (ex: commentaires RH confidentiels) dans les DTOs
    /// selon le rôle du lecteur. Appliqué au niveau service, pas dans les handlers d'autorisation.
    /// </summary>
    public interface ISensitiveDataFilterService
    {
        /// <summary>
        /// Filtre une évaluation complète pour masquer les champs confidentiels
        /// que le lecteur courant n'est pas autorisé à voir.
        /// </summary>
        /// <param name="evaluation">L'évaluation à filtrer.</param>
        /// <param name="readerUserId">ID de l'utilisateur qui consulte.</param>
        /// <returns>La même entité, avec les champs sensibles masqués si nécessaire.</returns>
        Task<Evaluation> FilterEvaluationAsync(Evaluation evaluation, int readerUserId);
    }
}
