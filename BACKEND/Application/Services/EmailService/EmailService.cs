using soft_carriere_competence.Core.Interface.AuthInterface;
using System.Net.Mail;
using System.Net;

namespace soft_carriere_competence.Application.Services.EmailService
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            // Utilisation d'un client SMTP pour envoyer l'email
            using var client = new SmtpClient
            {
                Host = _configuration["Email:Host"],
                Port = int.Parse(_configuration["Email:Port"]),
                Credentials = new NetworkCredential(
                    _configuration["Email:Username"],
                    _configuration["Email:Password"]
                ),
                EnableSsl = true
            };

            var fromAddress = new MailAddress(
                _configuration["Email:From"], 
                _configuration["Email:DisplayName"] ?? "No Reply - GCC"
            );
            
            var mailMessage = new MailMessage
            {
                From = fromAddress,
                Subject = subject,
                Body = FormatEmailWithTemplate(subject, body),
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
        
        private string FormatEmailWithTemplate(string subject, string bodyText)
        {
            // Conversion des sauts de ligne texte en HTML
            string htmlBody = bodyText.Replace("\n", "<br/>");
            
            // Template HTML avec design professionnel
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>{subject}</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                    }}
                    .email-container {{
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                        padding: 20px;
                        background-color: #f9f9f9;
                    }}
                    .email-header {{
                        background-color: #2c3e50;
                        color: white;
                        padding: 15px;
                        border-radius: 5px 5px 0 0;
                        text-align: center;
                        margin-bottom: 20px;
                    }}
                    .email-content {{
                        background-color: white;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }}
                    .email-footer {{
                        margin-top: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }}
                    .credentials {{
                        background-color: #f2f2f2;
                        padding: 10px;
                        border-left: 4px solid #2c3e50;
                        margin: 15px 0;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #2c3e50;
                        color: white;
                        text-decoration: none;
                        padding: 10px 20px;
                        border-radius: 3px;
                        margin-top: 15px;
                    }}
                </style>
            </head>
            <body>
                <div class='email-container'>
                    <div class='email-header'>
                        <h2>Gestion des Carrières et Compétences</h2>
                    </div>
                    <div class='email-content'>
                        <h3>{subject}</h3>
                        <div>{htmlBody}</div>
                    </div>
                    <div class='email-footer'>
                        <p>Ce message est envoyé automatiquement, merci de ne pas y répondre.</p>
                        <p>&copy; {DateTime.Now.Year} - Système de Gestion des Carrières et Compétences</p>
                    </div>
                </div>
            </body>
            </html>";
        }
    }
}
