namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>Choix d'une question QCM, avec le flag « bonne réponse » réservé au paramétrage et à la notation.</summary>
public class EvaluationQuestionOptionDto
{
    public int? OptionId { get; set; }

    public string OptionText { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public int SortOrder { get; set; }
}

/// <summary>Option exposée au salarié : jamais de bonne réponse.</summary>
public sealed record PortalQuestionOptionDto(int OptionId, int QuestionId, string OptionText);
