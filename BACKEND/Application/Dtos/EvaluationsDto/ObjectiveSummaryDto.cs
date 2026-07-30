namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
	/// <summary>
	/// DTO pour l'écran récapitulatif des objectifs
	/// </summary>
	public class ObjectiveSummaryDto
	{
		public int InterviewId { get; set; }
		public int EvaluationId { get; set; }
		public int EmployeeId { get; set; }
		public string EmployeeName { get; set; } = string.Empty;
		public string Department { get; set; } = string.Empty;
		public string Position { get; set; } = string.Empty;
		public string Description { get; set; } = string.Empty;
		public string? DueDate { get; set; }
		public string? Indicator { get; set; }
		public string Status { get; set; } = "Non commencé";
		public int CompletionRate { get; set; }
		public int ObjectiveIndex { get; set; }
	}

	/// <summary>
	/// DTO pour la mise à jour du statut d'un objectif
	/// </summary>
	public class UpdateObjectiveStatusDto
	{
		public int ObjectiveIndex { get; set; }
		public string? Status { get; set; }
		public int? CompletionRate { get; set; }
	}

	/// <summary>
	/// DTO pour les statistiques des objectifs
	/// </summary>
	public class ObjectivesStatisticsDto
	{
		public int TotalObjectives { get; set; }
		public int AchievedObjectives { get; set; }
		public int InProgressObjectives { get; set; }
		public int NotStartedObjectives { get; set; }
		public int NotAchievedObjectives { get; set; }
		public double AverageCompletionRate { get; set; }
	}
}
