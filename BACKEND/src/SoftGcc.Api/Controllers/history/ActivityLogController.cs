using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Services.history;
using SoftGcc.Application.Services.salary_skills;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.history
{
	[Route("api/[controller]")]
	[ApiController]
	[RequirePermission("VIEW_ACTIVITY_HISTORY","MANAGE_ACTIVITY_HISTORY")]
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
