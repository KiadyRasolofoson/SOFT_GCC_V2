using SoftGcc.Application.Dtos.AiAgent;

namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface IAiAgentService
{
    Task<AiChatResponseDto> ChatAsync(int userId, int roleId, AiChatRequestDto request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiConversationSummaryDto>> GetConversationsAsync(int userId, CancellationToken cancellationToken = default);
    Task<AiConversationDetailDto> GetConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default);
    Task DeleteConversationAsync(int userId, int conversationId, CancellationToken cancellationToken = default);

    Task<AiAgentSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<AiAgentSettingsDto> UpdateSettingsAsync(UpdateAiAgentSettingsDto request, CancellationToken cancellationToken = default);

    IReadOnlyList<AiProviderCatalogDto> GetProviderCatalog();
    Task<AiProviderConfigDto> UpdateProviderConfigAsync(string provider, UpdateAiProviderConfigDto request, CancellationToken cancellationToken = default);
    Task<AiProviderTestResultDto> TestProviderAsync(string provider, CancellationToken cancellationToken = default);

    Task<AiToolsCatalogDto> GetToolsCatalogAsync(int userId, int roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AiToolPermissionDto>> GetToolPermissionsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AiToolPermissionDto>> ReplaceToolPermissionsAsync(ReplaceAiToolPermissionsDto request, CancellationToken cancellationToken = default);
}
