using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class EstablishmentController : ControllerBase
	{
		private readonly EstablishmentService _establishmentService;

		public EstablishmentController(EstablishmentService service)
		{
			_establishmentService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var establishments = await _establishmentService.GetAll();
			return Ok(establishments);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var establishment = await _establishmentService.GetById(id);
			if (establishment == null) return NotFound();
			return Ok(establishment);
		}

		[HttpPost]
		public async Task<IActionResult> Create(
			[FromForm] string establishmentName, 
			[FromForm] string adress, 
			[FromForm] string phoneNumber, 
			[FromForm] string email,
			[FromForm] string website,
			[FromForm] string socialMedia,
			[FromForm] IFormFile? logo)
		{
			byte[]? photoBytes = null;
			if (logo != null)
			{
				using (var memoryStream = new MemoryStream())
				{
					await logo.CopyToAsync(memoryStream);
					photoBytes = memoryStream.ToArray();
				}
			}

			var establishment = new Establishment { 
				EstablishmentName = establishmentName,  
				Address = adress,
				PhoneNumber = phoneNumber,
				Email = email,
				Website = website,
				SocialMedia = socialMedia,
				Logo = photoBytes,
				CreationDate = DateTime.UtcNow,
				UpdatedDate = DateTime.UtcNow,
			};
			await _establishmentService.Add(establishment);

			return CreatedAtAction(nameof(Get), new { id = establishment.EstablishmentId }, establishment);
		}
		
		[HttpPut("{id}")]
		public async Task<IActionResult> Update(
			int id,
			[FromForm] string establishmentName,
			[FromForm] string adress,
			[FromForm] string phoneNumber,
			[FromForm] string email,
			[FromForm] string website,
			[FromForm] string socialMedia,
			[FromForm] IFormFile? logo)
		{
			var establishment = await _establishmentService.GetById(id);
			if (establishment == null)
			{
				return NotFound();
			}

			byte[]? photoBytes = establishment.Logo;
			if (logo != null)
			{
				using (var memoryStream = new MemoryStream())
				{
					await logo.CopyToAsync(memoryStream);
					photoBytes = memoryStream.ToArray();
				}
			}

			establishment.EstablishmentName = establishmentName;
			establishment.Address = adress;
			establishment.PhoneNumber = phoneNumber;
			establishment.Email = email;
			establishment.Website = website;
			establishment.SocialMedia = socialMedia;
			establishment.Logo = photoBytes;

			await _establishmentService.Update(establishment);

			// Forcer le cache à être ignoré en retournant l'URL avec un timestamp
			return Ok(new { logoUrl = $"/api/Establishment/logo/{id}?t=" + DateTime.UtcNow.Ticks });
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _establishmentService.Delete(id);
			return NoContent();
		}

		[HttpGet("logo/{id}")]
		public async Task<IActionResult> GetLogo(int id)
		{
			var establishment = await _establishmentService.GetById(id);
			if (establishment == null || establishment.Logo == null) return NotFound();

			return File(establishment.Logo, "image/jpeg");
		}
	}
}
