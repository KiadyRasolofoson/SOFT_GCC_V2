namespace SoftGcc.Application.Common.Interfaces;

public interface INotificationPublisher
{
    Task PublishToUserAsync(int userId, object payload, CancellationToken cancellationToken = default);
}
