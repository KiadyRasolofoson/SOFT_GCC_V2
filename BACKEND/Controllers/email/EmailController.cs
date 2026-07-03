using System.Net.Mail;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Entities.email;

namespace soft_carriere_competence.Controllers.email
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmailController : ControllerBase
    {
		private readonly IConfiguration _configuration;

		public EmailController(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		[HttpPost("send-pdf")]
		public async Task<IActionResult> SendPdfByEmail([FromBody] SendEmailRequest request)
		{
			try
			{
				var smtpClient = new SmtpClient(_configuration["Smtp:Host"])
				{
					Port = int.Parse(_configuration["Smtp:Port"]),
					Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"]),
					EnableSsl = true,
				};

				var mailMessage = new MailMessage
				{
					From = new MailAddress(_configuration["Smtp:SenderEmail"]),
					Subject = request.Subject,
					Body = request.Body,
					IsBodyHtml = true,
				};
				mailMessage.To.Add(request.RecipientEmail);

				// Convertir le base64 en fichier PDF
				var pdfBytes = Convert.FromBase64String(request.Base64Pdf);
				var attachment = new Attachment(new MemoryStream(pdfBytes), request.FileName, "application/pdf");
				mailMessage.Attachments.Add(attachment);

				await smtpClient.SendMailAsync(mailMessage);
				return Ok("E-mail envoyé avec succès.");
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de l’envoi de l’e-mail : {ex.Message}");
			}
		}
	}
}
