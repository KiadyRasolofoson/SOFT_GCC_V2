using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Services.entrepriseOrg;
using SoftGcc.Application.Services.wish_evolution;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.entrepriseOrg
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_ORGANIZATION","IMPORT_ORGANIZATION","MANAGE_ORGANIZATION","VIEW_DEPARTMENTS","MANAGE_DEPARTMENTS")]
	public class OrgController : ControllerBase
	{
		private readonly IOrgService _orgService;

		public OrgController(IOrgService service)
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
