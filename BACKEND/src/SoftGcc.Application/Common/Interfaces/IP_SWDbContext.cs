using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.salary_skills.p_sw;

namespace SoftGcc.Application.Common.Interfaces;

public interface IP_SWDbContext
{
    public DbSet<TSalarie> TSalarie { get; }
    public DbSet<TDepartement> TDepartement { get; }
    public DbSet<THstAffectation> THstAffectation { get; }
    public DbSet<THstPoste> THstPoste { get; }
    public DbSet<THstEtablissement> THstEtablissement { get; }
    public DbSet<THstContrat> THstContrat { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
