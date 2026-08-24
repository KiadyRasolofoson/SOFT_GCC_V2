using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.AiAgent;

[Table("ai_provider_configs")]
public class AiProviderConfig
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("provider")]
    public string Provider { get; set; } = string.Empty;

    [Column("encrypted_api_key")]
    public string? EncryptedApiKey { get; set; }

    [MaxLength(500)]
    [Column("base_url")]
    public string? BaseUrl { get; set; }

    [MaxLength(150)]
    [Column("default_model")]
    public string? DefaultModel { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
