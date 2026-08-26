using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Positions.Dtos;
using SoftGcc.Application.SkillReferential.Dtos;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Application.SkillReferential;

public sealed class SkillReferentialService : ISkillReferentialService
{
    private readonly IApplicationDbContext _db;
    private readonly IHistoryService _history;

    public SkillReferentialService(IApplicationDbContext db, IHistoryService history)
    {
        _db = db;
        _history = history;
    }

    public async Task<IReadOnlyList<SkillCatalogNodeDto>> GetCatalogAsync(
        SkillCatalogQuery query,
        CancellationToken cancellationToken = default)
    {
        var skillsQuery = _db.Skill
            .AsNoTracking()
            .Include(s => s.Family)
            .ThenInclude(f => f.Domain)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.State))
        {
            skillsQuery = skillsQuery.Where(s => s.State == query.State);
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            skillsQuery = skillsQuery.Where(s => s.Category == query.Category);
        }

        if (query.DomainId is > 0)
        {
            skillsQuery = skillsQuery.Where(s => s.Family.DomainSkillId == query.DomainId);
        }

        if (query.FamilyId is > 0)
        {
            skillsQuery = skillsQuery.Where(s => s.FamilyId == query.FamilyId);
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var needle = query.Q.Trim();
            skillsQuery = skillsQuery.Where(s =>
                (s.Name != null && s.Name.Contains(needle))
                || s.Code.Contains(needle)
                || s.Definition.Contains(needle));
        }

        var skills = await skillsQuery
            .OrderBy(s => s.Family.Domain.SortOrder)
            .ThenBy(s => s.Family.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return skills
            .GroupBy(s => new
            {
                s.Family.DomainSkillId,
                DomainCode = s.Family.Domain.Code,
                DomainName = s.Family.Domain.Name ?? string.Empty
            })
            .Select(domain => new SkillCatalogNodeDto
            {
                DomainId = domain.Key.DomainSkillId,
                DomainCode = domain.Key.DomainCode,
                DomainName = domain.Key.DomainName,
                Families = domain
                    .GroupBy(s => new { s.FamilyId, s.Family.Code, s.Family.Name })
                    .Select(family => new SkillFamilyNodeDto
                    {
                        FamilyId = family.Key.FamilyId,
                        DomainId = domain.Key.DomainSkillId,
                        Code = family.Key.Code,
                        Name = family.Key.Name,
                        Skills = family.Select(MapListItem).ToList()
                    })
                    .ToList()
            })
            .ToList();
    }

    public async Task<SkillDetailDto> GetSkillAsync(int skillId, CancellationToken cancellationToken = default)
    {
        var skill = await LoadSkillGraph(skillId, cancellationToken)
            ?? throw new NotFoundException("Compétence", skillId);
        return MapDetail(skill);
    }

    public async Task<IReadOnlyList<SkillListItemDto>> FindSimilarAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 3)
        {
            return [];
        }

        var needle = name.Trim();
        var skills = await _db.Skill
            .AsNoTracking()
            .Include(s => s.Family)
            .ThenInclude(f => f.Domain)
            .Where(s => s.State != SkillLifecycle.Archived && s.Name != null && s.Name.Contains(needle))
            .OrderBy(s => s.Name)
            .Take(8)
            .ToListAsync(cancellationToken);

        return skills.Select(MapListItem).ToList();
    }

    public async Task<IReadOnlyList<SkillLookupDto>> GetActiveLookupsAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Skill
            .AsNoTracking()
            .Where(s => s.State == SkillLifecycle.Active)
            .OrderBy(s => s.Name)
            .Select(s => new SkillLookupDto
            {
                SkillId = s.SkillId,
                Name = s.Name ?? string.Empty,
                Code = s.Code,
                FamilyId = s.FamilyId
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillDetailDto> CreateDraftAsync(
        SkillDraftDto draft,
        int? userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureFamilyActive(draft.FamilyId, cancellationToken);
        EnsureCategory(draft.Category);

        var now = DateTime.UtcNow;
        var skill = new Skill
        {
            Name = RequireName(draft.Name),
            Definition = draft.Definition?.Trim() ?? string.Empty,
            Category = draft.Category,
            FamilyId = draft.FamilyId,
            CurrentVersion = 1,
            State = SkillLifecycle.Draft,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedByUserId = userId,
            Code = await AllocateSkillCodeAsync(draft.Code, cancellationToken)
        };

        _db.Skill.Add(skill);
        await _db.SaveChangesAsync(cancellationToken);

        ReplaceDescriptors(skill, 1, draft.Descriptors);
        await _db.SaveChangesAsync(cancellationToken);

        return MapDetail(await LoadSkillGraph(skill.SkillId, cancellationToken) ?? skill);
    }

    public async Task<SkillDetailDto> UpdateDraftAsync(
        int skillId,
        SkillDraftDto draft,
        int? userId,
        CancellationToken cancellationToken = default)
    {
        var skill = await LoadSkillGraph(skillId, cancellationToken)
            ?? throw new NotFoundException("Compétence", skillId);

        if (SkillLifecycle.IsArchived(skill.State))
        {
            throw new ConflictException("Une compétence archivée ne peut plus être modifiée.");
        }

        await EnsureFamilyActive(draft.FamilyId, cancellationToken);
        EnsureCategory(draft.Category);

        skill.Name = RequireName(draft.Name);
        skill.Definition = draft.Definition?.Trim() ?? string.Empty;
        skill.Category = draft.Category;
        skill.FamilyId = draft.FamilyId;
        skill.UpdatedAt = DateTime.UtcNow;

        ReplaceDescriptors(skill, skill.CurrentVersion, draft.Descriptors);
        await _db.SaveChangesAsync(cancellationToken);
        _ = userId;

        return MapDetail(await LoadSkillGraph(skillId, cancellationToken) ?? skill);
    }

    public async Task<SkillDetailDto> PublishAsync(
        int skillId,
        int? userId,
        CancellationToken cancellationToken = default)
    {
        var skill = await LoadSkillGraph(skillId, cancellationToken)
            ?? throw new NotFoundException("Compétence", skillId);

        if (SkillLifecycle.IsArchived(skill.State))
        {
            throw new ConflictException("Impossible de publier une compétence archivée.");
        }

        var descriptors = skill.LevelDescriptors
            .Where(d => d.Version == skill.CurrentVersion)
            .Select(d => (d.Rank, (string?)d.BehavioralDefinition))
            .ToList();

        var nameTaken = await _db.Skill.AnyAsync(
            s => s.SkillId != skill.SkillId
                 && s.State == SkillLifecycle.Active
                 && s.Name == skill.Name,
            cancellationToken);

        SkillPublishValidator.EnsureCanPublish(skill.Definition, skill.Name, descriptors, nameTaken);

        var now = DateTime.UtcNow;
        var wasActive = SkillLifecycle.IsActive(skill.State);
        var meaningChanged = wasActive && await MeaningChangedSinceLastPublish(skill, cancellationToken);

        if (!wasActive || meaningChanged)
        {
            if (meaningChanged)
            {
                var previous = await _db.SkillVersion
                    .Where(v => v.SkillId == skill.SkillId && v.ValidTo == null)
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefaultAsync(cancellationToken);
                if (previous != null)
                {
                    previous.ValidTo = now;
                }

                var previousVersion = skill.CurrentVersion;
                skill.CurrentVersion += 1;
                ReplaceDescriptors(skill, skill.CurrentVersion, skill.LevelDescriptors
                    .Where(d => d.Version == previousVersion)
                    .Select(d => new SkillLevelDescriptorDto
                    {
                        Rank = d.Rank,
                        Label = d.Label,
                        BehavioralDefinition = d.BehavioralDefinition
                    })
                    .ToList());
            }

            _db.SkillVersion.Add(new SkillVersion
            {
                SkillId = skill.SkillId,
                Version = skill.CurrentVersion,
                Name = skill.Name ?? string.Empty,
                Definition = skill.Definition,
                Category = skill.Category,
                ValidFrom = now,
                PublishedAt = now,
                PublishedByUserId = userId
            });
        }

        skill.State = SkillLifecycle.Active;
        skill.PublishedAt = now;
        skill.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);
        await LogAsync(userId, "Publication",
            $"Publication de la compétence {skill.Code} (version {skill.CurrentVersion}).");

        return MapDetail(await LoadSkillGraph(skillId, cancellationToken) ?? skill);
    }

    public async Task ArchiveSkillAsync(int skillId, int? userId, CancellationToken cancellationToken = default)
    {
        var skill = await _db.Skill.FirstOrDefaultAsync(s => s.SkillId == skillId, cancellationToken)
            ?? throw new NotFoundException("Compétence", skillId);

        skill.State = SkillLifecycle.Archived;
        skill.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        await LogAsync(userId, "Archivage", $"Archivage de la compétence {skill.Code}.");
    }

    public async Task<IReadOnlyList<TaxonomyItemDto>> GetDomainsAsync(CancellationToken cancellationToken = default)
    {
        return await _db.DomainSkill
            .AsNoTracking()
            .OrderBy(d => d.SortOrder)
            .ThenBy(d => d.Name)
            .Select(d => new TaxonomyItemDto
            {
                Id = d.DomainSkillId,
                Code = d.Code,
                Name = d.Name ?? string.Empty,
                Description = d.Description,
                SortOrder = d.SortOrder,
                State = d.State
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SuggestedCodeDto> SuggestCodeAsync(
        string? kind,
        CancellationToken cancellationToken = default)
    {
        var code = await AllocateSuggestedCodeAsync(kind, cancellationToken);
        return new SuggestedCodeDto { Code = code };
    }

    public async Task<TaxonomyItemDto> CreateDomainAsync(DomainDraftDto draft, CancellationToken cancellationToken = default)
    {
        var code = await AllocateDomainCodeAsync(draft.Code, cancellationToken);
        await EnsureUniqueDomainCode(code, null, cancellationToken);
        var entity = new DomainSkill
        {
            Code = code,
            Name = RequireName(draft.Name),
            Description = draft.Description,
            SortOrder = draft.SortOrder,
            State = SkillLifecycle.Active
        };
        _db.DomainSkill.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return MapDomain(entity);
    }

    public async Task<TaxonomyItemDto> UpdateDomainAsync(
        int domainId,
        DomainDraftDto draft,
        CancellationToken cancellationToken = default)
    {
        var entity = await _db.DomainSkill.FirstOrDefaultAsync(d => d.DomainSkillId == domainId, cancellationToken)
            ?? throw new NotFoundException("Domaine", domainId);
        if (!string.IsNullOrWhiteSpace(draft.Code)
            && !string.Equals(entity.Code, draft.Code, StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException("Le code d'un domaine est immuable.");
        }

        entity.Name = RequireName(draft.Name);
        entity.Description = draft.Description;
        entity.SortOrder = draft.SortOrder;
        await _db.SaveChangesAsync(cancellationToken);
        return MapDomain(entity);
    }

    public async Task ArchiveDomainAsync(int domainId, CancellationToken cancellationToken = default)
    {
        var hasActiveChildren = await _db.SkillFamily.AnyAsync(
            f => f.DomainSkillId == domainId && f.State != SkillLifecycle.Archived,
            cancellationToken);
        if (hasActiveChildren)
        {
            throw new ConflictException("Impossible d'archiver un domaine qui contient des familles actives.");
        }

        var entity = await _db.DomainSkill.FirstOrDefaultAsync(d => d.DomainSkillId == domainId, cancellationToken)
            ?? throw new NotFoundException("Domaine", domainId);
        entity.State = SkillLifecycle.Archived;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TaxonomyItemDto>> GetFamiliesAsync(
        int? domainId,
        CancellationToken cancellationToken = default)
    {
        var query = _db.SkillFamily.AsNoTracking().Include(f => f.Domain).AsQueryable();
        if (domainId is > 0)
        {
            query = query.Where(f => f.DomainSkillId == domainId);
        }

        return await query
            .OrderBy(f => f.SortOrder)
            .ThenBy(f => f.Name)
            .Select(f => new TaxonomyItemDto
            {
                Id = f.FamilyId,
                Code = f.Code,
                Name = f.Name,
                Description = f.Description,
                SortOrder = f.SortOrder,
                State = f.State,
                DomainId = f.DomainSkillId,
                DomainName = f.Domain.Name
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<TaxonomyItemDto> CreateFamilyAsync(FamilyDraftDto draft, CancellationToken cancellationToken = default)
    {
        await EnsureFamilyDomain(draft.DomainId, cancellationToken);
        var code = await AllocateFamilyCodeAsync(draft.Code, cancellationToken);
        await EnsureUniqueFamilyCode(code, null, cancellationToken);
        var entity = new SkillFamily
        {
            DomainSkillId = draft.DomainId,
            Code = code,
            Name = RequireName(draft.Name),
            Description = draft.Description,
            SortOrder = draft.SortOrder,
            State = SkillLifecycle.Active
        };
        _db.SkillFamily.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return await GetFamilyDto(entity.FamilyId, cancellationToken);
    }

    public async Task<TaxonomyItemDto> UpdateFamilyAsync(
        int familyId,
        FamilyDraftDto draft,
        CancellationToken cancellationToken = default)
    {
        var entity = await _db.SkillFamily.FirstOrDefaultAsync(f => f.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException("Famille", familyId);
        if (!string.IsNullOrWhiteSpace(draft.Code)
            && !string.Equals(entity.Code, draft.Code, StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException("Le code d'une famille est immuable.");
        }

        await EnsureFamilyDomain(draft.DomainId, cancellationToken);
        entity.DomainSkillId = draft.DomainId;
        entity.Name = RequireName(draft.Name);
        entity.Description = draft.Description;
        entity.SortOrder = draft.SortOrder;
        await _db.SaveChangesAsync(cancellationToken);
        return await GetFamilyDto(familyId, cancellationToken);
    }

    public async Task ArchiveFamilyAsync(int familyId, CancellationToken cancellationToken = default)
    {
        var hasActiveChildren = await _db.Skill.AnyAsync(
            s => s.FamilyId == familyId && s.State != SkillLifecycle.Archived,
            cancellationToken);
        if (hasActiveChildren)
        {
            throw new ConflictException("Impossible d'archiver une famille qui contient des compétences actives ou en brouillon.");
        }

        var entity = await _db.SkillFamily.FirstOrDefaultAsync(f => f.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException("Famille", familyId);
        entity.State = SkillLifecycle.Archived;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<PositionDetailDto> GetPositionDetailAsync(
        int positionId,
        CancellationToken cancellationToken = default)
    {
        var position = await _db.Position
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PositionId == positionId, cancellationToken)
            ?? throw new NotFoundException("Poste", positionId);

        string? departmentName = null;
        if (position.DepartmentId is int departmentId)
        {
            departmentName = await _db.Department
                .AsNoTracking()
                .Where(d => d.DepartmentId == departmentId)
                .Select(d => d.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var skills = await GetPositionSkillsAsync(positionId, cancellationToken);

        return new PositionDetailDto
        {
            PositionId = position.PositionId,
            PositionName = position.PositionName,
            DepartmentId = position.DepartmentId,
            DepartmentName = departmentName,
            ProfessionalCategoryId = position.ProfessionalCategoryId,
            LegalClassId = position.LegalClassId,
            Skills = skills.ToList()
        };
    }

    public async Task<IReadOnlyList<PositionSkillItemDto>> GetPositionSkillsAsync(
        int positionId,
        CancellationToken cancellationToken = default)
    {
        var positionExists = await _db.Position.AnyAsync(p => p.PositionId == positionId, cancellationToken);
        if (!positionExists)
        {
            throw new NotFoundException("Poste", positionId);
        }

        var rows = await _db.SkillPosition
            .AsNoTracking()
            .Include(sp => sp.Skill)
            .Where(sp => sp.PositionId == positionId && sp.State > 0)
            .OrderBy(sp => sp.Skill.Name)
            .ToListAsync(cancellationToken);
        return rows.Select(MapPositionSkill).ToList();
    }

    public async Task<IReadOnlyList<PositionSkillItemDto>> UpsertPositionSkillsAsync(
        int positionId,
        IReadOnlyList<PositionSkillUpsertDto> items,
        CancellationToken cancellationToken = default)
    {
        var positionExists = await _db.Position.AnyAsync(p => p.PositionId == positionId, cancellationToken);
        if (!positionExists)
        {
            throw new NotFoundException("Poste", positionId);
        }

        var existing = await _db.SkillPosition
            .Where(sp => sp.PositionId == positionId)
            .ToListAsync(cancellationToken);

        var keptSkillIds = items.Select(i => i.SkillId).ToHashSet();
        foreach (var row in existing.Where(sp => sp.State > 0 && !keptSkillIds.Contains(sp.SkillId)))
        {
            row.State = 0;
            row.UpdatedDate = DateTime.UtcNow;
        }

        foreach (var item in items)
        {
            CompetencyScale.EnsureValid(item.ExpectedLevel, nameof(item.ExpectedLevel));
            if (!RequirementKind.IsValid(item.RequirementKind))
            {
                throw new ValidationException("RequirementKind invalide (Critical, Required ou Desired).");
            }

            var skillExists = await _db.Skill.AnyAsync(s => s.SkillId == item.SkillId, cancellationToken);
            if (!skillExists)
            {
                throw new NotFoundException("Compétence", item.SkillId);
            }

            var row = existing.FirstOrDefault(sp => sp.SkillId == item.SkillId);
            if (row == null)
            {
                row = new SkillPosition
                {
                    PositionId = positionId,
                    SkillId = item.SkillId,
                    CreationDate = DateTime.UtcNow
                };
                _db.SkillPosition.Add(row);
                existing.Add(row);
            }

            row.ExpectedLevel = item.ExpectedLevel;
            row.RequirementKind = item.RequirementKind;
            row.Weight = item.Weight <= 0 ? 1 : item.Weight;
            row.State = 1;
            row.UpdatedDate = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await GetPositionSkillsAsync(positionId, cancellationToken);
    }

    public async Task<EmployeeSkillGapDto> GetEmployeeGapsAsync(
        int employeeId,
        int? positionId,
        CancellationToken cancellationToken = default)
    {
        var resolvedPositionId = positionId ?? await ResolveCurrentPositionId(employeeId, cancellationToken);
        if (resolvedPositionId is null)
        {
            return new EmployeeSkillGapDto { Items = [] };
        }

        var positionName = await _db.Position
            .AsNoTracking()
            .Where(p => p.PositionId == resolvedPositionId)
            .Select(p => p.PositionName)
            .FirstOrDefaultAsync(cancellationToken);

        var matrix = await _db.SkillPosition
            .AsNoTracking()
            .Include(sp => sp.Skill)
            .ThenInclude(s => s.Family)
            .ThenInclude(f => f.Domain)
            .Where(sp => sp.PositionId == resolvedPositionId && sp.State > 0)
            .ToListAsync(cancellationToken);

        var acquired = await _db.EmployeeSkill
            .AsNoTracking()
            .Where(es => es.EmployeeId == employeeId)
            .ToListAsync(cancellationToken);
        var acquiredBySkill = acquired
            .GroupBy(es => es.SkillId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(es => es.UpdateDate).First());

        var rows = matrix.Select(sp =>
        {
            acquiredBySkill.TryGetValue(sp.SkillId, out var employeeSkill);
            return new SkillGapRow(
                sp.SkillId,
                sp.Skill.Name ?? string.Empty,
                sp.ExpectedLevel,
                employeeSkill?.AcquiredLevel,
                sp.RequirementKind,
                employeeSkill?.SkillVersionId,
                (double)sp.Weight,
                sp.Skill.Family?.DomainSkillId ?? 0,
                sp.Skill.Family?.Domain?.Name ?? "Non classé");
        });

        var results = SkillGapCalculator.ComputeAll(rows);
        return new EmployeeSkillGapDto
        {
            PositionId = resolvedPositionId,
            PositionName = positionName,
            Items = results.Select(r => new SkillGapResultDto
            {
                SkillId = r.SkillId,
                SkillName = r.SkillName,
                ExpectedRank = r.ExpectedRank,
                AcquiredRank = r.AcquiredRank,
                RequirementKind = r.RequirementKind,
                SkillVersionId = r.SkillVersionId,
                Weight = (decimal)r.Weight,
                Gap = r.Gap,
                Status = r.Status,
                DomainId = r.DomainId,
                DomainName = r.DomainName
            }).ToList()
        };
    }

    public async Task<double> GetCoverageRatioAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var matrix = await _db.SkillPosition
            .AsNoTracking()
            .Where(sp => sp.State > 0 && RequirementKind.CountsForCoverage(sp.RequirementKind))
            .Select(sp => new { sp.PositionId, sp.SkillId, sp.ExpectedLevel })
            .ToListAsync(cancellationToken);

        if (matrix.Count == 0)
        {
            return 0;
        }

        var incumbents = await (
            from plan in _db.CareerPlan.AsNoTracking()
            join employee in _db.Employee.AsNoTracking()
                on plan.RegistrationNumber equals employee.RegistrationNumber
            where plan.AssignmentTypeId == 1
                  && plan.State > 0
                  && (plan.EndDate == null || plan.EndDate > now)
                  && plan.PositionId != null
            select new { EmployeeId = employee.EmployeeId, PositionId = plan.PositionId!.Value }
        ).ToListAsync(cancellationToken);

        var incumbentsByPosition = incumbents
            .GroupBy(row => row.PositionId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.EmployeeId).Distinct().ToList());

        var employeeIds = incumbents.Select(i => i.EmployeeId).Distinct().ToList();
        var acquired = await _db.EmployeeSkill
            .AsNoTracking()
            .Where(es => employeeIds.Contains(es.EmployeeId))
            .Select(es => new { es.EmployeeId, es.SkillId, es.AcquiredLevel })
            .ToListAsync(cancellationToken);
        var acquiredLookup = acquired
            .GroupBy(a => (a.EmployeeId, a.SkillId))
            .ToDictionary(g => g.Key, g => g.First().AcquiredLevel);

        var pairs = 0;
        var covered = 0;
        foreach (var requirement in matrix)
        {
            if (!incumbentsByPosition.TryGetValue(requirement.PositionId, out var holders) || holders.Count == 0)
            {
                continue;
            }

            foreach (var holderId in holders)
            {
                pairs++;
                acquiredLookup.TryGetValue((holderId, requirement.SkillId), out var level);
                if (level >= requirement.ExpectedLevel)
                {
                    covered++;
                }
            }
        }

        if (pairs == 0)
        {
            return 0;
        }

        return Math.Round(100.0 * covered / pairs, 2);
    }

    public async Task NormalizeEmployeeSkillAsync(
        EmployeeSkillWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var skill = await _db.Skill
            .Include(s => s.Family)
            .FirstOrDefaultAsync(s => s.SkillId == request.SkillId, cancellationToken)
            ?? throw new NotFoundException("Compétence", request.SkillId);

        var acquired = request.AcquiredLevel;
        if (acquired is null && request.LegacyPercent is > 0)
        {
            acquired = CompetencyScale.FromLegacyPercent(request.LegacyPercent.Value);
        }

        if (acquired is not null)
        {
            CompetencyScale.EnsureValid(acquired.Value, nameof(request.AcquiredLevel));
        }

        var currentVersionId = await _db.SkillVersion
            .Where(v => v.SkillId == skill.SkillId && v.ValidTo == null)
            .OrderByDescending(v => v.Version)
            .Select(v => (int?)v.SkillVersionId)
            .FirstOrDefaultAsync(cancellationToken);

        request.ResolvedDomainSkillId = skill.Family.DomainSkillId;
        request.ResolvedAcquiredLevel = acquired;
        request.ResolvedSkillVersionId = currentVersionId;
        request.ResolvedSource = string.IsNullOrWhiteSpace(request.Source)
            ? EmployeeSkillSource.Manual
            : request.Source;
    }

    private async Task<int?> ResolveCurrentPositionId(int employeeId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await (
            from plan in _db.CareerPlan.AsNoTracking()
            join employee in _db.Employee.AsNoTracking()
                on plan.RegistrationNumber equals employee.RegistrationNumber
            where employee.EmployeeId == employeeId
                  && plan.AssignmentTypeId == 1
                  && plan.State > 0
                  && (plan.EndDate == null || plan.EndDate > now)
                  && plan.PositionId != null
            orderby plan.StartDate descending
            select plan.PositionId
        ).FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Skill?> LoadSkillGraph(int skillId, CancellationToken cancellationToken)
    {
        return await _db.Skill
            .Include(s => s.Family)
            .ThenInclude(f => f.Domain)
            .Include(s => s.LevelDescriptors)
            .Include(s => s.Versions)
            .Include(s => s.SkillPositions)
            .ThenInclude(sp => sp.Position)
            .FirstOrDefaultAsync(s => s.SkillId == skillId, cancellationToken);
    }

    private void ReplaceDescriptors(Skill skill, int version, IReadOnlyList<SkillLevelDescriptorDto> descriptors)
    {
        var existing = skill.LevelDescriptors.Where(d => d.Version == version).ToList();
        foreach (var row in existing)
        {
            _db.SkillLevelDescriptor.Remove(row);
            skill.LevelDescriptors.Remove(row);
        }

        foreach (var descriptor in descriptors)
        {
            if (!CompetencyScale.IsValid(descriptor.Rank))
            {
                continue;
            }

            skill.LevelDescriptors.Add(new SkillLevelDescriptor
            {
                SkillId = skill.SkillId,
                Version = version,
                Rank = descriptor.Rank,
                Label = string.IsNullOrWhiteSpace(descriptor.Label)
                    ? CompetencyScale.Label(descriptor.Rank)
                    : descriptor.Label.Trim(),
                BehavioralDefinition = descriptor.BehavioralDefinition?.Trim() ?? string.Empty
            });
        }
    }

    private async Task<bool> MeaningChangedSinceLastPublish(Skill skill, CancellationToken cancellationToken)
    {
        var last = await _db.SkillVersion
            .AsNoTracking()
            .Where(v => v.SkillId == skill.SkillId)
            .OrderByDescending(v => v.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (last == null)
        {
            return false;
        }

        if (!string.Equals(last.Definition, skill.Definition, StringComparison.Ordinal)
            || !string.Equals(last.Category, skill.Category, StringComparison.Ordinal))
        {
            return true;
        }

        var lastDescriptors = await _db.SkillLevelDescriptor
            .AsNoTracking()
            .Where(d => d.SkillId == skill.SkillId && d.Version == last.Version)
            .OrderBy(d => d.Rank)
            .ToListAsync(cancellationToken);
        var current = skill.LevelDescriptors
            .Where(d => d.Version == skill.CurrentVersion)
            .OrderBy(d => d.Rank)
            .ToList();
        if (lastDescriptors.Count != current.Count)
        {
            return true;
        }

        return lastDescriptors.Zip(current, (a, b) =>
            a.Rank != b.Rank
            || !string.Equals(a.BehavioralDefinition, b.BehavioralDefinition, StringComparison.Ordinal)
            || !string.Equals(a.Label, b.Label, StringComparison.Ordinal)).Any(changed => changed);
    }

    private async Task<string> AllocateSkillCodeAsync(string? requested, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            var code = RequireCode(requested);
            if (await _db.Skill.AnyAsync(s => s.Code == code, cancellationToken))
            {
                throw new ConflictException("Ce code de compétence existe déjà.");
            }

            return code;
        }

        return await AllocateSuggestedCodeAsync("skill", cancellationToken);
    }

    private async Task<string> AllocateDomainCodeAsync(string? requested, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            return RequireCode(requested);
        }

        return await AllocateSuggestedCodeAsync("domain", cancellationToken);
    }

    private async Task<string> AllocateFamilyCodeAsync(string? requested, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            return RequireCode(requested);
        }

        return await AllocateSuggestedCodeAsync("family", cancellationToken);
    }

    private async Task<string> AllocateSuggestedCodeAsync(string? kind, CancellationToken cancellationToken)
    {
        switch ((kind ?? string.Empty).Trim().ToLowerInvariant())
        {
            case "domain":
            {
                var codes = await _db.DomainSkill.Select(d => d.Code).ToListAsync(cancellationToken);
                return ReferentialCode.Suggest(codes, ReferentialCode.DomainPrefix);
            }
            case "family":
            {
                var codes = await _db.SkillFamily.Select(f => f.Code).ToListAsync(cancellationToken);
                return ReferentialCode.Suggest(codes, ReferentialCode.FamilyPrefix);
            }
            case "skill":
            {
                var codes = await _db.Skill.Select(s => s.Code).ToListAsync(cancellationToken);
                return ReferentialCode.Suggest(codes, ReferentialCode.SkillPrefix);
            }
            default:
                throw new ValidationException("Type de code inconnu (domain, family, skill).");
        }
    }

    private async Task EnsureFamilyActive(int familyId, CancellationToken cancellationToken)
    {
        var family = await _db.SkillFamily.FirstOrDefaultAsync(f => f.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException("Famille", familyId);
        if (SkillLifecycle.IsArchived(family.State))
        {
            throw new ValidationException("La famille choisie est archivée.");
        }
    }

    private async Task EnsureFamilyDomain(int domainId, CancellationToken cancellationToken)
    {
        var domain = await _db.DomainSkill.FirstOrDefaultAsync(d => d.DomainSkillId == domainId, cancellationToken)
            ?? throw new NotFoundException("Domaine", domainId);
        if (SkillLifecycle.IsArchived(domain.State))
        {
            throw new ValidationException("Le domaine choisi est archivé.");
        }
    }

    private async Task EnsureUniqueDomainCode(string code, int? exceptId, CancellationToken cancellationToken)
    {
        var normalized = RequireCode(code);
        var taken = await _db.DomainSkill.AnyAsync(
            d => d.Code == normalized && (exceptId == null || d.DomainSkillId != exceptId),
            cancellationToken);
        if (taken)
        {
            throw new ConflictException("Ce code de domaine existe déjà.");
        }
    }

    private async Task EnsureUniqueFamilyCode(string code, int? exceptId, CancellationToken cancellationToken)
    {
        var normalized = RequireCode(code);
        var taken = await _db.SkillFamily.AnyAsync(
            f => f.Code == normalized && (exceptId == null || f.FamilyId != exceptId),
            cancellationToken);
        if (taken)
        {
            throw new ConflictException("Ce code de famille existe déjà.");
        }
    }

    private static void EnsureCategory(string category)
    {
        if (!SkillCategory.IsValid(category))
        {
            throw new ValidationException("Catégorie invalide (Technical, Behavioral, Managerial, Transversal).");
        }
    }

    private static string RequireName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException("Le nom est obligatoire.");
        }

        return name.Trim();
    }

    private static string RequireCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ValidationException("Le code est obligatoire.");
        }

        return code.Trim().ToUpperInvariant();
    }

    private async Task<TaxonomyItemDto> GetFamilyDto(int familyId, CancellationToken cancellationToken)
    {
        var family = await _db.SkillFamily
            .Include(f => f.Domain)
            .FirstAsync(f => f.FamilyId == familyId, cancellationToken);
        return new TaxonomyItemDto
        {
            Id = family.FamilyId,
            Code = family.Code,
            Name = family.Name,
            Description = family.Description,
            SortOrder = family.SortOrder,
            State = family.State,
            DomainId = family.DomainSkillId,
            DomainName = family.Domain.Name
        };
    }

    private async Task LogAsync(int? userId, string action, string description)
    {
        if (userId is null or <= 0)
        {
            return;
        }

        await _history.Add(new ActivityLog
        {
            UserId = userId.Value,
            Module = 1,
            Action = action,
            Description = description,
            Timestamp = DateTime.UtcNow,
            Metadata = "skill-referential"
        });
    }

    private static SkillListItemDto MapListItem(Skill skill) => new()
    {
        SkillId = skill.SkillId,
        Code = skill.Code,
        Name = skill.Name ?? string.Empty,
        Category = skill.Category,
        State = skill.State,
        FamilyId = skill.FamilyId,
        FamilyName = skill.Family.Name,
        DomainId = skill.Family.DomainSkillId,
        DomainName = skill.Family.Domain.Name ?? string.Empty,
        CurrentVersion = skill.CurrentVersion
    };

    private static SkillDetailDto MapDetail(Skill skill) => new()
    {
        SkillId = skill.SkillId,
        Code = skill.Code,
        Name = skill.Name ?? string.Empty,
        Definition = skill.Definition,
        Category = skill.Category,
        FamilyId = skill.FamilyId,
        FamilyName = skill.Family?.Name ?? string.Empty,
        DomainId = skill.Family?.DomainSkillId ?? 0,
        DomainName = skill.Family?.Domain?.Name ?? string.Empty,
        CurrentVersion = skill.CurrentVersion,
        State = skill.State,
        PublishedAt = skill.PublishedAt,
        Descriptors = skill.LevelDescriptors
            .Where(d => d.Version == skill.CurrentVersion)
            .OrderBy(d => d.Rank)
            .Select(d => new SkillLevelDescriptorDto
            {
                Rank = d.Rank,
                Label = d.Label,
                BehavioralDefinition = d.BehavioralDefinition
            })
            .ToList(),
        Versions = skill.Versions
            .OrderByDescending(v => v.Version)
            .Select(v => new SkillVersionDto
            {
                SkillVersionId = v.SkillVersionId,
                Version = v.Version,
                Name = v.Name,
                Definition = v.Definition,
                Category = v.Category,
                ValidFrom = v.ValidFrom,
                ValidTo = v.ValidTo
            })
            .ToList(),
        Positions = skill.SkillPositions
            .Where(sp => sp.State > 0)
            .Select(sp => new LinkedPositionDto
            {
                SkillPositionId = sp.SkillPositionId,
                PositionId = sp.PositionId,
                PositionName = sp.Position?.PositionName ?? string.Empty,
                ExpectedLevel = sp.ExpectedLevel,
                RequirementKind = sp.RequirementKind,
                Weight = sp.Weight
            })
            .ToList()
    };

    private static PositionSkillItemDto MapPositionSkill(SkillPosition sp) => new()
    {
        SkillPositionId = sp.SkillPositionId,
        SkillId = sp.SkillId,
        SkillName = sp.Skill.Name ?? string.Empty,
        SkillCode = sp.Skill.Code,
        ExpectedLevel = sp.ExpectedLevel,
        RequirementKind = sp.RequirementKind,
        Weight = sp.Weight,
        State = sp.State
    };

    private static TaxonomyItemDto MapDomain(DomainSkill domain) => new()
    {
        Id = domain.DomainSkillId,
        Code = domain.Code,
        Name = domain.Name ?? string.Empty,
        Description = domain.Description,
        SortOrder = domain.SortOrder,
        State = domain.State
    };
}
