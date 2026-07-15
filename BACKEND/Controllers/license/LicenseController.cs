using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.LicenseDto;
using soft_carriere_competence.Application.Services.license;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers.license
{
    /// <summary>
    /// Contrôleur de gestion des licences.
    /// Accessible sans authentification JWT (les routes sont publiques par défaut).
    /// </summary>
    [Route("api/license")]
    [ApiController]
    public class LicenseController : ControllerBase
    {
        private readonly ILicenseService _licenseService;

        public LicenseController(ILicenseService licenseService)
        {
            _licenseService = licenseService;
        }

        /// <summary>
        /// Active une licence à partir d'une clé fournie par le client.
        /// </summary>
        /// <param name="dto">Clé de licence au format base64.</param>
        /// <returns>Résultat de l'activation.</returns>
        /// <response code="200">Licence activée avec succès.</response>
        /// <response code="400">Clé de licence invalide ou erreur de validation.</response>
        [HttpPost("activate")]
        [ProducesResponseType(typeof(LicenseValidationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(LicenseValidationResult), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Activate([FromBody] LicenseActivateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.LicenseKey))
            {
                return BadRequest(LicenseValidationResult.Invalid(
                    LicenseErrorReason.InvalidFormat,
                    "La clé de licence est requise."));
            }

            var result = await _licenseService.Activate(dto);

            if (result.IsValid)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        /// <summary>
        /// Retourne le statut actuel de la licence.
        /// </summary>
        /// <returns>Statut de la licence (valide ou raison d'échec).</returns>
        /// <response code="200">Statut retourné (licence valide ou invalide).</response>
        [HttpGet("status")]
        [ProducesResponseType(typeof(LicenseValidationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            var result = await _licenseService.GetStatus();
            return Ok(result);
        }

        /// <summary>
        /// Retourne l'identifiant unique de la machine actuelle (MachineId).
        /// Utile pour le fournir à l'éditeur lors de la génération d'une licence.
        /// </summary>
        /// <returns>Le MachineId au format string.</returns>
        /// <response code="200">MachineId retourné.</response>
        [HttpGet("machine-id")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult GetMachineId()
        {
            var machineId = LicenseService.GetMachineId();
            return Ok(new { machineId });
        }
    }
}
