using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NullableEmployeeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rendre les colonnes nullable pour accepter les données de T_SAL (p_sw)
            // où certaines valeurs peuvent être NULL.
            // Registration_number est exclu car référencé par des vues/indexes.
            migrationBuilder.Sql(@"
                ALTER TABLE Employee ALTER COLUMN Name                nvarchar(255) NULL;
                ALTER TABLE Employee ALTER COLUMN FirstName           nvarchar(255) NULL;
                ALTER TABLE Employee ALTER COLUMN Birthday            datetime2 NULL;
                ALTER TABLE Employee ALTER COLUMN Civilite_id         int NULL;
                ALTER TABLE Employee ALTER COLUMN Email               nvarchar(255) NULL;
                ALTER TABLE Employee ALTER COLUMN Hiring_date         datetime2 NULL;
                ALTER TABLE Employee ALTER COLUMN Manager_id          int NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Retour aux contraintes NOT NULL (attention: si des NULL existent déjà, cette opération échouera)
            migrationBuilder.Sql(@"
                ALTER TABLE Employee ALTER COLUMN Name                nvarchar(255) NOT NULL;
                ALTER TABLE Employee ALTER COLUMN FirstName           nvarchar(255) NOT NULL;
                ALTER TABLE Employee ALTER COLUMN Birthday            datetime2 NOT NULL;
                ALTER TABLE Employee ALTER COLUMN Civilite_id         int NOT NULL;
                ALTER TABLE Employee ALTER COLUMN Email               nvarchar(255) NOT NULL;
                ALTER TABLE Employee ALTER COLUMN Hiring_date         datetime2 NOT NULL;
                ALTER TABLE Employee ALTER COLUMN Manager_id          int NOT NULL;
            ");
        }
    }
}
