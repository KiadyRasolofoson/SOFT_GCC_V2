using System;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class QuestionTimeUpdateDto
    {
        [Required]
        public int QuestionId { get; set; }
        
        [Required]
        [Range(1, 60, ErrorMessage = "Le temps maximum doit être entre 1 et 60 minutes.")]
        public int MaxTimeInMinutes { get; set; }
    }
} 