using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Services.entrepriseOrg;
using soft_carriere_competence.Application.Services.wish_evolution;
using soft_carriere_competence.Core.Entities.entrepriseOrg;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;

namespace soft_carriere_competence.Controllers.entrepriseOrg
{
	[Route("api/[controller]")]
	[ApiController]
	public class OrgController : ControllerBase
	{
		private readonly OrgService _orgService;

		public OrgController(OrgService service)
		{
			_orgService = service;
		}

		[HttpGet]
		[Route("effectifDepartement")]
		public async Task<IActionResult> GetEffectiveByDepartment()
		{
			var list = await _orgService.GetNEmployeeByDepartment();
			if (list == null) return NotFound();
			return Ok(list);
		}

		[HttpGet]
		[Route("organigramme")]
		public async Task<IActionResult> GetOrgChart()
		{
			var list = await _orgService.GetOrgChart();
			if (list == null) return NotFound();
			return Ok(list);
		}

		[HttpGet]
		[Route("detailDepartement/{idDepartment}")]
		public async Task<IActionResult> GetDetailDepartment(int idDepartment)
		{
			var listEmployees = await _orgService.GetEmployeeByDepartment(idDepartment);
			if (listEmployees == null) return NotFound();
			return Ok(listEmployees);
		}

		private readonly string _connectionString = "VotreChaineDeConnexionSQLServer";

		[HttpPost]
		[Route("employee/import")]
		public async Task<IActionResult> UploadEmployeeCsv([FromBody] List<Employee> csvData)
		{
			if (csvData == null || csvData.Count == 0)
			{
				return BadRequest("Le fichier CSV est vide ou invalide.");
			}

			var errorReport = new List<string>();

				try
				{
					errorReport = await _orgService.SaveEmployeeImported(csvData);
				}
				catch (Exception ex)
				{
					Console.WriteLine("Tafiditra am erreur");
					errorReport.Add($"Erreur lors de l'importation de l'employé {ex.Message}");
				}

			Console.WriteLine("Yeas");
			Console.WriteLine(errorReport.Count);

			if (errorReport.Count > 0)
			{
				return Ok(new
				{
					success = false,
					message = "Certaines données n'ont pas été importées.",
					errors = errorReport
				});
			}

			return Ok(new
			{
				success = true,
				message = "Toutes les données ont été importées avec succès !"
			});
		}
	}
}
