using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Api.Controllers.Authentification
{
    /// <summary>
    /// Endpoint de profil utilisateur pour le frontend React.
    /// ATTENTION : ce endpoint sert UNIQUEMENT à construire la navbar et l'interface.
    /// L'autorisation réelle est gérée par les policies ABAC côté serveur.
    /// </summary>
    [Route("api/me")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IUserProfileService _profileService;

        public ProfileController(IUserProfileService profileService)
        {
            _profileService = profileService;
        }

        /// <summary>
        /// GET /api/me/profile
        /// Retourne le profil complet de l'utilisateur connecté :
        /// infos personnelles, rôle, permissions, modules visibles pour la navbar.
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Utilisateur non authentifié.");

            var profile = await _profileService.GetProfileAsync(int.Parse(userIdClaim));
            if (profile == null)
                return NotFound("Utilisateur introuvable.");

            return Ok(profile);
        }
    }
}
