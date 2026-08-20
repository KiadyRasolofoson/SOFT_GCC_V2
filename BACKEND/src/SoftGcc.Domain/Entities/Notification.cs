using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("notification_id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [MaxLength(100)]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [MaxLength(500)]
        [Column("link")]
        public string? Link { get; set; }

        [Column("payload")]
        public string? Payload { get; set; }

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("read_at")]
        public DateTime? ReadAt { get; set; }

        // Navigation
        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
