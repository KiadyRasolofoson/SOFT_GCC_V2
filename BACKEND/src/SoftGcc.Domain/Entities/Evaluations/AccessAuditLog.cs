using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    /// <summary>
    /// Journal des accès en lecture/écriture aux données sensibles du module évaluation.
    /// Conformité RGPD : traçabilité des consultations (pas seulement des modifications).
    /// </summary>
    [Table("AccessAuditLogs")]
    public class AccessAuditLog
    {
        [Key]
        [Column("audit_id")]
        public long AuditId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        /// <summary>Type de ressource consultée : Evaluation, Interview, Questionnaire, etc.</summary>
        [Column("resource_type")]
        [MaxLength(50)]
        public string ResourceType { get; set; } = string.Empty;

        /// <summary>Identifiant de la ressource concernée.</summary>
        [Column("resource_id")]
        public int ResourceId { get; set; }

        /// <summary>Read, Write, Export, Delete.</summary>
        [Column("access_type")]
        [MaxLength(20)]
        public string AccessType { get; set; } = string.Empty;

        [Column("accessed_at")]
        public DateTime AccessedAt { get; set; } = DateTime.UtcNow;

        [Column("ip_address")]
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [Column("user_agent")]
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>L'accès a-t-il été autorisé (true) ou refusé (false) ?</summary>
        [Column("success")]
        public bool Success { get; set; } = true;

        /// <summary>Détails supplémentaires (ex: filtre appliqué, raison du refus).</summary>
        [Column("details")]
        [MaxLength(1000)]
        public string? Details { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
