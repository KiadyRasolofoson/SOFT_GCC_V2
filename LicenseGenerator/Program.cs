using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace LicenseGenerator
{
    /// <summary>
    /// Représente le payload d'une licence avant signature.
    /// </summary>
    internal class LicensePayload
    {
        public string LicenseId { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; } = string.Empty;
        public string MachineId { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpireAt { get; set; }
        public string LicenseType { get; set; } = "Standard";
        public List<string> Features { get; set; } = new();
    }

    /// <summary>
    /// Génère une clé de licence signée avec une clé privée RSA.
    /// 
    /// Usage :
    ///   dotnet run -- --customer-id "CLIENT001" --machine-id "abc123..." --expire-at "2027-12-31" --license-type Enterprise --features "ModuleA,ModuleB" --private-key-file "./private.key" --output "./license.key"
    /// </summary>
    internal class Program
    {
        static int Main(string[] args)
        {
            try
            {
                var (customerId, machineId, expireAt, licenseType, features, privateKeyFile, outputFile) = ParseArgs(args);

                if (string.IsNullOrWhiteSpace(customerId))
                {
                    Console.Error.WriteLine("Erreur : --customer-id est requis.");
                    return 1;
                }
                if (string.IsNullOrWhiteSpace(machineId))
                {
                    Console.Error.WriteLine("Erreur : --machine-id est requis.");
                    return 1;
                }
                if (string.IsNullOrWhiteSpace(privateKeyFile) || !File.Exists(privateKeyFile))
                {
                    Console.Error.WriteLine($"Erreur : fichier de clé privée introuvable : {privateKeyFile}");
                    return 1;
                }

                // Chargement de la clé privée
                var privateKeyPem = File.ReadAllText(privateKeyFile);

                // Construction du payload
                var payload = new LicensePayload
                {
                    LicenseId = Guid.NewGuid().ToString(),
                    CustomerId = customerId,
                    MachineId = machineId,
                    IssuedAt = DateTime.UtcNow,
                    ExpireAt = expireAt,
                    LicenseType = licenseType,
                    Features = features
                };

                var payloadJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });

                // Signature du payload avec RSA 4096, SHA-256, PKCS1
                using var rsa = RSA.Create();
                rsa.ImportFromPem(privateKeyPem.ToCharArray());

                var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
                var signature = rsa.SignData(payloadBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

                // Construction de la clé finale : base64(payload|signature)
                var combined = $"{payloadJson}|{Convert.ToBase64String(signature)}";
                var licenseKey = Convert.ToBase64String(Encoding.UTF8.GetBytes(combined));

                // Affichage
                Console.WriteLine("=== Licence générée avec succès ===");
                Console.WriteLine();
                Console.WriteLine($"License ID      : {payload.LicenseId}");
                Console.WriteLine($"Customer ID     : {payload.CustomerId}");
                Console.WriteLine($"Machine ID      : {payload.MachineId}");
                Console.WriteLine($"Type            : {payload.LicenseType}");
                Console.WriteLine($"Expire le       : {payload.ExpireAt:yyyy-MM-dd HH:mm:ss} UTC");
                Console.WriteLine($"Émise le        : {payload.IssuedAt:yyyy-MM-dd HH:mm:ss} UTC");
                Console.WriteLine($"Fonctionnalités : {string.Join(", ", payload.Features)}");
                Console.WriteLine();
                Console.WriteLine("=== Clé de licence (base64) ===");
                Console.WriteLine(licenseKey);
                Console.WriteLine();

                // Sauvegarde dans un fichier si demandé
                if (!string.IsNullOrWhiteSpace(outputFile))
                {
                    File.WriteAllText(outputFile, licenseKey);
                    Console.WriteLine($"Clé sauvegardée dans : {outputFile}");
                }

                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Erreur : {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// Analyse les arguments de la ligne de commande.
        /// </summary>
        static (string customerId, string machineId, DateTime expireAt, string licenseType, List<string> features, string privateKeyFile, string outputFile) ParseArgs(string[] args)
        {
            string customerId = string.Empty;
            string machineId = string.Empty;
            var expireAt = DateTime.UtcNow.AddYears(1);
            string licenseType = "Standard";
            var features = new List<string>();
            string privateKeyFile = "./private.key";
            string outputFile = string.Empty;

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i].ToLower())
                {
                    case "--customer-id" when i + 1 < args.Length:
                        customerId = args[++i];
                        break;
                    case "--machine-id" when i + 1 < args.Length:
                        machineId = args[++i];
                        break;
                    case "--expire-at" when i + 1 < args.Length:
                        if (!DateTime.TryParse(args[++i], out expireAt))
                        {
                            Console.Error.WriteLine($"Format de date invalide pour --expire-at : {args[i]}");
                            Environment.Exit(1);
                        }
                        break;
                    case "--license-type" when i + 1 < args.Length:
                        licenseType = args[++i];
                        break;
                    case "--features" when i + 1 < args.Length:
                        features = args[++i].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                        break;
                    case "--private-key-file" when i + 1 < args.Length:
                        privateKeyFile = args[++i];
                        break;
                    case "--output" when i + 1 < args.Length:
                        outputFile = args[++i];
                        break;
                }
            }

            return (customerId, machineId, expireAt, licenseType, features, privateKeyFile, outputFile);
        }
    }
}
