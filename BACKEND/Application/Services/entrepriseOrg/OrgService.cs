using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.entrepriseOrg;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.entrepriseOrg
{
	public class OrgService
	{
		private readonly IOrgDataService _dataService;

		public OrgService(IOrgDataService dataService)
		{
			_dataService = dataService;
		}

		// Nombre d'employes par departement 
		public async Task<List<VDepartmentEffective>> GetNEmployeeByDepartment()
		{
			return await _dataService.GetNEmployeeByDepartment();
		}

		// Avoir l'organigramme
		public async Task<List<EmployeeNode>> GetOrgChart()
		{
			return await _dataService.GetOrgChart();
		}

		// Creer l'organigramme
		private List<EmployeeNode> BuildOrgChart(List<VEmployeePosition> employees, int? managerId)
		{
			return employees
				.Where(e => e.ManagerId == managerId)
				.Select(e => new EmployeeNode
				{
					Name = e.Name ?? "",
					FirstName = e.FirstName ?? "",
					Department = e.DepartmentName ?? "",
					Civilite = e.CiviliteName ?? "",
					Position = e.PositionName ?? "",
					Children = BuildOrgChart(employees, e.EmployeeId)
				})
				.ToList();
		}

		// Liste d'employe par departement
		public async Task<List<VEmployeePosition>> GetEmployeeByDepartment(int idDepartment)
		{
			return await _dataService.GetEmployeeByDepartment(idDepartment);
		}

		// Enregistrement des donnees importes via csv dans la base de donnee
		public async Task<List<string>> SaveEmployeeImported(List<Employee> csvData)
		{
			return await _dataService.SaveEmployeeImported(csvData);
		}
	}
}
