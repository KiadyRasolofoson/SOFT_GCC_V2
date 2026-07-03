using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations
{
	[ApiController]
	[Route("api/[controller]")]
	public class EvaluationHistoryController : ControllerBase
	{
		private readonly EvaluationHistoryService _evaluationHistoryService;

		public EvaluationHistoryController(EvaluationHistoryService evaluationHistoryService)
		{
			_evaluationHistoryService = evaluationHistoryService;
		}

		[HttpGet("history")]
		public async Task<IActionResult> GetEvaluationHistory(
		[FromQuery] DateTime? startDate,
		[FromQuery] DateTime? endDate,
		[FromQuery] string? evaluationType,
		[FromQuery] string? department,
		[FromQuery] string? employeeName
		)
		{
			try 
			{
				var result = await _evaluationHistoryService.GetEvaluationHistoryAsync(
					startDate, endDate, evaluationType, department, employeeName);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération de l'historique des évaluations : {ex.Message}");
			}
		}

		[HttpGet("evaluation-history-paginated")]
		public async Task<IActionResult> GetEvaluationHistoryPaginated(
		[FromQuery] DateTime? startDate,
		[FromQuery] DateTime? endDate ,
		[FromQuery] string? evaluationType,
		[FromQuery] string? department ,
		[FromQuery] string? employeeName,
		int pageNumber = 1,
		int pageSize = 10)
		{
			try 
			{
				var (evaluations, totalPages) = await _evaluationHistoryService.GetEvaluationHistoryPaginatedAsync(
					pageNumber,
					pageSize,
					startDate,
					endDate,
					evaluationType,
					department,
					employeeName);

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
				return StatusCode(500, $"Erreur lors de la récupération de l'historique paginé : {ex.Message}");
			}
		}

		[HttpGet("detail/{evaluationId}")]
		public async Task<IActionResult> GetEvaluationDetail(int evaluationId)
		{
			try 
			{
				var result = await _evaluationHistoryService.GetEvaluationDetailAsync(evaluationId);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound($"Évaluation non trouvée : {ex.Message}");
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des détails : {ex.Message}");
			}
		}

		[HttpGet("statistics")]
		public async Task<IActionResult> GetEvaluationStatistics(
	[FromQuery] DateTime? startDate,
	[FromQuery] DateTime? endDate)
		{
			try 
			{
				var result = await _evaluationHistoryService.GetEvaluationStatisticsAsync(startDate, endDate);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des statistiques : {ex.Message}");
			}
		}

		[HttpGet("global-performance")]
		public async Task<IActionResult> GetGlobalPerformance(
		   [FromQuery] DateTime? startDate,
		   [FromQuery] DateTime? endDate,
		   [FromQuery] string department = null,
		   [FromQuery] string evaluationType = null)
		{
			try
			{
				var performanceData = await _evaluationHistoryService.GetGlobalPerformanceAsync(startDate, endDate, department, evaluationType);
				
				// Vérification supplémentaire pour s'assurer que les données ne sont pas nulles
				if (performanceData == null)
				{
					// Retourner un tableau vide au lieu de null
					return Ok(new List<object>());
				}
				
				return Ok(performanceData);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur dans GetGlobalPerformance: {ex.Message}");
				Console.WriteLine($"StackTrace: {ex.StackTrace}");
				
				// Retourner un tableau vide au lieu d'une erreur 500
				return Ok(new List<object>());
			}
		}

		[HttpGet("kpis")]
		public async Task<IActionResult> GetKPIs([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? departmentName = null)
		{
			try
			{
				var kpis = await _evaluationHistoryService.GetKPIsAsync(startDate, endDate, departmentName);
				return Ok(kpis);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des KPI : {ex.Message}");
			}
		}

		[HttpGet("export")]
		public async Task<IActionResult> ExportData([FromQuery] string format, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
		{
			var file = await _evaluationHistoryService.ExportDataAsync(format, startDate, endDate);
			return File(file.Content, file.ContentType, file.FileName);
		}

		[HttpGet("positions")]
		public async Task<IActionResult> GetAllPostes()
		{
			var positions = await _evaluationHistoryService.GetAllPostesAsync();
			foreach (var pos in positions)
			{
				Console.WriteLine("les postes: " + pos.PositionName);
			}
			return Ok(positions);
		}

		[HttpGet("departments")]
		public async Task<IActionResult> GetAllDepartments()
		{
			try
			{
				var departments = await _evaluationHistoryService.GetAllDepartmentsAsync();
				return Ok(departments);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des départements : {ex.Message}");
			}
		}

		[HttpGet("evaluation-types")]
		public async Task<IActionResult> GetEvaluationTypes()
		{
			try
			{
				var types = await _evaluationHistoryService.GetEvaluationTypesAsync();
				return Ok(types);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des types d'évaluation : {ex.Message}");
			}
		}

		[HttpGet("employees")]
		public async Task<IActionResult> GetEmployees()
		{
			try
			{
				var employees = await _evaluationHistoryService.GetEmployeesAsync();
				return Ok(employees);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des employés : {ex.Message}");
			}
		}

		[HttpGet("detailed-statistics")]
		public async Task<IActionResult> GetDetailedStatistics(
			[FromQuery] DateTime? startDate,
			[FromQuery] DateTime? endDate,
			[FromQuery] string? department = null,
			[FromQuery] string? evaluationType = null)
		{
			try
			{
				Console.WriteLine($"Requête de statistiques détaillées reçue: startDate={startDate}, endDate={endDate}, department={department}, evaluationType={evaluationType}");
				
				var statistics = await _evaluationHistoryService.GetDetailedStatisticsAsync(
					startDate, endDate, department, evaluationType);
					
				Console.WriteLine("Statistiques détaillées générées avec succès");
				return Ok(statistics);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la récupération des statistiques détaillées : {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				
				// Retourner un objet vide mais valide au lieu d'une erreur 500
				return Ok(new 
				{
					ScoreDistribution = new 
					{
						Low = 0,
						Medium = 0, 
						High = 0,
						Average = 0,
						Min = 0,
						Max = 0
					},
					DepartmentDistribution = new object[0],
					EvaluationTypeDistribution = new object[0],
					PerformanceByYear = new object[0],
					TrendData = new
					{
						IsIncreasing = false,
						PercentageChange = 0,
						StartValue = 0,
						EndValue = 0,
						StandardDeviation = 0
					}
				});
			}
		}
		
		[HttpGet("global-statistics")]
		public async Task<IActionResult> GetGlobalStatistics(
			[FromQuery] DateTime? startDate,
			[FromQuery] DateTime? endDate,
			[FromQuery] string? department = null,
			[FromQuery] string? evaluationType = null,
			[FromQuery] string? employeeName = null)
		{
			try
			{
				Console.WriteLine($"Requête de statistiques globales reçue: startDate={startDate}, endDate={endDate}, department={department}, evaluationType={evaluationType}, employeeName={employeeName}");
				
				// Récupérer les KPIs
				var kpis = await _evaluationHistoryService.GetKPIsAsync(startDate, endDate, department);
				
				// Récupérer les statistiques détaillées
				var detailedStats = await _evaluationHistoryService.GetDetailedStatisticsAsync(
					startDate, endDate, department, evaluationType);
				
				// Récupérer le nombre total d'évaluations (non filtré par pagination)
				var evaluations = await _evaluationHistoryService.GetEvaluationHistoryAsync(
					startDate, endDate, evaluationType, department, employeeName);
				
				// Combiner toutes les données en un seul objet de réponse
				var globalStats = new
				{
					// Nombre total d'évaluations
					totalEvaluationsCount = evaluations?.Count ?? 0,
					
					// Score moyen global
					averageScore = kpis?.OverallAverage ?? 0,
					
					// Taux de participation et d'approbation
					participationRate = kpis?.ParticipationRate ?? 0,
					approvalRate = kpis?.ApprovalRate ?? 0,
					
					// Distribution par département
					departmentDistribution = detailedStats?.DepartmentDistribution ?? new List<DistributionItemDto>(),
					
					// Distribution par type d'évaluation
					evaluationTypeDistribution = detailedStats?.EvaluationTypeDistribution ?? new List<DistributionItemDto>(),
					
					// Données de tendance
					trendData = detailedStats?.TrendData ?? new TrendDto
					{
						IsIncreasing = false,
						PercentageChange = 0,
						StartValue = 0,
						EndValue = 0,
						StandardDeviation = 0
					},
					
					// Distribution des scores
					scoreDistribution = detailedStats?.ScoreDistribution ?? new ScoreDistributionDto
					{
						Low = 0,
						Medium = 0,
						High = 0,
						Average = 0,
						Min = 0,
						Max = 0
					}
				};
				
				Console.WriteLine("Statistiques globales générées avec succès");
				return Ok(globalStats);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la récupération des statistiques globales : {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				
				// Retourner un objet vide mais valide au lieu d'une erreur 500
				return Ok(new
				{
					totalEvaluationsCount = 0,
					averageScore = 0,
					participationRate = 0,
					approvalRate = 0,
					departmentDistribution = new List<DistributionItemDto>(),
					evaluationTypeDistribution = new List<DistributionItemDto>(),
					trendData = new TrendDto
					{
						IsIncreasing = false,
						PercentageChange = 0,
						StartValue = 0,
						EndValue = 0,
						StandardDeviation = 0
					},
					scoreDistribution = new ScoreDistributionDto
					{
						Low = 0,
						Medium = 0,
						High = 0,
						Average = 0,
						Min = 0,
						Max = 0
					}
				});
			}
		}
	}
}
