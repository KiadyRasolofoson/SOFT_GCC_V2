using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("LoginAttempts")]
    public class LoginAttempt
    {
        [Key]
        public int AttemptId { get; set; }

        [Required]
        [StringLength(255)]
        public string TempLogin { get; set; }

        public DateTime AttemptDate { get; set; } = DateTime.UtcNow;

        [StringLength(45)]
        public string IPAddress { get; set; }

        public bool IsSuccess { get; set; } = false;
    }
}