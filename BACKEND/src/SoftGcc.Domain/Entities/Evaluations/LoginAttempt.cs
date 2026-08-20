using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("LoginAttempts")]
    public class LoginAttempt
    {
        [Key]
        public int AttemptId { get; set; }

        [Required]
        [StringLength(255)]
        public string TempLogin { get; set; } = string.Empty;

        public DateTime AttemptDate { get; set; } = DateTime.UtcNow;

        [StringLength(45)]
        public string IPAddress { get; set; } = string.Empty;

        public bool IsSuccess { get; set; } = false;
    }
}