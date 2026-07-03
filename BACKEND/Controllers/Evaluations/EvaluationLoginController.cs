using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace soft_carriere_competence.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class EvaluationLoginController : ControllerBase
	{
		private readonly ApplicationDbContext _context;
		private readonly IConfiguration _configuration;

		public EvaluationLoginController(ApplicationDbContext context, IConfiguration configuration)
		{
			_context = context;
			_configuration = configuration;
		}

		[HttpPost("login")]
		public async Task<IActionResult> Login([FromBody] TemporaryLoginRequest request)
		{
			if (string.IsNullOrEmpty(request.TempLogin) || string.IsNullOrEmpty(request.TempPassword))
			{
				return BadRequest(new { success = false, message = "Login et mot de passe requis" });
			}

			// Créer une entrée dans la table LoginAttempts pour la traçabilité
			var loginAttempt = new LoginAttempt
			{
				TempLogin = request.TempLogin,
				IPAddress = request.IPAddress,
				IsSuccess = false
			};

			await _context.loginAttempts.AddAsync(loginAttempt);
			await _context.SaveChangesAsync();

			// Vérifier l'existence du compte temporaire
			var tempAccount = await _context.temporaryAccounts
				.FirstOrDefaultAsync(ta =>
					ta.TempLogin == request.TempLogin &&
					ta.TempPassword == request.TempPassword &&
					ta.ExpirationDate > DateTime.UtcNow &&
					!ta.IsUsed);

			if (tempAccount == null)
			{
				return Unauthorized(new { success = false, message = "Identifiants invalides ou expirés" });
			}

			// Vérifier si l'évaluation est disponible (date de début atteinte)
			var evaluation = await _context.Evaluations
				.FirstOrDefaultAsync(e => e.EvaluationId == tempAccount.Evaluations_id);

			if (evaluation == null)
			{
				return NotFound(new { success = false, message = "Évaluation non trouvée" });
			}

			// Vérifier si la date actuelle est dans la période d'évaluation
			var currentDate = DateTime.UtcNow.Date;
			if (currentDate < evaluation.StartDate)
			{
				return StatusCode(403, new
				{
					success = false,
					message = $"L'évaluation n'est pas encore disponible. Elle sera accessible à partir du {evaluation.StartDate:dd/MM/yyyy}"
				});
			}

			if (currentDate > evaluation.EndDate)
			{
				return StatusCode(403, new
				{
					success = false,
					message = "La période d'évaluation est terminée"
				});
			}

			// Marquer la tentative comme réussie
			loginAttempt.IsSuccess = true;
			await _context.SaveChangesAsync();

			// Générer le token JWT
			var token = GenerateJwtToken(tempAccount.EmployeeId, tempAccount.Evaluations_id);

			return Ok(new
			{
				success = true,
				token = token,
				evaluationId = tempAccount.Evaluations_id
			});
		}

		private string GenerateJwtToken(int userId, int evaluationId)
		{
			var claims = new[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
				new Claim("evaluationId", evaluationId.ToString()),
				new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
			};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: _configuration["Jwt:Issuer"],
				audience: _configuration["Jwt:Audience"],
				claims: claims,
				expires: DateTime.Now.AddMinutes(30),
				signingCredentials: creds);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}

	public class TemporaryLoginRequest
	{
		public string TempLogin { get; set; }
		public string TempPassword { get; set; }
		public string IPAddress { get; set; }
	}
}