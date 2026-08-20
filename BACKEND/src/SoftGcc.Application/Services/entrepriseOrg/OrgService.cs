using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.entrepriseOrg
{
	public class OrgService : IOrgService
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
					EmployeeId = e.EmployeeId,
					DepartmentId = e.DepartmentId,
					Name = e.Name ?? string.Empty,
					FirstName = e.FirstName ?? string.Empty,
					Department = e.DepartmentName ?? "Non assigné",
					Civilite = e.CiviliteName ?? string.Empty,
					Position = e.PositionName ?? "Poste non défini",
					HasPhoto = e.Photo != null && e.Photo.Length > 0,
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
