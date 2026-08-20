using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SoftGcc.Api.Controllers.Evaluations
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	[RequirePermission("VIEW_EVALUATIONS", "MANAGE_EVALUATIONS", "CREATE_EVALUATIONS", "EDIT_EVALUATIONS")]
	public class EvaluationPlanningController : ControllerBase
	{
		private readonly EvaluationPlanningService _evaluationPlanningService;
		private readonly EvaluationService _evaluationService;
		private readonly CompetenceLineService _competenceLineService;

		public EvaluationPlanningController(
			EvaluationPlanningService evaluationPlanningService,
			EvaluationService evaluationService,
			CompetenceLineService competenceLineService)
		{
			_evaluationPlanningService = evaluationPlanningService;
			_evaluationService = evaluationService;
			_competenceLineService = competenceLineService;
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
				// Extraire le vrai userId du token JWT (prioritaire sur le DTO)
				var jwtUserIdClaim = User.FindFirst("userId")?.Value;
				var evaluationIds = new List<int>();

				foreach (var dto in dtos)
				{
					// Utiliser le userId du JWT s'il est disponible, sinon celui du DTO
					var userId = !string.IsNullOrEmpty(jwtUserIdClaim) && int.TryParse(jwtUserIdClaim, out var jwtUserId)
						? jwtUserId
						: dto.UserId;

					var evaluationId = await _evaluationService.CreateEvaluationAsync(
						userId,
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

		[HttpGet("competence-lines")]
		public async Task<IActionResult> GetCompetenceLines([FromQuery] int positionId)
		{
			var competenceLines = await _competenceLineService.GetByPositionIdAsync(positionId);
			var formatted = competenceLines.Select(cl => new
			{
				competenceLineId = cl.CompetenceLineId,
				skillPositionId = cl.SkillPositionId,
				description = cl.Description,
				skillName = cl.SkillPosition?.Skill?.Name ?? "Non défini",
				positionId = cl.SkillPosition?.Position?.PositionId ?? positionId,
				positionName = cl.SkillPosition?.Position?.PositionName ?? "Non défini"
			});
			return Ok(formatted);
		}

		[HttpGet("questions")]
		public async Task<IActionResult> GetPlanningQuestions(
			[FromQuery] int evaluationTypeId,
			[FromQuery] int positionId,
			[FromQuery] int? competenceLineId = null)
		{
			var filter = new EvaluationQuestionFilterDto(evaluationTypeId, positionId, competenceLineId);
			var questions = await _evaluationService.FindQuestionsAsync(filter);
			return Ok(questions
				.Where(q => q.state == 1)
				.Select(q => new
				{
					questionId = q.questionId,
					question = q.question,
					competenceLineId = q.CompetenceLineId,
					positionId = q.positionId,
					evaluationTypeId = q.evaluationTypeId
				}));
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
				// Extraire le vrai userId du token JWT (nécessaire pour les notifications in-app)
				var jwtUserIdClaim = User.FindFirst("userId")?.Value;
				var userId = !string.IsNullOrEmpty(jwtUserIdClaim) && int.TryParse(jwtUserIdClaim, out var jwtUserId)
					? jwtUserId
					: 0;

				var evaluationIds = await _evaluationService.CreateEvaluationWithSelectedQuestionsAsync(dto, userId);
				return Ok(new { evaluationIds, message = "Évaluations créées avec succès avec les questions sélectionnées." });
			}
			catch (Exception ex)
			{
				var message = ex.InnerException?.Message ?? ex.Message;
				if (message.Contains("FOREIGN KEY", StringComparison.OrdinalIgnoreCase)
					&& message.Contains("Competence", StringComparison.OrdinalIgnoreCase))
				{
					message = "Une question sélectionnée n’est pas rattachée à une compétence valide du référentiel. Choisissez des questions liées aux compétences du poste.";
				}
				return StatusCode(500, new { error = message });
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
		
		[HttpGet("planned-evaluations")]
		public async Task<IActionResult> GetPlannedEvaluations(
			int pageNumber = 1,
			int pageSize = 10,
			int? position = null,
			int? department = null,
			string? search = null,
			string? sortBy = null,
			string? sortDirection = null)
		{
			try
			{
				var (evaluations, totalPages) = await _evaluationPlanningService.GetPlannedEvaluationsPaginatedAsync(
					pageNumber,
					pageSize,
					position,
					department,
					search,
					sortBy,
					sortDirection);

				return Ok(new
				{
					Evaluations = evaluations,
					TotalPages = totalPages,
					CurrentPage = pageNumber,
					PageSize = pageSize
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}
	}

}
