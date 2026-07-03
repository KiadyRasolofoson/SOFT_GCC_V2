using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.career_plan;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;

namespace soft_carriere_competence.Controllers.retirement
{
	[Route("api/[controller]")]
	[ApiController]
	public class RetirementController : ControllerBase
	{
		private readonly RetirementService _retirementService;

		public RetirementController(RetirementService service)
		{
			_retirementService = service;
		}


		[HttpGet("parametre")]
		public async Task<IActionResult> GetRetirementParameters()
		{
			var retirementParameters = await _retirementService.GetAll();
			return Ok(retirementParameters);
		}

		[HttpGet("parametre/{id}")]
		public async Task<IActionResult> GetRetirementParameterById(int id)
		{
			var retirementParameterId = await _retirementService.GetById(id);
			if (retirementParameterId == null) return NotFound();
			return Ok(retirementParameterId);
		}

		[HttpPut("parametre/{id}")]
		public async Task<IActionResult> UpdateRetirementParameter(int id, RetirementParameter retirementParameter)
		{
			if (id != retirementParameter.RetirementParameterId) return BadRequest();
			await _retirementService.Update(retirementParameter);
			return NoContent();
		}

		[HttpGet]
		[Route("liste")]
		public async Task<IActionResult> GetRetirementList()
		{
			var list = await _retirementService.GetRetirementList();
			if (list == null) return NotFound();
			return Ok(list);
		}

		
		[HttpGet]
		[Route("filter")]
		public async Task<IActionResult> GetRetirementFilter(
		string? keyWord = null,
		string? civiliteId = null,
		string? departmentId = null,
		string? positionId = null,
		string? age = null,
		string? year = null,
		int page = 1,
		int pageSize = 10)
		{
			try
			{
				// Appel au service pour récupérer les données et le total
				var (data, totalCount) = await _retirementService.GetRetirementFilter(
					keyWord, civiliteId, departmentId, positionId, age, year, page, pageSize);

				// Structure de réponse standard
				var response = new
				{
					Success = data != null && data.Any(),
					Message = data != null && data.Any()
						? "Données récupérées avec succès."
						: "Aucun résultat trouvé avec les critères donnés.",
					Data = data ?? Enumerable.Empty<object>(),
					TotalCount = totalCount,
					TotalPages = data != null && data.Any()
						? (int)Math.Ceiling((double)totalCount / pageSize)
						: 0,
					CurrentPage = page,
					PageSize = pageSize
				};

				return Ok(response);
			}
			catch (ArgumentException ex)
			{
				// Exception de validation des paramètres (message personnalisé)
				return Ok(new
				{
					Success = false,
					Message = ex.Message,
					Data = Enumerable.Empty<object>(),
					TotalCount = 0,
					TotalPages = 0,
					CurrentPage = page,
					PageSize = pageSize
				});
			}
			catch (Exception ex)
			{
				// Exception générique (message standard)
				return Ok(new
				{
					Success = false,
					Message = "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
					Details = ex.Message,
					Data = Enumerable.Empty<object>(),
					TotalCount = 0,
					TotalPages = 0,
					CurrentPage = page,
					PageSize = pageSize
				});
			}
		}
	}
}
