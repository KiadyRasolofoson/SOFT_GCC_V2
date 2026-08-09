namespace soft_carriere_competence.Application.Common;

/// <summary>
/// Enveloppe standard des réponses HTTP réussies. Les échecs empruntent
/// <see cref="ApiErrorResponse"/>, produit par le middleware global d'exceptions.
/// </summary>
public sealed record ApiResponse<T>(T? Data = default, string? Message = null)
{
    /// <summary>Toujours vrai : une réponse en échec est sérialisée en <see cref="ApiErrorResponse"/>.</summary>
    public bool Success => true;
}
