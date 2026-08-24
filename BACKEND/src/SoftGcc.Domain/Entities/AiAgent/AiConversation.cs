using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.AiAgent;

[Table("ai_conversations")]
public class AiConversation
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = "Nouvelle conversation";

    [Required]
    [MaxLength(50)]
    [Column("last_mode")]
    public string LastMode { get; set; } = "Chat";

    [Required]
    [MaxLength(50)]
    [Column("provider")]
    public string Provider { get; set; } = "Deepseek";

    [Required]
    [MaxLength(150)]
    [Column("model")]
    public string Model { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public ICollection<AiMessage> Messages { get; set; } = new List<AiMessage>();
}
