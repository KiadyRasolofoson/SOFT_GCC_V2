namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface ILlmChatClient
{
    Task<LlmChatResponse> CompleteAsync(LlmChatRequest request, CancellationToken cancellationToken = default);
}
