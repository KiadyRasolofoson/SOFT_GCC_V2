using System;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class EvaluationQuestionDto
    {
        public int? QuestionId { get; set; }  // Nullable pour la création
        
        [Required(ErrorMessage = "La question est requise.")]
        public string Question { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Le type d'évaluation est requis.")]
        public int EvaluationTypeId { get; set; }

        /// <summary>
        /// Compétence évaluée (référentiel). Le domaine et la famille en découlent.
        /// </summary>
        [Required(ErrorMessage = "La compétence est requise.")]
        public int SkillId { get; set; }

        /// <summary>Poste facultatif : null ou 0 signifie « tous les postes ».</summary>
        public int? PositionId { get; set; }
        
        // CompetenceLineId est optionnel
        public int? CompetenceLineId { get; set; }
        
        [Required(ErrorMessage = "Le type de réponse est requis.")]
        public int ResponseTypeId { get; set; }
        
        public int State { get; set; } = 1;  // Valeur par défaut

        /// <summary>Choix et bonnes réponses, requis lorsque le type est QCM.</summary>
        public List<EvaluationQuestionOptionDto> Options { get; set; } = [];
    }
} 
