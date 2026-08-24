using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Application.Dtos.AiAgent;
using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Api.Controllers.AiAgent;

[Route("api/ai-agent")]
[ApiController]
[Authorize]
public sealed class AiAgentController : ControllerBase
{
    private readonly IAiAgentService _agent;

    public AiAgentController(IAiAgentService agent)
    {
        _agent = agent;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<AiChatResponseDto>> Chat([FromBody] AiChatRequestDto request, CancellationToken cancellationToken)
    {
        var (userId, roleId) = GetIdentity();
        var result = await _agent.ChatAsync(userId, roleId, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<IReadOnlyList<AiConversationSummaryDto>>> GetConversations(CancellationToken cancellationToken)
    {
        var (userId, _) = GetIdentity();
        return Ok(await _agent.GetConversationsAsync(userId, cancellationToken));
    }

    [HttpGet("conversations/{id:int}")]
    public async Task<ActionResult<AiConversationDetailDto>> GetConversation(int id, CancellationToken cancellationToken)
    {
        var (userId, _) = GetIdentity();
        return Ok(await _agent.GetConversationAsync(userId, id, cancellationToken));
    }

    [HttpDelete("conversations/{id:int}")]
    public async Task<IActionResult> DeleteConversation(int id, CancellationToken cancellationToken)
    {
        var (userId, _) = GetIdentity();
        await _agent.DeleteConversationAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpGet("tools")]
    public async Task<ActionResult<AiToolsCatalogDto>> GetTools(CancellationToken cancellationToken)
    {
        var (userId, roleId) = GetIdentity();
        return Ok(await _agent.GetToolsCatalogAsync(userId, roleId, cancellationToken));
    }

    [HttpGet("providers")]
    [Authorize(Policy = "RequireAdminRole")]
    public ActionResult<IReadOnlyList<AiProviderCatalogDto>> GetProviders()
    {
        return Ok(_agent.GetProviderCatalog());
    }

    [HttpGet("settings")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<AiAgentSettingsDto>> GetSettings(CancellationToken cancellationToken)
    {
        return Ok(await _agent.GetSettingsAsync(cancellationToken));
    }

    [HttpPut("settings")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<AiAgentSettingsDto>> UpdateSettings([FromBody] UpdateAiAgentSettingsDto request, CancellationToken cancellationToken)
    {
        return Ok(await _agent.UpdateSettingsAsync(request, cancellationToken));
    }

    [HttpPut("providers/{provider}")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<AiProviderConfigDto>> UpdateProvider(string provider, [FromBody] UpdateAiProviderConfigDto request, CancellationToken cancellationToken)
    {
        return Ok(await _agent.UpdateProviderConfigAsync(provider, request, cancellationToken));
    }

    [HttpPost("providers/{provider}/test")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<AiProviderTestResultDto>> TestProvider(string provider, CancellationToken cancellationToken)
    {
        return Ok(await _agent.TestProviderAsync(provider, cancellationToken));
    }

    [HttpGet("tool-permissions")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<IReadOnlyList<AiToolPermissionDto>>> GetToolPermissions(CancellationToken cancellationToken)
    {
        return Ok(await _agent.GetToolPermissionsAsync(cancellationToken));
    }

    [HttpPut("tool-permissions")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult<IReadOnlyList<AiToolPermissionDto>>> ReplaceToolPermissions([FromBody] ReplaceAiToolPermissionsDto request, CancellationToken cancellationToken)
    {
        return Ok(await _agent.ReplaceToolPermissionsAsync(request, cancellationToken));
    }

    private (int UserId, int RoleId) GetIdentity()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedException("Utilisateur non authentifié.");

        var roleIdClaim = User.FindFirst("roleId")?.Value;
        _ = int.TryParse(roleIdClaim, out var roleId);
        return (userId, roleId);
    }
}
