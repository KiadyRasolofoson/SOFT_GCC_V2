namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface IAiToolPermissionResolver
{
    Task<bool> IsToolAllowedAsync(int userId, int roleId, IAiTool tool, CancellationToken cancellationToken = default);
}
