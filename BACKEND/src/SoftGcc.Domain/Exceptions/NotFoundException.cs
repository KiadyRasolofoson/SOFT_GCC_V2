namespace SoftGcc.Domain.Exceptions;

/// <summary>Ressource demandée inexistante (HTTP 404).</summary>
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string message)
        : base(message)
    {
    }

    public NotFoundException(string resourceName, object identifier)
        : base($"{resourceName} avec l'identifiant {identifier} est introuvable.")
    {
    }

    public override int StatusCode => 404;
}
