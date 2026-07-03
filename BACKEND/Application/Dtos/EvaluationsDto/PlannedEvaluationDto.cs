using System;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class PlannedEvaluationDto
    {
        public int EvaluationId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeFirstName { get; set; }
        public string EmployeeLastName { get; set; }
        public int PositionId { get; set; }
        public string PositionName { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public int EvaluationTypeId { get; set; }
        public string EvaluationTypeName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int State { get; set; }
    }
} 