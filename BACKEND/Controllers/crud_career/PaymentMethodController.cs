using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.crud_career;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	public class PaymentMethodController : ControllerBase
	{
		private readonly PaymentMethodService _paymentMethodService;

		public PaymentMethodController(PaymentMethodService service)
		{
			_paymentMethodService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var paymentMethods = await _paymentMethodService.GetAll();
			return Ok(paymentMethods);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> Get(int id)
		{
			var paymentMethod = await _paymentMethodService.GetById(id);
			if (paymentMethod == null) return NotFound();
			return Ok(paymentMethod);
		}

		[HttpPost]
		public async Task<IActionResult> Create(PaymentMethod paymentMethod)
		{
			await _paymentMethodService.Add(paymentMethod);
			return CreatedAtAction(nameof(Get), new { id = paymentMethod.PaymentMethodId }, paymentMethod);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, PaymentMethod paymentMethod)
		{
			if (id != paymentMethod.PaymentMethodId) return BadRequest();
			await _paymentMethodService.Update(paymentMethod);
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			await _paymentMethodService.Delete(id);
			return NoContent();
		}
	}
}
