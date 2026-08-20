using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using NuGet.Protocol.Plugins;
using System.Net.Sockets;

namespace soft_carriere_competence.Core.Entities.career_plan
{
    [Table("Work_certificates")]
    public class WorkCertificates
    {
        [Key]
        [Column("Work_certificate_id")]
        public int WorkCertificatesId { get; set; }

        [Column("Employee_name")]
        public string? EmployeeName { get; set; }

        [Column("Position")]
        public string? Position { get; set; }

        [Column("Start_date")]
        public DateTime? StartDate { get; set; }

        [Column("End_date")]
        public DateTime? EndDate { get; set; }

        [Column("Reference")]
        public string? Reference { get; set; }

        [Column("Token")]
        public string? Token { get; set; }

        [Column("Society")]
        public string? Society { get; set; }

        [Column("Created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}
