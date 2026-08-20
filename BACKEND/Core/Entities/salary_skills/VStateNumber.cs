using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
    public class VStateNumber
    {
        [Column("Employee_id")]
        public int EmployeeId { get; set; }

        [Column("State")]
        public int State { get; set; }

        [Column("Number")]
        public int Number { get; set; }

        [Column("State_letter")]
        public string? StateLetter { get; set; }
    }
}
