using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.PDFExtraction;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [ApiController]
    [Route("api/EvaluationInterview")]
    public class PdfExtractionController : ControllerBase
    {
        private readonly ILogger<PdfExtractionController> _logger;
        private readonly PdfExtractionService _pdfExtractionService;
        
        public PdfExtractionController(
            ILogger<PdfExtractionController> logger,
            PdfExtractionService pdfExtractionService)
        {
            _logger = logger;
            _pdfExtractionService = pdfExtractionService;
        }
        
        [HttpPost("extract-pdf-data")]
        public async Task<IActionResult> ExtractPdfData(
            [FromForm] IFormFile file, 
            [FromForm] int employeeId)
        {
            try
            {
                _logger.LogInformation($"Début de l'extraction de données PDF pour l'employé: {employeeId}");
                
                if (file == null || file.Length == 0)
                    return BadRequest("Aucun fichier fourni");
                
                if (file.ContentType != "application/pdf")
                    return BadRequest("Le fichier doit être au format PDF");
                
                var extractedData = await _pdfExtractionService.ExtractDataFromPdfAsync(file, employeeId);
                
                return Ok(extractedData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'extraction des données du PDF");
                return StatusCode(500, new { 
                    message = "Une erreur est survenue lors du traitement du PDF",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("get-evaluation-pdf/{employeeId}")]
        public async Task<IActionResult> GetEvaluationPdf(int employeeId)
        {
            try
            {
                _logger.LogInformation($"Récupération du PDF d'évaluation pour l'employé: {employeeId}");
                
                // Ici, vous devriez avoir une logique pour récupérer la dernière fiche d'évaluation de l'employé
                // Cela pourrait être dans un service dédié ou directement ici
                
                // Exemple simpliste (à adapter selon votre architecture de stockage):
                var pdfPath = $"Storage/Evaluations/{employeeId}/latest_evaluation.pdf";
                
                if (!System.IO.File.Exists(pdfPath))
                {
                    _logger.LogWarning($"Aucun PDF trouvé pour l'employé: {employeeId}");
                    return NotFound($"Aucune fiche d'évaluation trouvée pour l'employé {employeeId}");
                }
                
                // Lire le fichier et le renvoyer
                var fileBytes = await System.IO.File.ReadAllBytesAsync(pdfPath);
                return File(fileBytes, "application/pdf", $"evaluation_{employeeId}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erreur lors de la récupération du PDF pour l'employé: {employeeId}");
                return StatusCode(500, new { 
                    message = "Une erreur est survenue lors de la récupération du PDF d'évaluation",
                    error = ex.Message 
                });
            }
        }
    }
} 