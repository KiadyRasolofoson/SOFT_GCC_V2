using Microsoft.Extensions.Logging;
using SoftGcc.Domain.Entities;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;
using System.Text.Json;

namespace SoftGcc.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IGenericRepository<Notification> _notificationRepository;
        private readonly INotificationPublisher _publisher;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IGenericRepository<Notification> notificationRepository,
            INotificationPublisher publisher,
            ILogger<NotificationService> logger)
        {
            _notificationRepository = notificationRepository;
            _publisher = publisher;
            _logger = logger;
        }

        public async Task SendAsync(int userId, string type, string title, string message, string? link = null, object? payload = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                Link = link,
                Payload = payload != null ? JsonSerializer.Serialize(payload) : null,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);

            try
            {
                await _publisher.PublishToUserAsync(userId, new
                {
                    notification.Id,
                    notification.Type,
                    notification.Title,
                    notification.Message,
                    notification.Link,
                    notification.Payload,
                    notification.IsRead,
                    notification.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Échec du push SignalR pour l'utilisateur {UserId}, notification {NotificationId}", userId, notification.Id);
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(int userId, int page, int pageSize)
        {
            var notifications = await _notificationRepository.GetAllAsync();

            return notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            var notifications = await _notificationRepository.GetAllAsync();
            return notifications.Count(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            if (notification != null && notification.UserId == userId && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _notificationRepository.UpdateAsync(notification);
            }
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            var notifications = await _notificationRepository.GetAllAsync();
            var unreadNotifications = notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToList();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                await _notificationRepository.UpdateAsync(n);
            }
        }
    }
}
