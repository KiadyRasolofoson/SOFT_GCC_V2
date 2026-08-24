using System.Text.Json;
using SoftGcc.Application.Common.Interfaces.AiAgent;

namespace SoftGcc.Application.Services.AiAgent.Tools;

internal abstract class AiToolBase : IAiTool
{
    public abstract string Key { get; }
    public abstract string Description { get; }
    public abstract IReadOnlyList<string> RequiredPermissions { get; }
    public abstract JsonElement ParametersSchema { get; }
    public abstract Task<string> ExecuteAsync(JsonElement arguments, int userId, CancellationToken cancellationToken = default);

    protected static JsonElement Schema(string json) => AiJson.ParseSchema(json);
}
