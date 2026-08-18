namespace soft_carriere_competence.Core.Entities.entrepriseOrg
{
	public class EmployeeNode
	{
		public int EmployeeId { get; set; }
		public int? DepartmentId { get; set; }
		public string Name { get; set; } = string.Empty;
		public string FirstName { get; set; } = string.Empty;
		public string Department { get; set; } = string.Empty;
		public string Civilite { get; set; } = string.Empty;
		public string Position { get; set; } = string.Empty;
		public bool HasPhoto { get; set; }
		public List<EmployeeNode> Children { get; set; } = new();
	}
}
