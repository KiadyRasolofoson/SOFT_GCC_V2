using System.Text.Json;

using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Core.Exceptions;

namespace soft_carriere_competence.Middleware;

/// <summary>
/// Traduit toute exception remontant du pipeline en réponse HTTP normalisée.
/// C'est ce middleware qui rend inutile — et interdit — tout try/catch dans les controllers.
/// </summary>
public sealed class GlobalExceptionHandlingMiddleware
{
    private const string GenericFailureMessage =
        "Une erreur interne est survenue. Communiquez l'identifiant de trace à l'administrateur.";

    private static readonly JsonSerializerOptions s_jsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException exception)
        {
            _logger.LogWarning(exception, "Règle métier violée sur {Method} {Path} (trace {TraceId}).",
                context.Request.Method, context.Request.Path, context.TraceIdentifier);

            await WriteErrorResponseAsync(context, exception.StatusCode, exception.Message, exception.Errors);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation("Requête {Method} {Path} abandonnée par le client.",
                context.Request.Method, context.Request.Path);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Erreur non gérée sur {Method} {Path} (trace {TraceId}).",
                context.Request.Method, context.Request.Path, context.TraceIdentifier);

            await WriteErrorResponseAsync(context, StatusCodes.Status500InternalServerError,
                ResolveFailureMessage(exception), errors: null);
        }
    }

    private async Task WriteErrorResponseAsync(HttpContext context, int statusCode, string message,
        IReadOnlyDictionary<string, string[]>? errors)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning("Réponse déjà entamée : le code {StatusCode} n'a pas pu être renvoyé.", statusCode);
            return;
        }

        context.Response.StatusCode = statusCode;
        var payload = new ApiErrorResponse(message, context.TraceIdentifier, errors);

        await context.Response.WriteAsJsonAsync(payload, s_jsonOptions);
    }

    /// <summary>
    /// Hors développement, le message d'exception reste confiné aux logs : il peut révéler
    /// le schéma de base, un chemin de fichier ou une chaîne de connexion.
    /// </summary>
    private string ResolveFailureMessage(Exception exception) =>
        _environment.IsDevelopment() ? exception.Message : GenericFailureMessage;
}
