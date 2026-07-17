namespace soft_carriere_competence.Core.Entities.entrepriseOrg
{
	public class EmployeeNode
	{
		public string Name { get; set; } = string.Empty;
		public string FirstName { get; set; } = string.Empty;
		public string Department { get; set; } = string.Empty;
		public string Civilite { get; set; } = string.Empty;
		public string Position { get; set; } = string.Empty;
		public List<EmployeeNode> Children { get; set; } = new();
	}
}
