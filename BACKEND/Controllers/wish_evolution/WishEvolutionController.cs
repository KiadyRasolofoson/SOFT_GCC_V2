using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.career_plan;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Application.Services.wish_evolution;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.wish_evolution;

namespace soft_carriere_competence.Controllers.wish_evolution
{
	[Route("api/[controller]")]
	[ApiController]
	public class WishEvolutionController : ControllerBase
	{
		private readonly WishEvolutionService _wishEvolutionService;

		public WishEvolutionController(WishEvolutionService service)
		{
			_wishEvolutionService = service;
		}


		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var wishEvolution = await _wishEvolutionService.GetWishEvolutionById(id);
			if (wishEvolution == null) return NotFound();
			return Ok(wishEvolution);
		}

		[HttpPost]
		public async Task<IActionResult> Create(WishEvolutionCareer wishEvolution)
		{
			await _wishEvolutionService.Add(wishEvolution);
			return CreatedAtAction(nameof(Get), new { id = wishEvolution.WishEvolutionCareerId }, wishEvolution);
		}

		[HttpGet]
		[Route("suggestionPosition/{idEmployee}")]
		public async Task<IActionResult> GetSuggestionPosition(int idEmployee)
		{
			var list = await _wishEvolutionService.GetSuggestionPosition(idEmployee);
			if (list == null) return NotFound();
			return Ok(list);
		}

		[HttpGet]
		[Route("liste")]
		public async Task<IActionResult> GetAllWishEvolution(int pageNumber = 1, int pageSize = 2)
		{
			var wishesEvolution = await _wishEvolutionService.GetAllWishEvolution(pageNumber, pageSize);
			if (wishesEvolution == null) return NotFound();
			return Ok(wishesEvolution);
		}

		[HttpGet]
		[Route("graphe/{year}")]
		public async Task<IActionResult> GetStatWishEvolutionByMonthInYear(int year = 2024)
		{
			var statWishesEvolution = await _wishEvolutionService.GetStatWishEvolutionByMonthInYear(year);
			if (statWishesEvolution == null) return NotFound();
			return Ok(statWishesEvolution);
		}

		[HttpGet]
		[Route("filter")]
		public async Task<IActionResult> GetWishEvolutionFilter(
		string? keyWord = null,
		string? dateRequestMin = null,
		string? dateRequestMax = null,
		string? wishTypeId = null,
		string? positionId = null,
		string? priority = null,
		string? state = null,
		int page = 1,
		int pageSize = 10)
		{
			try
			{
				// Appel au service pour récupérer les données et le total
				var (data, totalRecords) = await _wishEvolutionService.GetWishEvolutionFilter(
					keyWord, dateRequestMin, dateRequestMax, wishTypeId, positionId, priority, state, page, pageSize);

				// Structure de réponse standard
				var response = new
				{
					Success = data != null && data.Any(),
					Message = data != null && data.Any()
						? "Données récupérées avec succès."
						: "Aucun résultat trouvé avec les critères donnés.",
					Data = data ?? Enumerable.Empty<object>(),
					TotalCount = totalRecords,
					TotalPages = data != null && data.Any()
						? (int)Math.Ceiling((double)totalRecords / pageSize)
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

		[HttpGet]
		[Route("skillPosition/{idPosition}")]
		public async Task<IActionResult> GetSkillPosition(int idPosition)
		{
			var skillPosition = await _wishEvolutionService.GetSkillPosition(idPosition);
			if (skillPosition == null) return NotFound();
			return Ok(skillPosition);
		}

		[HttpPut]
		[Route("updateState")]
		public async Task<IActionResult> UpdateState(int state, int wishEvolutionId)
		{
			bool isUpdated = await _wishEvolutionService.UpdateState(state, wishEvolutionId);

			if (isUpdated)
			{
				return Ok("Mise a jour de l'etat reussi.");
			}
			else
			{
				return BadRequest("Échec du mise a jour de l'etat.");
			}
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, WishEvolutionCareer wishEvolution)
		{
			if (id != wishEvolution.WishEvolutionCareerId) return BadRequest();
			await _wishEvolutionService.Update(wishEvolution);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _wishEvolutionService.Delete(id);
			return NoContent();
		}
	}
}
