using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LicenseGenerator.UI.Services
{
    /// <summary>
    /// Résultat de l'appel à l'API d'activation de licence.
    /// </summary>
    public class LicenseActivationResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? LicenseId { get; set; }
        public DateTime? ExpireAt { get; set; }
        public string? LicenseType { get; set; }

        public static LicenseActivationResult Success(ApiResponse response)
        {
            return new LicenseActivationResult
            {
                IsSuccess = true,
                Message = "Licence activée avec succès dans la base de données.",
                LicenseId = response.LicenseId,
                ExpireAt = response.ExpireAt,
                LicenseType = response.LicenseType
            };
        }

        public static LicenseActivationResult Failure(string message)
        {
            return new LicenseActivationResult
            {
                IsSuccess = false,
                Message = message
            };
        }
    }

    /// <summary>
    /// Représente la réponse JSON de l'API /api/license/activate.
    /// </summary>
    public class ApiResponse
    {
        [JsonPropertyName("isValid")]
        public bool IsValid { get; set; }

        [JsonPropertyName("licenseId")]
        public string? LicenseId { get; set; }

        [JsonPropertyName("expireAt")]
        public DateTime? ExpireAt { get; set; }

        [JsonPropertyName("licenseType")]
        public string? LicenseType { get; set; }

        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }

        [JsonPropertyName("errorReason")]
        public int? ErrorReason { get; set; }
    }

    /// <summary>
    /// Client HTTP pour interagir avec l'API de licence du backend SOFT GCC.
    /// </summary>
    public class LicenseApiClient
    {
        private readonly HttpClient _httpClient;

        public LicenseApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Envoie la clé de licence au backend pour activation en base de données.
        /// </summary>
        /// <param name="licenseKey">La clé de licence base64 générée.</param>
        /// <param name="apiBaseUrl">L'URL de base de l'API (ex: http://localhost:5001).</param>
        /// <returns>Résultat de l'activation.</returns>
        public async Task<LicenseActivationResult> ActivateLicenseAsync(string licenseKey, string apiBaseUrl)
        {
            try
            {
                var url = $"{apiBaseUrl.TrimEnd('/')}/api/license/activate";

                var payload = new { licenseKey };
                var response = await _httpClient.PostAsJsonAsync(url, payload);

                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                if (response.IsSuccessStatusCode)
                {
                    var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse>(jsonOptions);
                    if (apiResponse != null && apiResponse.IsValid)
                    {
                        return LicenseActivationResult.Success(apiResponse);
                    }
                    return LicenseActivationResult.Failure(
                        apiResponse?.ErrorMessage ?? "L'API a retourné un succès mais la licence est invalide.");
                }

                // Tentative de lire le corps d'erreur
                var errorBody = await response.Content.ReadAsStringAsync();
                ApiResponse? errorResponse = null;
                try
                {
                    errorResponse = JsonSerializer.Deserialize<ApiResponse>(errorBody, jsonOptions);
                }
                catch { /* le corps n'est pas du JSON valide */ }

                var message = errorResponse?.ErrorMessage
                    ?? (errorResponse?.ErrorReason.HasValue == true
                        ? $"Code erreur : {errorResponse.ErrorReason}"
                        : null)
                    ?? $"Erreur HTTP {(int)response.StatusCode} : {response.ReasonPhrase}";

                return LicenseActivationResult.Failure(message);
            }
            catch (HttpRequestException ex)
            {
                return LicenseActivationResult.Failure(
                    $"Impossible de contacter l'API à {apiBaseUrl.TrimEnd('/')}/api/license/activate.\n" +
                    $"Détail : {ex.Message}\n\n" +
                    "Vérifiez que le backend SOFT GCC est bien démarré.");
            }
            catch (TaskCanceledException)
            {
                return LicenseActivationResult.Failure(
                    "La requête a expiré (timeout). Vérifiez que l'API est accessible.");
            }
            catch (Exception ex)
            {
                return LicenseActivationResult.Failure($"Erreur inattendue : {ex.Message}");
            }
        }
    }
}
