namespace soft_carriere_competence.Application.Dtos.LicenseDto
{
    /// <summary>
    /// DTO utilisé pour l'activation d'une licence.
    /// Contient uniquement la clé de licence fournie par le client.
    /// </summary>
    public class LicenseActivateDto
    {
        /// <summary>
        /// Clé de licence complète au format base64 (payload|signature).
        /// </summary>
        public string LicenseKey { get; set; } = string.Empty;
    }
}
