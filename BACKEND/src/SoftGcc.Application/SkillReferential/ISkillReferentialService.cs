using SoftGcc.Application.Positions.Dtos;
using SoftGcc.Application.SkillReferential.Dtos;

namespace SoftGcc.Application.SkillReferential;

public interface ISkillReferentialService
{
    Task<IReadOnlyList<SkillCatalogNodeDto>> GetCatalogAsync(SkillCatalogQuery query, CancellationToken cancellationToken = default);
    Task<SkillDetailDto> GetSkillAsync(int skillId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SkillListItemDto>> FindSimilarAsync(string name, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SkillLookupDto>> GetActiveLookupsAsync(CancellationToken cancellationToken = default);

    Task<SkillDetailDto> CreateDraftAsync(SkillDraftDto draft, int? userId, CancellationToken cancellationToken = default);
    Task<SkillDetailDto> UpdateDraftAsync(int skillId, SkillDraftDto draft, int? userId, CancellationToken cancellationToken = default);
    Task<SkillDetailDto> PublishAsync(int skillId, int? userId, CancellationToken cancellationToken = default);
    Task ArchiveSkillAsync(int skillId, int? userId, CancellationToken cancellationToken = default);

    Task<SuggestedCodeDto> SuggestCodeAsync(string? kind, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaxonomyItemDto>> GetDomainsAsync(CancellationToken cancellationToken = default);
    Task<TaxonomyItemDto> CreateDomainAsync(DomainDraftDto draft, CancellationToken cancellationToken = default);
    Task<TaxonomyItemDto> UpdateDomainAsync(int domainId, DomainDraftDto draft, CancellationToken cancellationToken = default);
    Task ArchiveDomainAsync(int domainId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaxonomyItemDto>> GetFamiliesAsync(int? domainId, CancellationToken cancellationToken = default);
    Task<TaxonomyItemDto> CreateFamilyAsync(FamilyDraftDto draft, CancellationToken cancellationToken = default);
    Task<TaxonomyItemDto> UpdateFamilyAsync(int familyId, FamilyDraftDto draft, CancellationToken cancellationToken = default);
    Task ArchiveFamilyAsync(int familyId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PositionSkillItemDto>> GetPositionSkillsAsync(int positionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PositionSkillItemDto>> UpsertPositionSkillsAsync(int positionId, IReadOnlyList<PositionSkillUpsertDto> items, CancellationToken cancellationToken = default);

    /// <summary>Fiche poste : identité + matrice (niveaux attendus 1-4, criticité, poids) — source unique <c>Skill_position</c>.</summary>
    Task<PositionDetailDto> GetPositionDetailAsync(int positionId, CancellationToken cancellationToken = default);

    Task<EmployeeSkillGapDto> GetEmployeeGapsAsync(int employeeId, int? positionId, CancellationToken cancellationToken = default);
    Task<double> GetCoverageRatioAsync(CancellationToken cancellationToken = default);

    Task NormalizeEmployeeSkillAsync(EmployeeSkillWriteRequest request, CancellationToken cancellationToken = default);
}

public sealed class EmployeeSkillWriteRequest
{
    public int SkillId { get; set; }
    public int? AcquiredLevel { get; set; }
    public double? LegacyPercent { get; set; }
    public int DomainSkillId { get; set; }
    public string? Source { get; set; }

    public int ResolvedDomainSkillId { get; set; }
    public int? ResolvedAcquiredLevel { get; set; }
    public int? ResolvedSkillVersionId { get; set; }
    public string ResolvedSource { get; set; } = string.Empty;
}
