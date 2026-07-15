using soft_carriere_competence.Application.Dtos.LicenseDto;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service de licence.
    /// </summary>
    public interface ILicenseService
    {
        Task<LicenseValidationResult> Activate(LicenseActivateDto dto);
        Task<LicenseValidationResult> GetStatus();
    }
}
