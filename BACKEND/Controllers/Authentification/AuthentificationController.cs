using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.LoginDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers.Authentification
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthentificationController : ControllerBase
	{
		private readonly UserService _userService;
		private readonly ILicenseService _licenseService;

		public AuthentificationController(UserService userService, ILicenseService licenseService)
		{
			_userService = userService;
			_licenseService = licenseService;
		}

		[HttpPost("register")]
		[AllowAnonymous]
		public async Task<IActionResult> Register([FromBody] RegisterDto dto)
		{
			try
			{
				var result = await _userService.RegisterAsync(dto);
				return Ok(new { message = result });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpPost("login")]
		[AllowAnonymous]
		public async Task<IActionResult> Login([FromBody] LoginDto dto)
		{
			try
			{
				var licenseStatus = await _licenseService.GetStatus();
				if (!licenseStatus.IsValid)
				{
					return StatusCode(403, new
					{
						error = "license_invalid",
						reason = licenseStatus.ErrorReason.ToString(),
						message = "Licence invalide : " + (licenseStatus.ErrorMessage ?? "Veuillez contacter l'administrateur."),
						isLicenseValid = false
					});
				}

				var token = await _userService.LoginAsync(dto);
				return Ok(new { token });
			}
			catch (Exception ex)
			{
				return Unauthorized(new { message = ex.Message });
			}
		}

		[HttpPost("update")]
		[Authorize]
		public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto dto)
		{
			try
			{
				if (dto.UserId <= 0)
				{
					return BadRequest(new { message = "ID utilisateur invalide" });
				}

				// Récupérer l'utilisateur existant
				var user = await _userService.GetUserByIdAsync(dto.UserId);
				
				if (user == null)
				{
					return NotFound(new { message = "Utilisateur non trouvé" });
				}

				// Mettre à jour les propriétés
				user.FirstName = dto.FirstName;
				user.LastName = dto.LastName;
				user.Username = dto.Username;
				user.Email = dto.Email;
				user.RoleId = dto.RoleId;

				// Enregistrer les modifications
				await _userService.UpdateUserAsync(user);

				return Ok(new { message = "Utilisateur mis à jour avec succès" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = $"Erreur lors de la mise à jour: {ex.Message}" });
			}
		}

		[HttpPost("forgotpassword")]
		[AllowAnonymous]
		public async Task<IActionResult> ForgotPassword([FromBody] string email)
		{
			try
			{
				var result = await _userService.ForgotPasswordAsync(email);
				return Ok(new { message = result });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpPost("resetpassword")]
		[AllowAnonymous]
		public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
		{
			try
			{
				var result = await _userService.ResetPasswordAsync(dto);
				return Ok(new { message = result });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		// Dans AuthentificationController.cs
		[HttpGet("user")]
		[AllowAnonymous]
		public async Task<IActionResult> GetUserByEmail([FromQuery] string email)
		{
			var user = await _userService.GetUserByEmailAsync(email);
			if (user == null) return NotFound();
			return Ok(user);
		}

		[HttpGet("current-user")]
		[Authorize]
		public async Task<IActionResult> GetCurrentUser()
		{
			var userIdClaim = User.FindFirst("userId")?.Value; // Récupération de l'ID utilisateur depuis le token
			if (string.IsNullOrEmpty(userIdClaim))
			{
				return Unauthorized("Utilisateur non authentifié.");
			}

			var user = await _userService.GetUserByIdAsync(int.Parse(userIdClaim));
			if (user == null) return NotFound("Utilisateur introuvable.");

			return Ok(new
			{
				id = user.Id,
				email = user.Email,
				username = user.Username,
				firstName = user.FirstName,
				lastName = user.LastName,
				roleId = user.RoleId,
				roleTitle = user.Role?.Title ?? "Unknown"
				
			});
		}


		// Dans UserService.cs

	}
}
