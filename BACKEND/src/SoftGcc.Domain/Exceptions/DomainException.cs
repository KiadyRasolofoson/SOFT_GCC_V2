namespace SoftGcc.Domain.Exceptions;

/// <summary>
/// Racine de toutes les erreurs métier. Le middleware global traduit
/// <see cref="StatusCode"/> en réponse HTTP, ce qui évite tout try/catch dans les controllers.
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message)
        : base(message)
    {
    }

    protected DomainException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    /// <summary>Code HTTP à renvoyer au client pour ce type d'erreur métier.</summary>
    public abstract int StatusCode { get; }

    /// <summary>Erreurs détaillées par champ, exposées uniquement par les erreurs de validation.</summary>
    public virtual IReadOnlyDictionary<string, string[]>? Errors => null;
}
