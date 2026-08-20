using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace soft_carriere_competence.Hubs
{
    /// <summary>
    /// Hub SignalR pour les notifications temps réel.
    /// Chaque utilisateur rejoint un groupe nommé "user_{userId}"
    /// et reçoit les notifications qui lui sont destinées.
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userIdClaim = Context.User?.FindFirst("userId")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userIdClaim}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdClaim = Context.User?.FindFirst("userId")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userIdClaim}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Retourne le userId du contexte SignalR, pratique pour le debug.
        /// </summary>
        public string GetUserId()
        {
            return Context.User?.FindFirst("userId")?.Value ?? "inconnu";
        }
    }
}
