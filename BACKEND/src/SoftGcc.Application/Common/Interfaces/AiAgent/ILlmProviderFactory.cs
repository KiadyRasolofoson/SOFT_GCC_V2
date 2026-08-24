using SoftGcc.Domain.Enums;

namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface ILlmProviderFactory
{
    ILlmChatClient GetClient(AiProvider provider);
}
