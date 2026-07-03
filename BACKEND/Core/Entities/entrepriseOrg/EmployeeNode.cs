namespace soft_carriere_competence.Core.Entities.entrepriseOrg
{
	public class EmployeeNode
	{
		public string Name { get; set; }
		public string FirstName { get; set; }
		public string Department { get; set; }
		public string Civilite { get; set; }
		public string Position { get; set; }
		public List<EmployeeNode> Children { get; set; } = new();
	}
}
