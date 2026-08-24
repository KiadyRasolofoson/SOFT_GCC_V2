using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.AiAgent;

[Table("ai_messages")]
public class AiMessage
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("conversation_id")]
    public int ConversationId { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = string.Empty;

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("tool_name")]
    public string? ToolName { get; set; }

    [Column("tool_call_json")]
    public string? ToolCallJson { get; set; }

    [MaxLength(100)]
    [Column("tool_call_id")]
    public string? ToolCallId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(ConversationId))]
    public AiConversation? Conversation { get; set; }
}
