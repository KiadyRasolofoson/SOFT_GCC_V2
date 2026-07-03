namespace soft_carriere_competence.Core.Entities.email
{
    public class SendEmailRequest
    {
        public string RecipientEmail { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; } // HTML ou texte brut
        public string FileName { get; set; }
        public string Base64Pdf { get; set; } // Contenu du fichier PDF encodé en base64
    }
}
