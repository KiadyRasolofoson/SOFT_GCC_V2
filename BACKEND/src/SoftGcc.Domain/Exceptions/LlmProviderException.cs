namespace SoftGcc.Domain.Exceptions;

/// <summary>Échec d'appel au fournisseur LLM (HTTP 502).</summary>
public sealed class LlmProviderException : DomainException
{
    public LlmProviderException(string message)
        : base(message)
    {
    }

    public LlmProviderException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public override int StatusCode => 502;
}
