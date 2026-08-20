using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.dashboard
{
    public class VEmployeeAgeDistribution
    {
        [Column("Age_distribution")]
        public string? AgeDistribution { get; set; }

        [Column("Employees_number")]
        public int? EmployeesNumber { get; set; }
    }
}
