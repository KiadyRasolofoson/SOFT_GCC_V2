using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Application.Services.salary_skills;

namespace soft_carriere_competence.Controllers.Evaluations
{
	[ApiController]
	[Route("api/[controller]")]
	public class EvaluationInterviewController : ControllerBase
	{
		private readonly EvaluationService _evaluationService;
		private readonly EvaluationInterviewService _evaluationInterviewService;
		private readonly ILogger<EvaluationInterviewController> _logger;


		public EvaluationInterviewController(
		EvaluationService evaluationService,
		EvaluationInterviewService evaluationInterviewService,
		ILogger<EvaluationInterviewController> logger)
		{
			_evaluationService = evaluationService;
			_evaluationInterviewService = evaluationInterviewService;
			_logger = logger;
		}

		[HttpGet("employees-finished-evaluations")]
		public async Task<IActionResult> GetEmployeesFinishedEvaluations(
	[FromQuery] int? position,
	[FromQuery] int? department,
	[FromQuery] string? search)
		{
			var employees = await _evaluationInterviewService.GetEmployeesWithFinishedEvalAsync(position, department, search);
			return Ok(employees);
		}

		[HttpGet("employees-finished-evaluations-paginated")]
		public async Task<IActionResult> GetEmployeesWithFinishedEvalPaginated(
	int pageNumber = 1,
	int pageSize = 10,
	int? position = null,
	int? department = null,
	string? search = null,
	string? sortBy = null,
	string? sortDirection = null)
		{
			var (employees, totalPages) = await _evaluationInterviewService.GetEmployeesWithFinishedEvalPaginatedAsync(
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


		[HttpGet("positions")]
		public async Task<IActionResult> GetAllPostes()
		{
			var positions = await _evaluationInterviewService.GetAllPostesAsync();
			foreach (var pos in positions)
			{
				Console.WriteLine("les postes: " + pos.PositionName);
			}
			return Ok(positions);
		}

		[HttpGet("departments")]
		public async Task<IActionResult> GetAllDepartments()
		{
			var departments = await _evaluationInterviewService.GetAllDepartmentsAsync();
			return Ok(departments);
		}

		[HttpGet("evaluation-types")]
		public async Task<IActionResult> GetEvaluationTypes()
		{
			var evaluationTypes = await _evaluationService.GetEvaluationTypeAsync();
			if (evaluationTypes == null || !evaluationTypes.Any())
				return NotFound("No evaluation types found.");

			return Ok(evaluationTypes);
		}


		[HttpPost("schedule-interview")]
		public async Task<IActionResult> ScheduleInterview([FromBody] ScheduleInterviewRequest request)
		{
			if (request == null)
			{
				return BadRequest(new { message = "Requête invalide." });
			}

			if (request.ScheduledDate < DateTime.Now)
			{
				return BadRequest(new { message = "La date planifiée ne peut pas être dans le passé." });
			}

			if (request.Participants == null || !request.Participants.Any())
			{
				return BadRequest(new { message = "La liste des participants est vide ou invalide." });
			}

			_logger.LogInformation($"Planification d'un entretien pour l'évaluation ID: {request.EvaluationId}, employé ID: {request.EmployeeId}");

			var result = await _evaluationInterviewService.ScheduleInterviewAsync(
				request.EvaluationId,
				request.ScheduledDate,
				request.Participants,
				request.EmployeeId,
				request.SendEmails
			);

			if (!result.Success)
			{
				return BadRequest(new { message = result.Message });
			}

			return Ok(new { InterviewId = result.InterviewId });
		}



		[HttpPut("update-interview/{interviewId}")]
		public async Task<IActionResult> UpdateInterview(int interviewId, [FromBody] UpdateInterviewDto dto)
		{
			var result = await _evaluationInterviewService.UpdateInterviewAsync(interviewId, dto.NewDate, dto.NewParticipantIds, dto.NewStatus);

			if (!result)
				return NotFound("Interview not found or invalid update");

			return NoContent();
		}

		[HttpPut("start-interview/{interviewId}")]
		public async Task<IActionResult> StartInterview(int interviewId)
		{
			try
			{
				_logger.LogInformation($"Tentative de démarrer l'entretien avec ID: {interviewId}");
				var result = await _evaluationInterviewService.StartInterviewAsync(interviewId);

				if (!result)
				{
					_logger.LogWarning($"Impossible de démarrer l'entretien avec ID: {interviewId}");
					return BadRequest(new { message = "Impossible de démarrer l'entretien. Vérifiez que l'ID est correct." });
				}

				_logger.LogInformation($"Entretien avec ID: {interviewId} démarré avec succès");
				return Ok(new { message = "Entretien démarré avec succès", status = "InProgress" });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, $"Erreur lors du démarrage de l'entretien avec ID: {interviewId}");
				return StatusCode(500, new { message = $"Une erreur est survenue: {ex.Message}" });
			}
		}

		[HttpPut("complete-interview/{interviewId}")]
		public async Task<IActionResult> CompleteInterview(int interviewId, [FromBody] CompleteInterviewDto dto)
		{
			var result = await _evaluationInterviewService.CompleteInterviewAsync(
				interviewId, 
				dto.ManagerApproval, 
				dto.ManagerComments, 
				dto.DirectorApproval, 
				dto.DirectorComments, 
				dto.Notes,
				dto.Status);

			if (!result)
				return BadRequest("Cannot complete the interview");

			return NoContent();
		}

		[HttpGet("interview-details/{interviewId}")]
		public async Task<IActionResult> GetInterviewDetails(int interviewId)
		{
			var interview = await _evaluationInterviewService.GetInterviewDetailsAsync(interviewId);

			if (interview == null)
				return NotFound("Interview not found");

			return Ok(interview);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> GetEmployee(int id)
		{
			_logger.LogInformation("Fetching employee with ID: {Id}", id);
			var employee = await _evaluationInterviewService.GetEmployeeAsync(id);

			if (employee == null)
			{
				_logger.LogWarning("Employee with ID: {Id} not found", id);
				return NotFound("L'employé n'existe pas.");
			}

			_logger.LogInformation("Employee found: {Employee}", employee);
			return Ok(employee);
		}

		[HttpGet("get-interview-by-participant/{participantId}")]
		public async Task<IActionResult> GetInterviewByParticipant(int participantId)
		{
			try
			{
				// Appel du service pour récupérer l'entretien
				var interview = await _evaluationInterviewService.GetInterviewByParticipantIdAsync(participantId);

				if (interview == null)
				{
					return NotFound(new { message = "Aucun entretien trouvé pour ce participant." });
				}

				return Ok(interview);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = $"Erreur lors de la récupération de l'entretien : {ex.Message}" });
			}
		}

	}
}
