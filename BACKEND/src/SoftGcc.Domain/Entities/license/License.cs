using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.license
{
    /// <summary>
    /// Représente une licence activée stockée en base de données.
    /// Seules les informations essentielles sont persistées après validation.
    /// </summary>
    [Table("license")]
    public class License
    {
        /// <summary>
        /// Identifiant unique de la licence (GUID généré lors de la création côté éditeur).
        /// </summary>
        [Key]
        [Column("license_id")]
        public Guid LicenseId { get; set; }

        /// <summary>
        /// Clé de licence complète (format base64: payload|signature).
        /// Permet de revalider la signature à tout moment.
        /// </summary>
        [Column("license_key")]
        [Required]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Identifiant machine au moment de l'activation.
        /// </summary>
        [Column("machine_id")]
        [Required]
        [MaxLength(512)]
        public string MachineId { get; set; } = string.Empty;

        /// <summary>
        /// Identifiant client associé à la licence.
        /// </summary>
        [Column("customer_id")]
        [Required]
        [MaxLength(256)]
        public string CustomerId { get; set; } = string.Empty;

        /// <summary>
        /// Date d'expiration de la licence.
        /// </summary>
        [Column("expire_at")]
        public DateTime ExpireAt { get; set; }

        /// <summary>
        /// Date d'émission de la licence (côté éditeur).
        /// </summary>
        [Column("issued_at")]
        public DateTime IssuedAt { get; set; }

        /// <summary>
        /// Type de licence : Trial, Standard ou Enterprise.
        /// </summary>
        [Column("license_type")]
        [Required]
        [MaxLength(50)]
        public string LicenseType { get; set; } = string.Empty;

        /// <summary>
        /// Liste des fonctionnalités activées, sérialisée en JSON.
        /// </summary>
        [Column("features")]
        [Required]
        public string Features { get; set; } = "[]";

        /// <summary>
        /// Date de la dernière validation réussie.
        /// Utilisée pour la détection de clock rollback.
        /// </summary>
        [Column("last_validated_at")]
        public DateTime? LastValidatedAt { get; set; }

        /// <summary>
        /// Indique si un rollback d'horloge a été détecté.
        /// </summary>
        [Column("is_clock_rollback_detected")]
        public bool IsClockRollbackDetected { get; set; }
    }
}
