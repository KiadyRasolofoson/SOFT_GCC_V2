using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
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
        public string Name { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("state")]
        public int State { get; set; } = 1;

        /// <summary>FK vers le module auquel cette permission appartient (nullable pour rétrocompatibilité)</summary>
        [Column("module_id")]
        public int? ModuleId { get; set; }

        // Navigation properties
        [ForeignKey("ModuleId")]
        public Module? Module { get; set; }

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
} 