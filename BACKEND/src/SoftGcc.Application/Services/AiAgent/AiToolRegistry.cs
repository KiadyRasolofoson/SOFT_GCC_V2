using SoftGcc.Application.Common.Interfaces.AiAgent;

namespace SoftGcc.Application.Services.AiAgent;

public sealed class AiToolRegistry : IAiToolRegistry
{
    private readonly IReadOnlyDictionary<string, IAiTool> _tools;
    private readonly IAiToolPermissionResolver _resolver;

    public AiToolRegistry(IEnumerable<IAiTool> tools, IAiToolPermissionResolver resolver)
    {
        _tools = tools.ToDictionary(t => t.Key, StringComparer.OrdinalIgnoreCase);
        _resolver = resolver;
        All = _tools.Values.ToList();
    }

    public IReadOnlyList<IAiTool> All { get; }

    public IAiTool? Get(string key) =>
        _tools.TryGetValue(key, out var tool) ? tool : null;

    public async Task<IReadOnlyList<IAiTool>> GetAllowedAsync(int userId, int roleId, CancellationToken cancellationToken = default)
    {
        var allowed = new List<IAiTool>();
        foreach (var tool in All)
        {
            if (await _resolver.IsToolAllowedAsync(userId, roleId, tool, cancellationToken))
                allowed.Add(tool);
        }

        return allowed;
    }
}
