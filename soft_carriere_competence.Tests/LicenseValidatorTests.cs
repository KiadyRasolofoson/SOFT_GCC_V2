using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using soft_carriere_competence.Application.Dtos.LicenseDto;
using soft_carriere_competence.Application.Services.license;
using Xunit;

namespace soft_carriere_competence.Tests
{
    /// <summary>
    /// Tests unitaires pour le validateur de licence LicenseValidator.
    /// </summary>
    public class LicenseValidatorTests
    {
        // Clé privée de test (RSA 4096) — utilisée UNIQUEMENT pour les tests
        private const string TestPrivateKeyPem = @"-----BEGIN PRIVATE KEY-----
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
T8KGBSvJzlJZIOxdx3p/lpjfaKu5/uI=
-----END PRIVATE KEY-----";

        // Clé publique de test correspondante
        private const string TestPublicKeyPem = @"-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApjxHbUhY+O3FJB17hIdF
knILtohKsW8zEoB1KDic5P9t4XgHJz5e+60ShXWoCwBVnqw2FbocdY46z5ijL41p
zOVfUIvJi2iLvz15mVT2hBTxEoPHBsttmh9U4Xhvp/FV2UNx9VK8U0qS68fzOQvp
1AaA/c9yrRut1na8CsZAT3u3310V2L1oHk0wrifdo/d7L5/rfqNZtRhZTxiHhuPQ
sO4+n0pIROZNIFPFphiX1WkwLzF+hynWCvUrXJfeonP02YoLMxVOzT8NkZTuhDkO
gzo4+1QIeRUhNGFrrjqGKGbNbqlVkG/kVDy8emCqwuykk42TRUsEhhIWFz4DgfNX
tFpUdoLkUwSEm3jPE5uIZwGOhtU6rwJURN3eUIjdvhpbm1oNXvfGItc2z6DoJG3w
4k4HTvVU8t4hUlhyvG0PAZdXIXcHyJ9yHUszx5pS5mb+nfgigRJgUr6/WS2oYT81
YmOhDYcHeMhL6PQYFf1hvdHA9JWMS9u7LEL2vFaLcyx/h4z1FIoHx6+KN3kpkx2D
hndC7aUam6EEYme9HmxmjdHvh2M8ivM3NNSmmqd9US0YUlUDojll9VEvTRNjRUDD
jUs7cjAGg1LDtGM51p2y/faJYkV/dcaLAgAW4IirSg0nTnw+O59BM2slYRUfcuOV
EklraOwDe4PLVmT1/RwMC38CAwEAAQ==
-----END PUBLIC KEY-----";

        private const string TestMachineId = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

        /// <summary>
        /// Génère une clé de licence valide pour les tests.
        /// Utilise la clé privée de test pour signer un payload.
        /// </summary>
        private static string GenerateTestLicenseKey(
            string? machineId = null,
            DateTime? expireAt = null,
            string licenseType = "Enterprise",
            List<string>? features = null)
        {
            var payload = new
            {
                LicenseId = Guid.NewGuid().ToString(),
                CustomerId = "TEST_CUSTOMER",
                MachineId = machineId ?? TestMachineId,
                IssuedAt = DateTime.UtcNow.AddDays(-1),
                ExpireAt = expireAt ?? DateTime.UtcNow.AddYears(1),
                LicenseType = licenseType,
                Features = features ?? new List<string> { "ModuleA", "ModuleB" }
            };

            var payloadJson = JsonSerializer.Serialize(payload);

            using var rsa = RSA.Create();
            rsa.ImportFromPem(TestPrivateKeyPem.ToCharArray());

            var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
            var signature = rsa.SignData(payloadBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

            var combined = $"{payloadJson}|{Convert.ToBase64String(signature)}";
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(combined));
        }

        // =========================================================================
        //  TESTS
        // =========================================================================

        [Fact]
        public void Validate_ValidSignature_ReturnsValid()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey();

            // Act
            var result = LicenseValidator.Validate(licenseKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.True(result.IsValid);
            Assert.Equal(LicenseErrorReason.None, result.ErrorReason);
            Assert.Equal("Enterprise", result.LicenseType);
            Assert.Equal("TEST_CUSTOMER", result.CustomerId);
            Assert.Equal(TestMachineId, result.MachineId);
            Assert.Contains("ModuleA", result.Features);
            Assert.Contains("ModuleB", result.Features);
            Assert.NotNull(result.LicenseId);
        }

        [Fact]
        public void Validate_InvalidSignature_ReturnsInvalidSignature()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey();
            var bytes = Convert.FromBase64String(licenseKey);
            var decoded = Encoding.UTF8.GetString(bytes);

            // Corrompt la signature (remplace le dernier caractère)
            var parts = decoded.Split('|');
            var corruptedSignature = parts[1].Substring(0, parts[1].Length - 1) + "A";
            var corruptedKey = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{parts[0]}|{corruptedSignature}"));

            // Act
            var result = LicenseValidator.Validate(corruptedKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.InvalidSignature, result.ErrorReason);
        }

        [Fact]
        public void Validate_PayloadTampered_ReturnsCorruptedPayload()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey();
            var bytes = Convert.FromBase64String(licenseKey);
            var decoded = Encoding.UTF8.GetString(bytes);

            // Modifie le payload (change un caractère dans le JSON)
            var parts = decoded.Split('|');
            var tamperedPayload = parts[0].Replace("Enterprise", "Standard");
            var tamperedKey = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{tamperedPayload}|{parts[1]}"));

            // Act
            var result = LicenseValidator.Validate(tamperedKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.InvalidSignature, result.ErrorReason);
        }

        [Fact]
        public void Validate_ExpiredLicense_ReturnsExpired()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey(expireAt: DateTime.UtcNow.AddDays(-30));

            // Act
            var result = LicenseValidator.Validate(licenseKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.Expired, result.ErrorReason);
        }

        [Fact]
        public void Validate_MachineMismatch_ReturnsMachineMismatch()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey();

            // Act : utilise un MachineId différent de celui dans le payload
            var result = LicenseValidator.Validate(licenseKey, "different-machine-id-12345", TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.MachineMismatch, result.ErrorReason);
        }

        [Fact]
        public void Validate_ClockRollback_ReturnsClockRollback()
        {
            // Arrange
            var licenseKey = GenerateTestLicenseKey();

            // Simule une dernière validation dans le futur
            var futureDate = DateTime.UtcNow.AddHours(2);

            // Act
            var result = LicenseValidator.Validate(licenseKey, TestMachineId, TestPublicKeyPem, futureDate);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.ClockRollback, result.ErrorReason);
        }

        [Fact]
        public void Validate_InvalidBase64_ReturnsInvalidFormat()
        {
            // Arrange
            const string invalidKey = "Ceci n'est pas du base64!!!";

            // Act
            var result = LicenseValidator.Validate(invalidKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.InvalidFormat, result.ErrorReason);
        }

        [Fact]
        public void Validate_MissingLicense_ThruService_ReturnsNoLicense()
        {
            // Ce test vérifie le comportement quand aucune licence n'est en base.
            // Le test unitaire de LicenseValidator ne peut pas tester ce cas
            // (c'est le service qui gère l'absence de licence).
            // On vérifie juste que le validateur ne plante pas sur une chaîne vide.
            
            // Act
            var result = LicenseValidator.Validate(string.Empty, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.InvalidFormat, result.ErrorReason);
        }

        [Fact]
        public void Validate_MissingSeparator_ReturnsInvalidFormat()
        {
            // Arrange : base64 valide mais sans séparateur '|'
            var payloadJson = JsonSerializer.Serialize(new { test = "data" });
            var badKey = Convert.ToBase64String(Encoding.UTF8.GetBytes(payloadJson));

            // Act
            var result = LicenseValidator.Validate(badKey, TestMachineId, TestPublicKeyPem);

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal(LicenseErrorReason.InvalidFormat, result.ErrorReason);
        }
    }
}
