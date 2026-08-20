namespace SoftGcc.Domain.Exceptions;

/// <summary>Appelant authentifié mais sans les droits requis (HTTP 403).</summary>
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message)
        : base(message)
    {
    }

    public override int StatusCode => 403;
}
