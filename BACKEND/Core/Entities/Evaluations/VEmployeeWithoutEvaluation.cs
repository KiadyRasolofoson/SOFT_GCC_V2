using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("VEmployeesWithoutEvaluation")]
    public class VEmployeeWithoutEvaluation
    {
        public int? EmployeeId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Position { get; set; }
        public int? positionId {  get; set; }
        public string? Department { get; set; }
        public int? DepartmentId {  get; set; }
    }
}
