using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [Migration("20260821060000_AddAiAgentMaxToolRounds")]
    public partial class AddAiAgentMaxToolRounds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "max_tool_rounds",
                table: "ai_agent_settings",
                type: "int",
                nullable: false,
                defaultValue: 15);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "max_tool_rounds",
                table: "ai_agent_settings");
        }
    }
}
