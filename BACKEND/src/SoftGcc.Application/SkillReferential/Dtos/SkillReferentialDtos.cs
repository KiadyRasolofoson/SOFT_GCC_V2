namespace SoftGcc.Application.SkillReferential.Dtos;

public sealed class SkillCatalogQuery
{
    public string? Q { get; set; }
    public string? Category { get; set; }
    public int? DomainId { get; set; }
    public int? FamilyId { get; set; }
    public string? State { get; set; }
}

public sealed class SkillCatalogNodeDto
{
    public int DomainId { get; set; }
    public string DomainCode { get; set; } = string.Empty;
    public string DomainName { get; set; } = string.Empty;
    public List<SkillFamilyNodeDto> Families { get; set; } = [];
}

public sealed class SkillFamilyNodeDto
{
    public int FamilyId { get; set; }
    public int DomainId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<SkillListItemDto> Skills { get; set; } = [];
}

public sealed class SkillListItemDto
{
    public int SkillId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public int FamilyId { get; set; }
    public string FamilyName { get; set; } = string.Empty;
    public int DomainId { get; set; }
    public string DomainName { get; set; } = string.Empty;
    public int CurrentVersion { get; set; }
}

public sealed class SkillLevelDescriptorDto
{
    public int Rank { get; set; }
    public string Label { get; set; } = string.Empty;
    public string BehavioralDefinition { get; set; } = string.Empty;
}

public sealed class SkillVersionDto
{
    public int SkillVersionId { get; set; }
    public int Version { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Definition { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

public sealed class LinkedPositionDto
{
    public int SkillPositionId { get; set; }
    public int PositionId { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public int ExpectedLevel { get; set; }
    public string RequirementKind { get; set; } = string.Empty;
    public decimal Weight { get; set; }
}

public sealed class SkillDetailDto
{
    public int SkillId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Definition { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int FamilyId { get; set; }
    public string FamilyName { get; set; } = string.Empty;
    public int DomainId { get; set; }
    public string DomainName { get; set; } = string.Empty;
    public int CurrentVersion { get; set; }
    public string State { get; set; } = string.Empty;
    public DateTime? PublishedAt { get; set; }
    public List<SkillLevelDescriptorDto> Descriptors { get; set; } = [];
    public List<SkillVersionDto> Versions { get; set; } = [];
    public List<LinkedPositionDto> Positions { get; set; } = [];
}

public sealed class SkillDraftDto
{
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Definition { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int FamilyId { get; set; }
    public List<SkillLevelDescriptorDto> Descriptors { get; set; } = [];
}

public sealed class TaxonomyItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public string State { get; set; } = string.Empty;
    public int? DomainId { get; set; }
    public string? DomainName { get; set; }
}

public sealed class DomainDraftDto
{
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public sealed class FamilyDraftDto
{
    public int DomainId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public sealed class SuggestedCodeDto
{
    public string Code { get; set; } = string.Empty;
}

public sealed class PositionSkillItemDto
{
    public int SkillPositionId { get; set; }
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string SkillCode { get; set; } = string.Empty;
    public int ExpectedLevel { get; set; }
    public string RequirementKind { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public int State { get; set; }
}

public sealed class PositionSkillUpsertDto
{
    public int SkillId { get; set; }
    public int ExpectedLevel { get; set; }
    public string RequirementKind { get; set; } = SoftGcc.Domain.SkillReferential.RequirementKind.Required;
    public decimal Weight { get; set; } = 1;
}

public sealed class EmployeeSkillGapDto
{
    public int? PositionId { get; set; }
    public string? PositionName { get; set; }
    public List<SkillGapResultDto> Items { get; set; } = [];
}

public sealed class SkillGapResultDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int ExpectedRank { get; set; }
    public int? AcquiredRank { get; set; }
    public string RequirementKind { get; set; } = string.Empty;
    public int? SkillVersionId { get; set; }
    public decimal Weight { get; set; }
    public bool Gap { get; set; }
    public string Status { get; set; } = string.Empty;
    public int DomainId { get; set; }
    public string DomainName { get; set; } = string.Empty;
}

public sealed class SkillLookupDto
{
    public int SkillId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int FamilyId { get; set; }
}
