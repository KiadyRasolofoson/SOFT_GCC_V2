namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface IAiToolRegistry
{
    IReadOnlyList<IAiTool> All { get; }
    IAiTool? Get(string key);
    Task<IReadOnlyList<IAiTool>> GetAllowedAsync(int userId, int roleId, CancellationToken cancellationToken = default);
}
