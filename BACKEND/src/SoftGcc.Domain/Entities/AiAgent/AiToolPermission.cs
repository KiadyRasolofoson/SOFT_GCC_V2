using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Domain.Entities.AiAgent;

[Table("ai_tool_permissions")]
public class AiToolPermission
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("role_id")]
    public int? RoleId { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("tool_key")]
    public string ToolKey { get; set; } = string.Empty;

    [Column("is_allowed")]
    public bool IsAllowed { get; set; }

    [ForeignKey(nameof(RoleId))]
    public Role? Role { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
