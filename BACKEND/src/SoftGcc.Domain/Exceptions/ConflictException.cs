namespace SoftGcc.Domain.Exceptions;

/// <summary>État courant de la ressource incompatible avec l'opération demandée (HTTP 409).</summary>
public sealed class ConflictException : DomainException
{
    public ConflictException(string message)
        : base(message)
    {
    }

    public override int StatusCode => 409;
}
