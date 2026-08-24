using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.AiAgent;

[Table("ai_agent_settings")]
public class AiAgentSetting
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("active_provider")]
    public string ActiveProvider { get; set; } = "Deepseek";

    [Required]
    [MaxLength(150)]
    [Column("active_model")]
    public string ActiveModel { get; set; } = "deepseek-chat";

    [Column("is_enabled")]
    public bool IsEnabled { get; set; }

    [Column("max_tokens")]
    public int MaxTokens { get; set; } = 2048;

    [Column("max_tool_rounds")]
    public int MaxToolRounds { get; set; } = 15;

    [Column("temperature")]
    public double Temperature { get; set; } = 0.3;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
