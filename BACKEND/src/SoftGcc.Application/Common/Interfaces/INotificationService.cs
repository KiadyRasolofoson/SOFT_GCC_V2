using SoftGcc.Domain.Entities;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface INotificationService
    {
        /// <summary>
        /// Envoie une notification à un utilisateur (persiste en base + push temps réel via SignalR).
        /// </summary>
        Task SendAsync(int userId, string type, string title, string message, string? link = null, object? payload = null);

        /// <summary>
        /// Récupère les notifications paginées d'un utilisateur (triées par date décroissante).
        /// </summary>
        Task<List<Notification>> GetUserNotificationsAsync(int userId, int page, int pageSize);

        /// <summary>
        /// Récupère le nombre de notifications non lues d'un utilisateur.
        /// </summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>
        /// Marque une notification comme lue.
        /// </summary>
        Task MarkAsReadAsync(int notificationId, int userId);

        /// <summary>
        /// Marque toutes les notifications d'un utilisateur comme lues.
        /// </summary>
        Task MarkAllAsReadAsync(int userId);
    }
}
