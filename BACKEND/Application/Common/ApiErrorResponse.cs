namespace soft_carriere_competence.Application.Common;

/// <summary>
/// Enveloppe standard des réponses HTTP en échec. Aucun détail technique (message
/// d'exception brut, stack trace, requête SQL) ne doit transiter par ce type en production.
/// </summary>
public sealed record ApiErrorResponse(
    string Message,
    string? TraceId = null,
    IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public bool Success => false;

    /// <summary>Alias de <see cref="Message"/> : les clients React existants lisent déjà `data.error`.</summary>
    public string Error => Message;
}
