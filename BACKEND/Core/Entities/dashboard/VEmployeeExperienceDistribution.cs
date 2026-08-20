using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.dashboard
{
    public class VEmployeeExperienceDistribution
    {
        [Column("Experience_range")]
        public string? ExperienceRange { get; set; }

        [Column("Employee_count")]
        public int? EmployeeCount { get; set; }
    }
}
