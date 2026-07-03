using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Application.Services.salary_skills;

namespace soft_carriere_competence.Controllers.history
{
	[Route("api/[controller]")]
	[ApiController]
	public class ActivityLogController : ControllerBase
	{
		private readonly HistoryService _historyService;

		public ActivityLogController(HistoryService service)
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
