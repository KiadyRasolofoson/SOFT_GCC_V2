using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using soft_carriere_competence.Application.Dtos.LicenseDto;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using System.Security.Cryptography;
using System.Text;

namespace soft_carriere_competence.Application.Services.license
{
    /// <summary>
    /// Service de gestion des licences.
    /// Enregistré comme Scoped car il dépend de ApplicationDbContext (Transient)
    /// et suit le pattern des autres services du projet.
    /// 
    /// Fournit :
    /// - Activate : valide et active une licence
    /// - GetStatus : revalide la signature à chaque appel (avec cache mémoire de 5 min)
    /// - GetMachineId : calcule un identifiant machine local
    /// </summary>
    public class LicenseService : ILicenseService
    {
        private readonly ApplicationDbContext _context;
        private readonly RsaPublicKeyProvider _rsaProvider;
        private readonly IMemoryCache _cache;

        // Durée du cache mémoire pour GetStatus (évite de re-parser RSA à chaque requête HTTP)
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
        private const string CacheKey = "LicenseStatus";

        public LicenseService(
            ApplicationDbContext context,
            RsaPublicKeyProvider rsaProvider,
            IMemoryCache cache)
        {
            _context = context;
            _rsaProvider = rsaProvider;
            _cache = cache;
        }

        /// <summary>
        /// Active une licence : valide la clé, puis stocke les informations essentielles en base.
        /// </summary>
        /// <param name="dto">DTO contenant la clé de licence.</param>
        /// <returns>Résultat de validation.</returns>
        public async Task<LicenseValidationResult> Activate(LicenseActivateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.LicenseKey))
            {
                return LicenseValidationResult.Invalid(
                    LicenseErrorReason.InvalidFormat,
                    "La clé de licence ne peut pas être vide.");
            }

            var machineId = GetMachineId();

            // Récupère la dernière validation connue (pour clock rollback)
            var existingLicense = await _context.Set<Core.Entities.license.License>()
                .OrderByDescending(l => l.LastValidatedAt)
                .FirstOrDefaultAsync();

            // Valide la signature complète
            var result = LicenseValidator.Validate(
                dto.LicenseKey,
                machineId,
                _rsaProvider.PublicKey,
                existingLicense?.LastValidatedAt);

            if (!result.IsValid)
            {
                return result;
            }

            // Upsert : met à jour ou insère la licence en base
            var license = await _context.Set<Core.Entities.license.License>()
                .FirstOrDefaultAsync();

            if (license == null)
            {
                license = new Core.Entities.license.License();
                _context.Set<Core.Entities.license.License>().Add(license);
            }

            license.LicenseId = result.LicenseId!.Value;
            license.Key = dto.LicenseKey;
            license.MachineId = machineId;
            license.CustomerId = result.CustomerId ?? string.Empty;
            license.ExpireAt = result.ExpireAt!.Value;
            // Note: IssuedAt pourrait être extrait du payload si nécessaire
            license.IssuedAt = DateTime.UtcNow;
            license.LicenseType = result.LicenseType ?? string.Empty;
            license.Features = System.Text.Json.JsonSerializer.Serialize(result.Features);
            license.LastValidatedAt = DateTime.UtcNow;
            license.IsClockRollbackDetected = false;

            await _context.SaveChangesAsync();

            // Invalide le cache pour forcer un rechargement
            _cache.Remove(CacheKey);

            return result;
        }

        /// <summary>
        /// Retourne le statut actuel de la licence.
        /// Revalide la signature à chaque appel (pas de confiance aveugle en la valeur en base).
        /// Utilise un cache mémoire de 5 minutes pour le throttling.
        /// </summary>
        public async Task<LicenseValidationResult> GetStatus()
        {
            // Vérifie le cache mémoire (throttle : éviter de re-parser RSA à chaque requête)
            if (_cache.TryGetValue(CacheKey, out LicenseValidationResult? cachedResult) && cachedResult != null)
            {
                return cachedResult;
            }

            // Récupère la licence depuis la base
            var license = await _context.Set<Core.Entities.license.License>()
                .OrderByDescending(l => l.LastValidatedAt)
                .FirstOrDefaultAsync();

            if (license == null)
            {
                var noLicenseResult = LicenseValidationResult.Invalid(
                    LicenseErrorReason.NoLicense,
                    "Aucune licence activée. Veuillez activer une licence.");
                _cache.Set(CacheKey, noLicenseResult, CacheDuration);
                return noLicenseResult;
            }

            var machineId = GetMachineId();

            // Revalide COMPLÈTEMENT la signature (pas de confiance aveugle en la base)
            var result = LicenseValidator.Validate(
                license.Key,
                machineId,
                _rsaProvider.PublicKey,
                license.LastValidatedAt);

            // Met à jour la date de dernière validation en base
            license.LastValidatedAt = DateTime.UtcNow;

            if (!result.IsValid)
            {
                // En cas d'échec, on marque le statut mais on garde la licence en base
                // (permet de distinguer "pas de licence" de "licence invalide")
                if (result.ErrorReason == LicenseErrorReason.ClockRollback)
                {
                    license.IsClockRollbackDetected = true;
                }
            }

            await _context.SaveChangesAsync();

            // Met en cache pour 5 minutes
            _cache.Set(CacheKey, result, CacheDuration);

            return result;
        }

        /// <summary>
        /// Calcule un identifiant unique pour la machine locale.
        /// Combine plusieurs informations système pour éviter les collisions.
        /// </summary>
        public static string GetMachineId()
        {
            try
            {
                var machineName = Environment.MachineName;
                var userName = Environment.UserName;
                var osVersion = Environment.OSVersion.VersionString;

                // Sous Linux, tente de lire /etc/machine-id (identifiant unique et stable)
                string? machineId = null;
                try
                {
                    if (File.Exists("/etc/machine-id"))
                    {
                        machineId = File.ReadAllText("/etc/machine-id")?.Trim();
                    }
                }
                catch
                {
                    // Ignoré : on continue avec les autres infos
                }

                var raw = $"{machineName}|{userName}|{osVersion}|{machineId ?? "unknown"}";

                // Hash SHA256 pour obtenir un identifiant de longueur fixe
                var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
                var sb = new StringBuilder();
                foreach (var b in bytes)
                {
                    sb.Append(b.ToString("x2"));
                }
                return sb.ToString();
            }
            catch
            {
                // Fallback : utilise le nom de machine uniquement
                return Environment.MachineName;
            }
        }
    }
}
