using SoftGcc.Application.Dtos.LicenseDto;

namespace SoftGcc.Application.Common.Interfaces
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
