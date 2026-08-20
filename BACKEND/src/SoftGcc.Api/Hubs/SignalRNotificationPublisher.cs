using Microsoft.AspNetCore.SignalR;
using SoftGcc.Api.Hubs;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Api.Hubs;

public sealed class SignalRNotificationPublisher : INotificationPublisher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationPublisher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishToUserAsync(int userId, object payload, CancellationToken cancellationToken = default)
        => _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", payload, cancellationToken);
}
