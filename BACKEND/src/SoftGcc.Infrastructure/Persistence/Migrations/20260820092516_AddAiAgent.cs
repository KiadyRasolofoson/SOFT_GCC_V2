using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiAgent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ai_agent_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    active_provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    active_model = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    is_enabled = table.Column<bool>(type: "bit", nullable: false),
                    max_tokens = table.Column<int>(type: "int", nullable: false),
                    temperature = table.Column<double>(type: "float", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_agent_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ai_conversations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    last_mode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    model = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_conversations", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_conversations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_provider_configs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    encrypted_api_key = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    base_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    default_model = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_provider_configs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ai_tool_permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_id = table.Column<int>(type: "int", nullable: true),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    tool_key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    is_allowed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_tool_permissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_tool_permissions_Roles_role_id",
                        column: x => x.role_id,
                        principalTable: "Roles",
                        principalColumn: "Role_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ai_tool_permissions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_messages",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    conversation_id = table.Column<int>(type: "int", nullable: false),
                    role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    tool_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    tool_call_json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    tool_call_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_messages_ai_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "ai_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ai_agent_settings",
                columns: new[] { "id", "active_model", "active_provider", "is_enabled", "max_tokens", "temperature", "updated_at" },
                values: new object[] { 1, "deepseek-chat", "Deepseek", false, 2048, 0.29999999999999999, new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) });

            migrationBuilder.InsertData(
                table: "ai_provider_configs",
                columns: new[] { "id", "base_url", "default_model", "encrypted_api_key", "provider", "updated_at" },
                values: new object[,]
                {
                    { 1, "https://api.deepseek.com", "deepseek-chat", null, "Deepseek", new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 2, "https://api.openai.com/v1", "gpt-4o-mini", null, "OpenAI", new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 3, "http://localhost:11434/v1", "llama3.1", null, "Ollama", new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 4, "https://generativelanguage.googleapis.com/v1beta", "gemini-2.0-flash", null, "Gemini", new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) },
                    { 5, "https://api.anthropic.com", "claude-sonnet-4-20250514", null, "Claude", new DateTime(2026, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ai_conversations_user_id",
                table: "ai_conversations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_messages_conversation_id",
                table: "ai_messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_provider_configs_provider",
                table: "ai_provider_configs",
                column: "provider",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ai_tool_permissions_role_id_tool_key",
                table: "ai_tool_permissions",
                columns: new[] { "role_id", "tool_key" },
                unique: true,
                filter: "[role_id] IS NOT NULL AND [user_id] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ai_tool_permissions_user_id_tool_key",
                table: "ai_tool_permissions",
                columns: new[] { "user_id", "tool_key" },
                unique: true,
                filter: "[user_id] IS NOT NULL AND [role_id] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_agent_settings");

            migrationBuilder.DropTable(
                name: "ai_messages");

            migrationBuilder.DropTable(
                name: "ai_provider_configs");

            migrationBuilder.DropTable(
                name: "ai_tool_permissions");

            migrationBuilder.DropTable(
                name: "ai_conversations");
        }
    }
}
