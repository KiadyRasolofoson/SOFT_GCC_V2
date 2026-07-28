using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    /// <summary>
    /// Délégation temporaire d'un évaluateur à un autre (congé, maladie, etc.).
    /// Le délégué hérite des droits du délégant sur les évaluations en cours pendant la période.
    /// </summary>
    [Table("EvaluationDelegations")]
    public class EvaluationDelegation
    {
        [Key]
        [Column("delegation_id")]
        public int DelegationId { get; set; }

        /// <summary>Utilisateur qui délègue ses évaluations (le titulaire).</summary>
        [Column("delegator_user_id")]
        public int DelegatorUserId { get; set; }

        /// <summary>Utilisateur qui reçoit la délégation (le remplaçant).</summary>
        [Column("delegate_user_id")]
        public int DelegateUserId { get; set; }

        [Column("start_date", TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Column("end_date", TypeName = "date")]
        public DateTime EndDate { get; set; }

        /// <summary>Motif de la délégation (congé, maladie, mission, etc.).</summary>
        [Column("reason")]
        [MaxLength(255)]
        public string Reason { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>False si la délégation a été révoquée manuellement.</summary>
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        /// <summary>Optionnel : restreindre la délégation à une évaluation spécifique.
        /// Null signifie toutes les évaluations du délégant.</summary>
        [Column("evaluation_id")]
        public int? EvaluationId { get; set; }

        [ForeignKey("DelegatorUserId")]
        public User? Delegator { get; set; }

        [ForeignKey("DelegateUserId")]
        public User? Delegate { get; set; }

        [ForeignKey("EvaluationId")]
        public Evaluation? Evaluation { get; set; }
    }
}
