using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Interface.EvaluationInterface;

namespace soft_carriere_competence.Controllers.Evaluations
{
	[ApiController]
	[Route("api/files")]
	public class FileController : ControllerBase
	{
		private readonly IFileProcessingService _fileProcessingService;

		public FileController(IFileProcessingService fileProcessingService)
		{
			_fileProcessingService = fileProcessingService;
		}

		[HttpPost("upload-docx")]
		public IActionResult UploadDocx(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest("Aucun fichier n'a été téléchargé.");

			using (var stream = file.OpenReadStream())
			{
				try
				{
					var text = _fileProcessingService.ExtractTextFromDocx(stream);
					return Ok(new { Text = text });
				}
				catch (Exception ex)
				{
					return StatusCode(500, $"Erreur lors du traitement du fichier DOCX : {ex.Message}");
				}
			}
		}

		[HttpPost("upload-excel")]
		public IActionResult UploadExcel(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest("Aucun fichier n'a été téléchargé.");

			using (var stream = file.OpenReadStream())
			{
				try
				{
					var data = _fileProcessingService.ExtractDataFromExcel(stream);
					return Ok(new { Data = data });
				}
				catch (Exception ex)
				{
					return StatusCode(500, $"Erreur lors du traitement du fichier Excel : {ex.Message}");
				}
			}
		}

		[HttpPost("upload-csv")]
		public IActionResult UploadCsv(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest("Aucun fichier n'a été téléchargé.");

			using (var stream = file.OpenReadStream())
			{
				try
				{
					var data = _fileProcessingService.ExtractDataFromCsv(stream);
					return Ok(new { Data = data });
				}
				catch (Exception ex)
				{
					return StatusCode(500, $"Erreur lors du traitement du fichier CSV : {ex.Message}");
				}
			}
		}
	}
}
