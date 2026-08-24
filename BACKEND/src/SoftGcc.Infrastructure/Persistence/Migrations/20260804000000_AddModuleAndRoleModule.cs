using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Ajout des tables Modules et Role_Modules, et de la colonne module_id sur Permissions.
    /// </summary>
    public partial class AddModuleAndRoleModule : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Création de la table Modules
            migrationBuilder.CreateTable(
                name: "Modules",
                columns: table => new
                {
                    module_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    icon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    route = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    parent_module_id = table.Column<int>(type: "int", nullable: true),
                    sort_order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    state = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Modules", x => x.module_id);
                    table.ForeignKey(
                        name: "FK_Modules_Modules_parent_module_id",
                        column: x => x.parent_module_id,
                        principalTable: "Modules",
                        principalColumn: "module_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Modules_name",
                table: "Modules",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Modules_parent_module_id",
                table: "Modules",
                column: "parent_module_id");

            // Création de la table Role_Modules
            migrationBuilder.CreateTable(
                name: "Role_Modules",
                columns: table => new
                {
                    role_module_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_id = table.Column<int>(type: "int", nullable: false),
                    module_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Role_Modules", x => x.role_module_id);
                    table.ForeignKey(
                        name: "FK_Role_Modules_Roles_role_id",
                        column: x => x.role_id,
                        principalTable: "Roles",
                        principalColumn: "Role_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Role_Modules_Modules_module_id",
                        column: x => x.module_id,
                        principalTable: "Modules",
                        principalColumn: "module_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Role_Modules_role_id",
                table: "Role_Modules",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_Role_Modules_module_id",
                table: "Role_Modules",
                column: "module_id");

            // Ajout de la colonne module_id sur Permissions
            migrationBuilder.AddColumn<int>(
                name: "module_id",
                table: "Permissions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_module_id",
                table: "Permissions",
                column: "module_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Permissions_Modules_module_id",
                table: "Permissions",
                column: "module_id",
                principalTable: "Modules",
                principalColumn: "module_id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Supprimer FK et colonne module_id de Permissions
            migrationBuilder.DropForeignKey(
                name: "FK_Permissions_Modules_module_id",
                table: "Permissions");
            migrationBuilder.DropIndex(
                name: "IX_Permissions_module_id",
                table: "Permissions");
            migrationBuilder.DropColumn(
                name: "module_id",
                table: "Permissions");

            // Supprimer Role_Modules
            migrationBuilder.DropTable(name: "Role_Modules");

            // Supprimer Modules
            migrationBuilder.DropTable(name: "Modules");
        }
    }
}
