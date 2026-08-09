namespace soft_carriere_competence.Core.Exceptions;

/// <summary>Données entrantes syntaxiquement valides mais métier-invalides (HTTP 422).</summary>
public sealed class ValidationException : DomainException
{
    private static readonly IReadOnlyDictionary<string, string[]> s_noFieldErrors =
        new Dictionary<string, string[]>();

    private readonly IReadOnlyDictionary<string, string[]> _fieldErrors;

    public ValidationException(string message)
        : base(message)
    {
        _fieldErrors = s_noFieldErrors;
    }

    public ValidationException(string message, IReadOnlyDictionary<string, string[]> fieldErrors)
        : base(message)
    {
        _fieldErrors = fieldErrors;
    }

    public override int StatusCode => 422;

    public override IReadOnlyDictionary<string, string[]>? Errors => _fieldErrors;
}
