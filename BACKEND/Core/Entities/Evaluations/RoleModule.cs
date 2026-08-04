using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    /// <summary>
    /// Table de jointure : quels modules un rôle peut-il voir dans le menu ?
    /// Contrôle la visibilité de la navbar, indépendamment des permissions fines (RolePermission).
    /// </summary>
    [Table("Role_Modules")]
    public class RoleModule
    {
        [Key]
        [Column("role_module_id")]
        public int RoleModuleId { get; set; }

        [Column("role_id")]
        public int RoleId { get; set; }

        [Column("module_id")]
        public int ModuleId { get; set; }

        // Navigation properties
        [ForeignKey("RoleId")]
        public Role Role { get; set; } = null!;

        [ForeignKey("ModuleId")]
        public Module Module { get; set; } = null!;
    }
}
