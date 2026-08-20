using System.Text.Json;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using SoftGcc.Domain.Exceptions;
using SoftGcc.Api.Middlewares;

using Xunit;

namespace SoftGcc.Tests.Middleware
{
    /// <summary>
    /// Tests unitaires du middleware global de gestion d'exceptions : c'est lui qui garantit
    /// qu'aucun détail technique ne fuit vers le client et que les codes HTTP restent corrects.
    /// </summary>
    public class GlobalExceptionHandlingMiddlewareTests
    {
        private const string DevelopmentEnvironment = "Development";
        private const string ProductionEnvironment = "Production";

        [Fact]
        public async Task InvokeAsync_NotFoundException_Returns404WithBusinessMessage()
        {
            // Arrange
            var context = CreateHttpContext();
            var middleware = CreateMiddleware(
                _ => throw new NotFoundException("Question d'évaluation", 42),
                ProductionEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
            var payload = await ReadPayloadAsync(context);
            Assert.False(payload.GetProperty("success").GetBoolean());
            Assert.Contains("42", payload.GetProperty("message").GetString());
            Assert.Equal(payload.GetProperty("message").GetString(), payload.GetProperty("error").GetString());
        }

        [Fact]
        public async Task InvokeAsync_ValidationException_Returns422WithFieldErrors()
        {
            // Arrange
            var fieldErrors = new Dictionary<string, string[]> { ["question"] = ["La question est requise."] };
            var context = CreateHttpContext();
            var middleware = CreateMiddleware(
                _ => throw new ValidationException("Données invalides.", fieldErrors),
                ProductionEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal(StatusCodes.Status422UnprocessableEntity, context.Response.StatusCode);
            var payload = await ReadPayloadAsync(context);
            var errors = payload.GetProperty("errors").GetProperty("question");
            Assert.Equal("La question est requise.", errors[0].GetString());
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedExceptionInProduction_HidesTechnicalDetails()
        {
            // Arrange
            const string technicalMessage = "Invalid column name 'Employee_id' on table Evaluation.";
            var context = CreateHttpContext();
            var middleware = CreateMiddleware(_ => throw new InvalidOperationException(technicalMessage),
                ProductionEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
            var body = await ReadBodyAsync(context);
            Assert.DoesNotContain(technicalMessage, body);
            Assert.DoesNotContain("StackTrace", body, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedExceptionInDevelopment_ExposesExceptionMessage()
        {
            // Arrange
            const string technicalMessage = "Séquence vide.";
            var context = CreateHttpContext();
            var middleware = CreateMiddleware(_ => throw new InvalidOperationException(technicalMessage),
                DevelopmentEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            var payload = await ReadPayloadAsync(context);
            Assert.Equal(technicalMessage, payload.GetProperty("message").GetString());
        }

        [Fact]
        public async Task InvokeAsync_NoException_LeavesResponseUntouched()
        {
            // Arrange
            var context = CreateHttpContext();
            var middleware = CreateMiddleware(_ => Task.CompletedTask, ProductionEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
            Assert.Empty(await ReadBodyAsync(context));
        }

        [Fact]
        public async Task InvokeAsync_ClientAbortedRequest_DoesNotWriteErrorPayload()
        {
            // Arrange
            var context = CreateHttpContext();
            using var abortSource = new CancellationTokenSource();
            await abortSource.CancelAsync();
            context.RequestAborted = abortSource.Token;
            var middleware = CreateMiddleware(_ => throw new OperationCanceledException(), ProductionEnvironment);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Empty(await ReadBodyAsync(context));
        }

        private static DefaultHttpContext CreateHttpContext()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            return context;
        }

        private static GlobalExceptionHandlingMiddleware CreateMiddleware(
            RequestDelegate next,
            string environmentName)
        {
            var environment = new Mock<IHostEnvironment>();
            environment.SetupGet(host => host.EnvironmentName).Returns(environmentName);

            return new GlobalExceptionHandlingMiddleware(
                next,
                NullLogger<GlobalExceptionHandlingMiddleware>.Instance,
                environment.Object);
        }

        private static async Task<string> ReadBodyAsync(HttpContext context)
        {
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);

            return await reader.ReadToEndAsync();
        }

        private static async Task<JsonElement> ReadPayloadAsync(HttpContext context)
        {
            var body = await ReadBodyAsync(context);

            return JsonSerializer.Deserialize<JsonElement>(body);
        }
    }
}
