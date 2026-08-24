using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Domain.Enums;

namespace SoftGcc.Infrastructure.Services.AiAgent;

public sealed class LlmProviderFactory : ILlmProviderFactory
{
    private readonly IHttpClientFactory _httpClientFactory;

    public LlmProviderFactory(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public ILlmChatClient GetClient(AiProvider provider)
    {
        var http = _httpClientFactory.CreateClient("AiLlm");
        return provider switch
        {
            AiProvider.Gemini => new GeminiChatClient(http),
            AiProvider.Claude => new ClaudeChatClient(http),
            _ => new OpenAiCompatibleChatClient(http)
        };
    }
}
