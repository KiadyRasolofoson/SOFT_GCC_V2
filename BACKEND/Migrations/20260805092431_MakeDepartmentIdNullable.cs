using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace soft_carriere_competence.Migrations
{
    /// <inheritdoc />
    public partial class MakeDepartmentIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rendre Department_id nullable pour les employés importés de T_SAL (p_sw)
            // qui n'ont pas de département assigné.
            migrationBuilder.Sql("ALTER TABLE Employee ALTER COLUMN Department_id int NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE Employee ALTER COLUMN Department_id int NOT NULL;");
        }
    }
}
