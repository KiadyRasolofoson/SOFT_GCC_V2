using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using soft_carriere_competence.Application.Services.Evaluations;

namespace soft_carriere_competence.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class EvaluationLoginController : ControllerBase
	{
		private readonly TemporaryAccountService _temporaryAccountService;
		private readonly IConfiguration _configuration;

		public EvaluationLoginController(TemporaryAccountService temporaryAccountService, IConfiguration configuration)
		{
			_temporaryAccountService = temporaryAccountService;
			_configuration = configuration;
		}

		[HttpPost("login")]
		[AllowAnonymous]
		public async Task<IActionResult> Login([FromBody] TemporaryLoginRequest request)
		{
			if (string.IsNullOrEmpty(request.TempLogin) || string.IsNullOrEmpty(request.TempPassword))
			{
				return BadRequest(new { success = false, message = "Login et mot de passe requis" });
			}

			var (success, message, token, evaluationId) = await _temporaryAccountService.LoginAsync(
				request.TempLogin, request.TempPassword, request.IPAddress ?? string.Empty, _configuration);

			if (!success)
			{
				if (message?.Contains("pas encore disponible") == true)
				{
					return StatusCode(403, new { success = false, message });
				}
				if (message?.Contains("terminée") == true)
				{
					return StatusCode(403, new { success = false, message });
				}
				if (message?.Contains("non trouvée") == true)
				{
					return NotFound(new { success = false, message });
				}
				return Unauthorized(new { success = false, message });
			}

			return Ok(new
			{
				success = true,
				token,
				evaluationId
			});
		}
	}

	public class TemporaryLoginRequest
	{
		public string TempLogin { get; set; } = string.Empty;
		public string TempPassword { get; set; } = string.Empty;
		public string IPAddress { get; set; } = string.Empty;
	}
}