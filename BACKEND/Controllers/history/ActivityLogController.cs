using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Application.Services.salary_skills;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers.history
{
	[Route("api/[controller]")]
	[ApiController]
	public class ActivityLogController : ControllerBase
	{
		private readonly IHistoryService _historyService;

		public ActivityLogController(IHistoryService service)
		{
			_historyService = service;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll()
		{
			var activityLogs = await _historyService.GetAllHistory();
			return Ok(activityLogs);
		}
	}
}
