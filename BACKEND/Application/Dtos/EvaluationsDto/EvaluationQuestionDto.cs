using System;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationQuestionDto
    {
        public int? QuestionId { get; set; }  // Nullable pour la création
        
        [Required(ErrorMessage = "La question est requise.")]
        public string Question { get; set; }
        
        [Required(ErrorMessage = "Le type d'évaluation est requis.")]
        public int EvaluationTypeId { get; set; }
        
        [Required(ErrorMessage = "La position est requise.")]
        public int PositionId { get; set; }
        
        // CompetenceLineId est optionnel
        public int? CompetenceLineId { get; set; }
        
        [Required(ErrorMessage = "Le type de réponse est requis.")]
        public int ResponseTypeId { get; set; }
        
        public int State { get; set; } = 1;  // Valeur par défaut
    }
} 