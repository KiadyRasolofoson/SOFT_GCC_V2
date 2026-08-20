namespace SoftGcc.Application.Dtos.Email
{
    public class SendEmailRequest
    {
        public string RecipientEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty; // HTML ou texte brut
        public string FileName { get; set; } = string.Empty;
        public string Base64Pdf { get; set; } = string.Empty; // Contenu du fichier PDF encodé en base64
    }
}
