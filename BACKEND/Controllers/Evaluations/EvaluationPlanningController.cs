using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace soft_carriere_competence.Controllers.Evaluations
{
	[ApiController]
	[Route("api/[controller]")]
	public class EvaluationPlanningController : ControllerBase
	{
		private readonly EvaluationPlanningService _evaluationPlanningService;
		private readonly EvaluationService _evaluationService;


		public EvaluationPlanningController(EvaluationPlanningService evaluationPlanningService, EvaluationService evaluationService)
		{
			_evaluationPlanningService = evaluationPlanningService;
			_evaluationService = evaluationService;
		}

		[HttpGet("employees-without-evaluations")]
		public async Task<IActionResult> GetEmployeesWithoutEvaluations(
	[FromQuery] int? position,
	[FromQuery] int? department,
	[FromQuery] string? search)
		{
			var employees = await _evaluationPlanningService.GetEmployeesWithoutEvaluationsAsync(position, department, search);
			return Ok(employees);
		}


		[HttpGet("positions")]
		public async Task<IActionResult> GetAllPostes()
		{
			var positions = await _evaluationPlanningService.GetAllPostesAsync();
			foreach (var pos in positions)
			{
				Console.WriteLine("les postes: " + pos.PositionName);
			}
			return Ok(positions);
		}

		[HttpGet("departments")]
		public async Task<IActionResult> GetAllDepartments()
		{
			var departments = await _evaluationPlanningService.GetAllDepartmentsAsync();
			return Ok(departments);
		}


		[HttpPost("create-evaluation")]
		public async Task<IActionResult> CreateEvaluation([FromBody] List<CreateEvaluationDto> dtos)
		{
			try
			{
				var evaluationIds = new List<int>();

				foreach (var dto in dtos)
				{
					// Comme User et Employee sont des entités séparées:
					// UserId représente l'utilisateur qui crée l'évaluation (peut être 0 ou non fourni par le frontend)
					// EmployeeId représente l'employé qui est évalué
					var evaluationId = await _evaluationService.CreateEvaluationAsync(
						dto.UserId,
						dto.EmployeeId,
						dto.EvaluationTypeId,
						dto.SupervisorIds,
						dto.StartDate,
						dto.EndDate,
						dto.EnableReminders
					);
					evaluationIds.Add(evaluationId);
				}

				return Ok(new { evaluationIds, message = "Evaluations created successfully." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}



		[HttpGet("evaluation-types")]
		public async Task<IActionResult> GetEvaluationTypes()
		{
			var evaluationTypes = await _evaluationService.GetEvaluationTypeAsync();
			if (evaluationTypes == null || !evaluationTypes.Any())
				return NotFound("No evaluation types found.");

			return Ok(evaluationTypes);
		}

		[HttpGet("rappel-evaluation")]
		public async Task<IActionResult> rappelerEvaluation([FromQuery] int idEvaluation)
		{

			int state_result = await _evaluationService.rappelerEvaluation(idEvaluation);
			if (state_result == 0)
			{
				return StatusCode(500, new { error = "Erreur lors du rappel de l'evaluation" });
			}

			return Ok(new { idEvaluation, message = "Rappel avec succes.Un mail a été envoyé" });
		}

		[HttpGet("employees-without-evaluations-paginated")]
		public async Task<IActionResult> GetEmployeesWithoutEvaluationsPaginated(
	int pageNumber = 1,
	int pageSize = 10,
	int? position = null,
	int? department = null,
	string? search = null,
	string? sortBy = null,
	string? sortDirection = null)
		{
			var (employees, totalPages) = await _evaluationPlanningService.GetEmployeesWithoutEvaluationsPaginatedAsync(
				pageNumber,
				pageSize,
				position,
				department,
				search,
				sortBy,
				sortDirection);

			return Ok(new
			{
				Employees = employees,
				TotalPages = totalPages,
				CurrentPage = pageNumber,
				PageSize = pageSize
			});
		}

		[HttpPost("send-automatic-reminders")]
		public async Task<IActionResult> SendAutomaticReminders()
		{
			try
			{
				await _evaluationService.SendAutomaticRemindersAsync();
				return Ok(new { message = "Rappels automatiques envoyés avec succès." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("create-evaluation-with-questions")]
		public async Task<IActionResult> CreateEvaluationWithQuestions([FromBody] CreateEvaluationWithQuestionsDto dto)
		{
			try
			{
				var evaluationIds = await _evaluationService.CreateEvaluationWithSelectedQuestionsAsync(dto);
				return Ok(new { evaluationIds, message = "Évaluations créées avec succès avec les questions sélectionnées." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("configure-reminders")]
		public async Task<IActionResult> ConfigureReminders([FromBody] ConfigureRemindersDto dto)
		{
			try
			{
				if (dto.EvaluationIds == null || !dto.EvaluationIds.Any())
				{
					return BadRequest("Aucune évaluation spécifiée");
				}

				// Mettre à jour le statut EnableReminders pour chaque évaluation
				foreach (var evaluationId in dto.EvaluationIds)
				{
					var evaluation = await _evaluationService.GetEvaluationByIdAsync(evaluationId);
					if (evaluation != null)
					{
						evaluation.EnableReminders = dto.IsEnabled;
						await _evaluationService.UpdateEvaluationAsync(evaluation);
					}
				}

				return Ok(new { message = "Configuration des rappels mise à jour avec succès." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("calculate-recommended-duration")]
		public async Task<IActionResult> CalculateRecommendedDuration([FromBody] CalculateDurationRequestDto request)
		{
			try
			{
				// Valider la requête
				if (request == null)
				{
					return BadRequest("Les données de la requête sont requises.");
				}

				if (request.EmployeeCount <= 0)
				{
					return BadRequest("Le nombre d'employés doit être supérieur à zéro.");
				}

				// Obtenir le service de calcul de durée via l'injection de dépendances
				var evaluationDurationService = HttpContext.RequestServices.GetService(typeof(EvaluationDurationService)) as EvaluationDurationService;
				
				if (evaluationDurationService == null)
				{
					return StatusCode(500, "Service de calcul de durée non disponible");
				}

				var recommendation = await evaluationDurationService.CalculateRecommendedDurationAsync(request);
				return Ok(recommendation);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// Endpoint pour annuler une évaluation planifiée
		[HttpPut("cancel-evaluation/{evaluationId}")]
		public async Task<IActionResult> CancelEvaluation(int evaluationId)
		{
			try
			{
				var evaluation = await _evaluationService.GetEvaluationByIdAsync(evaluationId);
				
				if (evaluation == null)
				{
					return NotFound($"Évaluation avec ID {evaluationId} non trouvée.");
				}

				// Vérifier si l'évaluation est dans un état qui permet l'annulation
				if (evaluation.state != 10) // État planifié
				{
					return BadRequest("Seules les évaluations planifiées peuvent être annulées.");
				}

				// Mettre à jour l'état à 40 (annulé)
				evaluation.state = 40;
				await _evaluationService.UpdateEvaluationAsync(evaluation);
				
				return Ok(new { message = "Évaluation annulée avec succès." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}
		
		// Endpoint pour récupérer les évaluations planifiées
		//[HttpGet("planned-evaluations")]
		//public async Task<IActionResult> GetPlannedEvaluations(
		//	int pageNumber = 1,
		//	int pageSize = 10,
		//	int? position = null,
		//	int? department = null,
		//	string? search = null,
		//	string? sortBy = null,
		//	string? sortDirection = null)
		//{
		//	try
		//	{
		//		var (evaluations, totalPages) = await _evaluationPlanningService.GetPlannedEvaluationsPaginatedAsync(
		//			pageNumber,
		//			pageSize,
		//			position,
		//			department,
		//			search,
		//			sortBy,
		//			sortDirection);

		//		return Ok(new
		//		{
		//			Evaluations = evaluations,
		//			TotalPages = totalPages,
		//			CurrentPage = pageNumber,
		//			PageSize = pageSize
		//		});
		//	}
		//	catch (Exception ex)
		//	{
		//		return StatusCode(500, new { error = ex.Message });
		//	}
		//}
	}

}
