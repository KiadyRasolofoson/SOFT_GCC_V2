using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Permissions")]
    public class Permission
    {
        [Key]
        [Column("Permission_id")]
        public int PermissionId { get; set; }

        [MaxLength(100)]
        [Required]
        [Column("name")]
        public string Name { get; set; }

        [MaxLength(255)]
        [Column("description")]
        public string Description { get; set; }

        [Column("state")]
        public int State { get; set; } = 1;
    }
} 