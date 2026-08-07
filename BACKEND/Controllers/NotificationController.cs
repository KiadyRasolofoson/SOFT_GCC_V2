using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Récupère les notifications paginées de l'utilisateur connecté.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
            return Ok(notifications);
        }

        /// <summary>
        /// Récupère le nombre de notifications non lues.
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        /// <summary>
        /// Marque une notification spécifique comme lue.
        /// </summary>
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Marque toutes les notifications de l'utilisateur comme lues.
        /// </summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { success = true });
        }
    }
}
