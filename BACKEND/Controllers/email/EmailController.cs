using System.Net.Mail;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Entities.email;

using soft_carriere_competence.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace soft_carriere_competence.Controllers.email
{
    [Route("api/[controller]")]
    [ApiController]
    [RequirePermission("SEND_CERTIFICATES","MANAGE_CERTIFICATES","VIEW_CERTIFICATES")]
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
				var smtpHost = _configuration["Smtp:Host"] ?? "";
				var smtpPort = _configuration["Smtp:Port"] ?? "587";
				var smtpUsername = _configuration["Smtp:Username"] ?? "";
				var smtpPassword = _configuration["Smtp:Password"] ?? "";
				var senderEmail = _configuration["Smtp:SenderEmail"] ?? "";

				var smtpClient = new SmtpClient(smtpHost)
				{
					Port = int.Parse(smtpPort),
					Credentials = new NetworkCredential(smtpUsername, smtpPassword),
					EnableSsl = true,
				};

				var mailMessage = new MailMessage
				{
					From = new MailAddress(senderEmail),
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
