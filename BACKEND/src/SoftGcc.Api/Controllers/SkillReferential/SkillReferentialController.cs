using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;

namespace SoftGcc.Api.Controllers.SkillReferential;

[Route("api/skill-referential")]
[ApiController]
[Authorize]
public sealed class SkillReferentialController : ControllerBase
{
    private readonly ISkillReferentialService _service;

    public SkillReferentialController(ISkillReferentialService service)
    {
        _service = service;
    }

    [HttpGet("catalog")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<SkillCatalogNodeDto>>> GetCatalog(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] int? domainId,
        [FromQuery] int? familyId,
        [FromQuery] string? state,
        CancellationToken cancellationToken)
    {
        var catalog = await _service.GetCatalogAsync(new SkillCatalogQuery
        {
            Q = q,
            Category = category,
            DomainId = domainId,
            FamilyId = familyId,
            State = state
        }, cancellationToken);
        return Ok(catalog);
    }

    [HttpGet("skills/{id:int}")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<SkillDetailDto>> GetSkill(int id, CancellationToken cancellationToken)
    {
        return Ok(await _service.GetSkillAsync(id, cancellationToken));
    }

    [HttpGet("skills/similar")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<SkillListItemDto>>> Similar(
        [FromQuery] string name,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.FindSimilarAsync(name, cancellationToken));
    }

    [HttpPost("skills")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<SkillDetailDto>> CreateDraft(
        [FromBody] SkillDraftDto draft,
        CancellationToken cancellationToken)
    {
        var created = await _service.CreateDraftAsync(draft, CurrentUserId(), cancellationToken);
        return CreatedAtAction(nameof(GetSkill), new { id = created.SkillId }, created);
    }

    [HttpPut("skills/{id:int}")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<SkillDetailDto>> UpdateDraft(
        int id,
        [FromBody] SkillDraftDto draft,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpdateDraftAsync(id, draft, CurrentUserId(), cancellationToken));
    }

    [HttpPost("skills/{id:int}/publish")]
    [RequirePermission("PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<SkillDetailDto>> Publish(int id, CancellationToken cancellationToken)
    {
        return Ok(await _service.PublishAsync(id, CurrentUserId(), cancellationToken));
    }

    [HttpPost("skills/{id:int}/archive")]
    [RequirePermission("PUBLISH_SKILL_REFERENTIAL")]
    public async Task<IActionResult> Archive(int id, CancellationToken cancellationToken)
    {
        await _service.ArchiveSkillAsync(id, CurrentUserId(), cancellationToken);
        return NoContent();
    }

    [HttpGet("suggested-code")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<SuggestedCodeDto>> SuggestCode(
        [FromQuery] string? kind,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.SuggestCodeAsync(kind, cancellationToken));
    }

    [HttpGet("domains")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<TaxonomyItemDto>>> GetDomains(CancellationToken cancellationToken)
    {
        return Ok(await _service.GetDomainsAsync(cancellationToken));
    }

    [HttpPost("domains")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<TaxonomyItemDto>> CreateDomain(
        [FromBody] DomainDraftDto draft,
        CancellationToken cancellationToken)
    {
        var created = await _service.CreateDomainAsync(draft, cancellationToken);
        return CreatedAtAction(nameof(GetDomains), created);
    }

    [HttpPut("domains/{id:int}")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<TaxonomyItemDto>> UpdateDomain(
        int id,
        [FromBody] DomainDraftDto draft,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpdateDomainAsync(id, draft, cancellationToken));
    }

    [HttpPost("domains/{id:int}/archive")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<IActionResult> ArchiveDomain(int id, CancellationToken cancellationToken)
    {
        await _service.ArchiveDomainAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("families")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<TaxonomyItemDto>>> GetFamilies(
        [FromQuery] int? domainId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetFamiliesAsync(domainId, cancellationToken));
    }

    [HttpPost("families")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<TaxonomyItemDto>> CreateFamily(
        [FromBody] FamilyDraftDto draft,
        CancellationToken cancellationToken)
    {
        var created = await _service.CreateFamilyAsync(draft, cancellationToken);
        return CreatedAtAction(nameof(GetFamilies), created);
    }

    [HttpPut("families/{id:int}")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<TaxonomyItemDto>> UpdateFamily(
        int id,
        [FromBody] FamilyDraftDto draft,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpdateFamilyAsync(id, draft, cancellationToken));
    }

    [HttpPost("families/{id:int}/archive")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<IActionResult> ArchiveFamily(int id, CancellationToken cancellationToken)
    {
        await _service.ArchiveFamilyAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("positions/{positionId:int}/skills")]
    [RequirePermission("VIEW_SKILL_SETTINGS", "MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<PositionSkillItemDto>>> GetPositionSkills(
        int positionId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetPositionSkillsAsync(positionId, cancellationToken));
    }

    [HttpPut("positions/{positionId:int}/skills")]
    [RequirePermission("MANAGE_SKILL_SETTINGS", "PUBLISH_SKILL_REFERENTIAL")]
    public async Task<ActionResult<IReadOnlyList<PositionSkillItemDto>>> UpsertPositionSkills(
        int positionId,
        [FromBody] List<PositionSkillUpsertDto> items,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.UpsertPositionSkillsAsync(positionId, items, cancellationToken));
    }

    [HttpGet("employees/{employeeId:int}/gaps")]
    [RequirePermission(
        "VIEW_SKILL_SETTINGS",
        "MANAGE_SKILL_SETTINGS",
        "PUBLISH_SKILL_REFERENTIAL",
        "VIEW_SKILLS_PROFILES",
        "MANAGE_SKILLS_PROFILES",
        "VIEW_WISH_EVOLUTION",
        "MANAGE_WISH_EVOLUTION")]
    public async Task<ActionResult<EmployeeSkillGapDto>> GetGaps(
        int employeeId,
        [FromQuery] int? positionId,
        CancellationToken cancellationToken)
    {
        return Ok(await _service.GetEmployeeGapsAsync(employeeId, positionId, cancellationToken));
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirst("userId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
}
