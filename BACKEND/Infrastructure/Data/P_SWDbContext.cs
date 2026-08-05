using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Infrastructure.Data
{
    /// <summary>
    /// DbContext en lecture seule pour la base p_sw (paie).
    /// Utilisé uniquement pour la synchronisation T_SAL → Employee.
    /// </summary>
    public class P_SWDbContext : DbContext
    {
        public P_SWDbContext(DbContextOptions<P_SWDbContext> options) : base(options)
        {
        }

        public DbSet<TSalarie> TSalarie { get; set; }

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
        }
    }
}
