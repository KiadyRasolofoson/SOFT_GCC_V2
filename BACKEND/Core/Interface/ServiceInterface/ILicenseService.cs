namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service de licence.
    /// </summary>
    public interface ILicenseService
    {
        Task<bool> ValidateLicense(string licenseKey);
        Task<string> GenerateLicense(string clientName, string? macAddress = null);
        Task<bool> RevokeLicense(string licenseKey);
    }
}
