using System;

namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class PlannedEvaluationDto
    {
        public int EvaluationId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeFirstName { get; set; } = string.Empty;
        public string EmployeeLastName { get; set; } = string.Empty;
        public int PositionId { get; set; }
        public string PositionName { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int EvaluationTypeId { get; set; }
        public string EvaluationTypeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int State { get; set; }
    }
} 