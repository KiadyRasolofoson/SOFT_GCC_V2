using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace soft_carriere_competence.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ne conserve QUE la création de SyncLog.
            // Les autres changements (Modules, Role_Modules, Permissions.module_id) sont
            // volontairement omis car ils proviennent d'une dérive de snapshot préexistante
            // et ces tables/colonnes existent déjà en base.
            migrationBuilder.CreateTable(
                name: "SyncLog",
                columns: table => new
                {
                    SyncLog_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SyncDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RecordsUpdated = table.Column<int>(type: "int", nullable: false),
                    RecordsInserted = table.Column<int>(type: "int", nullable: false),
                    RecordsFailed = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncLog", x => x.SyncLog_id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncLog");
        }
    }
}
