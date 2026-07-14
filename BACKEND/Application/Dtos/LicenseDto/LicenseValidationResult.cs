namespace soft_carriere_competence.Application.Dtos.LicenseDto
{
    /// <summary>
    /// Raison d'erreur de validation de licence.
    /// Permet de distinguer les différents cas d'échec côté UI.
    /// </summary>
    public enum LicenseErrorReason
    {
        /// <summary>Aucune erreur, licence valide.</summary>
        None = 0,

        /// <summary>Aucune licence trouvée en base de données.</summary>
        NoLicense = 1,

        /// <summary>Format de la clé invalide (base64 corrompu ou séparateur manquant).</summary>
        InvalidFormat = 2,

        /// <summary>La signature RSA ne correspond pas au payload.</summary>
        InvalidSignature = 3,

        /// <summary>La licence a expiré.</summary>
        Expired = 4,

        /// <summary>L'identifiant machine ne correspond pas à la machine actuelle.</summary>
        MachineMismatch = 5,

        /// <summary>Le payload JSON est corrompu ou illisible.</summary>
        CorruptedPayload = 6,

        /// <summary>Rollback d'horloge détecté (l'heure système est antérieure à la dernière validation).</summary>
        ClockRollback = 7
    }

    /// <summary>
    /// Résultat riche de validation de licence.
    /// Utilisé à la place d'exceptions pour permettre une gestion fine des erreurs côté UI.
    /// </summary>
    public class LicenseValidationResult
    {
        /// <summary>Indique si la licence est valide.</summary>
        public bool IsValid { get; set; }

        /// <summary>Date d'expiration de la licence (si disponible).</summary>
        public DateTime? ExpireAt { get; set; }

        /// <summary>Type de licence (Trial, Standard, Enterprise).</summary>
        public string? LicenseType { get; set; }

        /// <summary>Liste des fonctionnalités activées.</summary>
        public List<string> Features { get; set; } = new();

        /// <summary>Identifiant client associé à la licence.</summary>
        public string? CustomerId { get; set; }

        /// <summary>Identifiant machine lié à la licence.</summary>
        public string? MachineId { get; set; }

        /// <summary>Identifiant unique de la licence.</summary>
        public Guid? LicenseId { get; set; }

        /// <summary>Raison d'erreur si la licence est invalide.</summary>
        public LicenseErrorReason ErrorReason { get; set; } = LicenseErrorReason.None;

        /// <summary>Message d'erreur lisible (en français).</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Crée un résultat valide.
        /// </summary>
        public static LicenseValidationResult Valid(
            Guid licenseId,
            DateTime expireAt,
            string licenseType,
            List<string> features,
            string customerId,
            string machineId)
        {
            return new LicenseValidationResult
            {
                IsValid = true,
                LicenseId = licenseId,
                ExpireAt = expireAt,
                LicenseType = licenseType,
                Features = features,
                CustomerId = customerId,
                MachineId = machineId,
                ErrorReason = LicenseErrorReason.None
            };
        }

        /// <summary>
        /// Crée un résultat invalide avec une raison d'erreur.
        /// </summary>
        public static LicenseValidationResult Invalid(LicenseErrorReason reason, string? message = null)
        {
            return new LicenseValidationResult
            {
                IsValid = false,
                ErrorReason = reason,
                ErrorMessage = message ?? reason switch
                {
                    LicenseErrorReason.NoLicense => "Aucune licence activée.",
                    LicenseErrorReason.InvalidFormat => "Format de clé de licence invalide.",
                    LicenseErrorReason.InvalidSignature => "Signature de licence invalide.",
                    LicenseErrorReason.Expired => "La licence a expiré.",
                    LicenseErrorReason.MachineMismatch => "La licence n'est pas valide pour cette machine.",
                    LicenseErrorReason.CorruptedPayload => "Les données de licence sont corrompues.",
                    LicenseErrorReason.ClockRollback => "Rollback d'horloge détecté. Vérifiez la date système.",
                    _ => "Erreur inconnue."
                }
            };
        }
    }
}
