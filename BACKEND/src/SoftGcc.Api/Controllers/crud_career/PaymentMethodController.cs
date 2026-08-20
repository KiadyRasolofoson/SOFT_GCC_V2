using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.crud_career
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_CAREER_SETTINGS","MANAGE_CAREER_SETTINGS")]
	public class PaymentMethodController : ControllerBase
	{
		private readonly IPaymentMethodService _paymentMethodService;

		public PaymentMethodController(IPaymentMethodService service)
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
