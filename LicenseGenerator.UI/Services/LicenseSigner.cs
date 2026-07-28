using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LicenseGenerator.UI.Models;

namespace LicenseGenerator.UI.Services
{
    /// <summary>
    /// Service de signature de licence.
    /// Porte la logique de LicenseGenerator/Program.cs : 
    /// sérialisation JSON → signature RSA 4096 SHA-256 PKCS1 → format base64(payload|signature).
    /// </summary>
    public class LicenseSigner
    {
        /// <summary>
        /// Génère une clé de licence signée au format base64.
        /// </summary>
        /// <param name="payload">Le payload de la licence.</param>
        /// <param name="privateKeyPem">La clé privée RSA au format PEM.</param>
        /// <returns>La clé de licence encodée en base64.</returns>
        public string GenerateLicenseKey(LicensePayload payload, string privateKeyPem)
        {
            // 1. Sérialiser le payload en JSON (sans indentation, pour minimiser la taille)
            var payloadJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                WriteIndented = false
            });

            // 2. Créer l'instance RSA et importer la clé privée
            using var rsa = RSA.Create();
            rsa.ImportFromPem(privateKeyPem.AsSpan());

            // 3. Signer le payload
            var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
            var signature = rsa.SignData(payloadBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

            // 4. Format final : base64(payload|signature)
            var combined = $"{payloadJson}|{Convert.ToBase64String(signature)}";
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(combined));
        }
    }
}
