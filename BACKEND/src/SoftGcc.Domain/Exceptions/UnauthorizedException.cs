namespace SoftGcc.Domain.Exceptions;

/// <summary>Appelant non authentifié ou jeton invalide (HTTP 401).</summary>
public sealed class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message)
        : base(message)
    {
    }

    public override int StatusCode => 401;
}
