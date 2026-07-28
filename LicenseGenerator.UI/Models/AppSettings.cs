namespace LicenseGenerator.UI.Models
{
    /// <summary>
    /// Paramètres persistants de l'application, sauvegardés en JSON.
    /// </summary>
    public class AppSettings
    {
        public string ApiBaseUrl { get; set; } = "http://localhost:5001";
        public string PrivateKeyFilePath { get; set; } = string.Empty;
        public string LicenseType { get; set; } = "Standard";
        public bool UseDurationMode { get; set; } = true;
        public int DurationMonths { get; set; } = 12;
    }
}
