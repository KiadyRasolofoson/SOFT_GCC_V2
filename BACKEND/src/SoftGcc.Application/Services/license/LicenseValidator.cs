using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using SoftGcc.Application.Dtos.LicenseDto;

namespace SoftGcc.Application.Services.license
{
    /// <summary>
    /// Structure interne représentant le payload d'une licence après désérialisation.
    /// </summary>
    internal class LicensePayload
    {
        public string LicenseId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string MachineId { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; }
        public DateTime ExpireAt { get; set; }
        public string LicenseType { get; set; } = string.Empty;
        public List<string> Features { get; set; } = new();
    }

    /// <summary>
    /// Validateur de licence statique et sans état.
    /// Peut être utilisé à la fois par le service ASP.NET Core et par l'outil console LicenseGenerator (pour les tests).
    /// 
    /// Flux de validation :
    /// 1. Décodage base64 → séparation payload|signature
    /// 2. Parsing JSON du payload
    /// 3. Vérification de la signature RSA (SHA-256, PKCS1)
    /// 4. Vérification du MachineId
    /// 5. Vérification de la date d'expiration
    /// 6. Vérification anti-clock-rollback
    /// </summary>
    public static class LicenseValidator
    {
        /// <summary>
        /// Valide une clé de licence complète.
        /// </summary>
        /// <param name="licenseKey">Clé de licence au format base64(payload|signature).</param>
        /// <param name="currentMachineId">Identifiant de la machine locale.</param>
        /// <param name="publicKeyPem">Clé publique RSA au format PEM.</param>
        /// <param name="lastKnownValidTime">Dernière date de validation connue (pour la détection de clock rollback).</param>
        /// <returns>Un résultat de validation riche.</returns>
        public static LicenseValidationResult Validate(
            string licenseKey,
            string currentMachineId,
            string publicKeyPem,
            DateTime? lastKnownValidTime = null)
        {
            // Étape 1 : Décodage base64 et séparation payload|signature
            string payloadJson;
            byte[] signatureBytes;

            try
            {
                var decodedBytes = Convert.FromBase64String(licenseKey);
                var decodedStr = Encoding.UTF8.GetString(decodedBytes);

                var separatorIndex = decodedStr.LastIndexOf('|');
                if (separatorIndex < 0 || separatorIndex >= decodedStr.Length - 1)
                {
                    return LicenseValidationResult.Invalid(
                        LicenseErrorReason.InvalidFormat,
                        "Format invalide : le séparateur '|' est introuvable.");
                }

                payloadJson = decodedStr.Substring(0, separatorIndex);
                var signatureBase64 = decodedStr.Substring(separatorIndex + 1);
                signatureBytes = Convert.FromBase64String(signatureBase64);
                
            }
            catch (FormatException ex)
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.InvalidFormat,
                    $"Erreur de décodage base64 : {ex.Message}");
            }

            // Étape 2 : Parsing JSON du payload
            LicensePayload? payload;
            try
            {
                payload = JsonSerializer.Deserialize<LicensePayload>(payloadJson);
                if (payload == null)
                {
                    return LicenseValidationResult.Invalid(
                        LicenseErrorReason.CorruptedPayload,
                        "Le payload JSON est nul après désérialisation.");
                }
            }
            catch (JsonException ex)
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.CorruptedPayload,
                    $"Erreur de désérialisation JSON : {ex.Message}");
            }

            // Étape 3 : Vérification de la signature RSA
            try
            {
                using var rsa = RSA.Create();
                rsa.ImportFromPem(publicKeyPem.ToCharArray());

                var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
                var isSignatureValid = rsa.VerifyData(
                    payloadBytes,
                    signatureBytes,
                    HashAlgorithmName.SHA256,
                    RSASignaturePadding.Pkcs1);

                if (!isSignatureValid)
                {
                    return LicenseValidationResult.Invalid(
                        LicenseErrorReason.InvalidSignature,
                        "La signature RSA ne correspond pas au payload. La licence a été falsifiée.");
                }
            }
            catch (CryptographicException ex)
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.InvalidSignature,
                    $"Erreur cryptographique lors de la vérification : {ex.Message}");
            }

            // Étape 4 : Parsing du LicenseId
            if (!Guid.TryParse(payload.LicenseId, out var licenseGuid))
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.CorruptedPayload,
                    "L'identifiant de licence (LicenseId) est invalide.");
            }

            // Étape 5 : Vérification du MachineId
            if (!string.Equals(payload.MachineId, currentMachineId, StringComparison.Ordinal))
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.MachineMismatch,
                    $"La licence est liée à la machine '{payload.MachineId}', mais la machine actuelle est '{currentMachineId}'.");
            }

            // Étape 6 : Vérification de la date d'expiration
            var now = DateTime.UtcNow;
            if (payload.ExpireAt < now)
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.Expired,
                    $"La licence a expiré le {payload.ExpireAt:yyyy-MM-dd HH:mm:ss} UTC (actuellement : {now:yyyy-MM-dd HH:mm:ss} UTC).");
            }

            // Étape 7 : Vérification anti-clock-rollback
            if (lastKnownValidTime.HasValue && now < lastKnownValidTime.Value)
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.ClockRollback,
                    $"L'heure système actuelle ({now:yyyy-MM-dd HH:mm:ss} UTC) est antérieure à la dernière validation connue ({lastKnownValidTime.Value:yyyy-MM-dd HH:mm:ss} UTC). Un rollback d'horloge a été détecté.");
            }

            // Succès : licence valide
            return LicenseValidationResult.Valid(
                licenseGuid,
                payload.ExpireAt,
                payload.LicenseType,
                payload.Features ?? new List<string>(),
                payload.CustomerId,
                payload.MachineId);
        }
    }
}
