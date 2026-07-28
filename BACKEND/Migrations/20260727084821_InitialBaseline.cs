using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace soft_carriere_competence.Migrations
{
    /// <summary>
    /// Baseline migration — toutes les tables et colonnes existent déjà en base.
    /// Cette migration vide enregistre l'état initial dans __EFMigrationsHistory.
    /// </summary>
    public partial class InitialBaseline : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Baseline — aucune opération. La base contient déjà tout.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Baseline — pas de rollback.
        }
    }
}
