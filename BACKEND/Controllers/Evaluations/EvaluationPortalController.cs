using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace soft_carriere_competence.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class EvaluationPortalController : ControllerBase
	{
		private readonly EvaluationPortalService _evaluationPortal;

		public EvaluationPortalController(EvaluationPortalService evaluationPortal)
		{
			_evaluationPortal = evaluationPortal;
		}

		/// <summary>
		/// Récupère toutes les évaluations en cours
		/// </summary>
		[HttpGet("ongoing")]
		public async Task<ActionResult<IEnumerable<VEmployeesOngoingEvaluation>>> GetOngoingEvaluations()
		{
			var evaluations = await _evaluationPortal.GetOngoingEvaluationsAsync();
			return Ok(evaluations);
		}

		/// <summary>
		/// Récupère la progression d'une évaluation d'un employé
		/// </summary>
		[HttpGet("progress/{evaluationId}/{employeeId}")]
		public async Task<ActionResult<EvaluationProgress>> GetEvaluationProgress(int evaluationId, int employeeId)
		{
			var progress = await _evaluationPortal.GetEvaluationProgressAsync(evaluationId, employeeId);
			if (progress == null) return NotFound();
			return Ok(progress);
		}

		/// <summary>
		/// Met à jour la progression d'une évaluation
		/// </summary>
		[HttpPut("progress/update")]
		public async Task<IActionResult> UpdateEvaluationProgress([FromBody] UpdateProgressRequestDto request)
		{
			bool updated = await _evaluationPortal.UpdateEvaluationProgressAsync(request.EvaluationId, request.EmployeeId, request.AnsweredQuestions);
			if (!updated) return BadRequest("Impossible de mettre à jour la progression.");
			return Ok("Progression mise à jour avec succès.");
		}

		/// <summary>
		/// Récupère la progression de tous les employés
		/// </summary>
		[HttpGet("employees-progress")]
		public async Task<ActionResult<IEnumerable<VEmployeeEvaluationProgress>>> GetEmployeesEvaluationProgress()
		{
			var progressList = await _evaluationPortal.GetEmployeesEvaluationProgressAsync();
			return Ok(progressList);
		}

		/// <summary>
		/// Finalise une évaluation
		/// </summary>
		[HttpPost("finalize/{evaluationId}/{employeeId}")]
		public async Task<IActionResult> FinalizeEvaluation(int evaluationId, int employeeId)
		{
			bool finalized = await _evaluationPortal.FinalizeEvaluationAsync(evaluationId, employeeId);
			if (!finalized) return BadRequest("L'évaluation ne peut pas être finalisée.");
			return Ok("Évaluation finalisée avec succès.");
		}
	}
}
