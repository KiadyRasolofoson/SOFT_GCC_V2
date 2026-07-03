using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("TemporaryAccounts")]
    public class TemporaryAccount
    {
        [Key]
        public int TempAccountId { get; set; }

        public int EmployeeId { get; set; }

        public int Evaluations_id { get; set; }

        [StringLength(255)]
        public string TempLogin { get; set; }

        [StringLength(255)]
        public string TempPassword { get; set; }

        public DateTime ExpirationDate { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations

        [ForeignKey("EmployeeId")]
        public virtual Employee Employee { get; set; }

        [ForeignKey("Evaluations_id")]
        public virtual Evaluation Evaluation { get; set; }
    }
}