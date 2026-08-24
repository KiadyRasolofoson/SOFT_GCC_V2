using System.Text.Json;

namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface IAiTool
{
    string Key { get; }
    string Description { get; }
    JsonElement ParametersSchema { get; }
    IReadOnlyList<string> RequiredPermissions { get; }
    Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default);
}
