using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.salary_skills.p_sw;

namespace soft_carriere_competence.Infrastructure.Data
{
    /// <summary>
    /// DbContext en lecture seule pour la base p_sw (paie).
    /// Utilisé pour la synchronisation employés (T_SAL + T_HST_*).
    /// </summary>
    public class P_SWDbContext : DbContext
    {
        public P_SWDbContext(DbContextOptions<P_SWDbContext> options) : base(options)
        {
        }

        public DbSet<TSalarie> TSalarie { get; set; }
        public DbSet<TDepartement> TDepartement { get; set; }
        public DbSet<THstAffectation> THstAffectation { get; set; }
        public DbSet<THstPoste> THstPoste { get; set; }
        public DbSet<THstEtablissement> THstEtablissement { get; set; }
        public DbSet<THstContrat> THstContrat { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TSalarie>(entity =>
            {
                entity.ToTable("T_SAL", "dbo");
                entity.HasKey(e => e.SaCompteurNumero);
                entity.Property(e => e.MatriculeSalarie).HasMaxLength(10);
                entity.Property(e => e.Nom).HasMaxLength(80);
                entity.Property(e => e.Prenom).HasMaxLength(20);
                entity.Property(e => e.EMail).HasMaxLength(128);
            });

            modelBuilder.Entity<TDepartement>(entity =>
            {
                entity.ToTable("T_DEPARTEMENT", "dbo");
                entity.HasKey(e => e.Code);
                entity.Property(e => e.Code).HasMaxLength(10);
                entity.Property(e => e.Intitule).HasMaxLength(80);
            });

            modelBuilder.Entity<THstAffectation>(entity =>
            {
                entity.ToTable("T_HST_AFFECTATION", "dbo");
                entity.HasKey(e => e.IdHstAffectation);
            });

            modelBuilder.Entity<THstPoste>(entity =>
            {
                entity.ToTable("T_HST_POSTE", "dbo");
                entity.HasKey(e => e.IdHstPoste);
            });

            modelBuilder.Entity<THstEtablissement>(entity =>
            {
                entity.ToTable("T_HST_ETABLISSEMENT", "dbo");
                entity.HasKey(e => e.IdHstEtab);
            });

            modelBuilder.Entity<THstContrat>(entity =>
            {
                entity.ToTable("T_HST_CONTRAT", "dbo");
                entity.HasKey(e => e.IdHstContrat);
            });
        }
    }
}
