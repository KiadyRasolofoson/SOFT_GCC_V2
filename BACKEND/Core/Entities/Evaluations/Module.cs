using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    /// <summary>
    /// Représente un module/page de l'application visible dans le menu de navigation.
    /// Supporte une arborescence via ParentModuleId pour les sous-menus.
    /// </summary>
    [Table("Modules")]
    public class Module
    {
        [Key]
        [Column("module_id")]
        public int ModuleId { get; set; }

        /// <summary>Clé interne unique (ex: "evaluations", "parametrage")</summary>
        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>Nom affiché dans le menu (ex: "Évaluations", "Paramètres")</summary>
        [Required]
        [MaxLength(255)]
        [Column("display_name")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>Classe d'icône MDI (ex: "mdi mdi-clipboard-check")</summary>
        [MaxLength(100)]
        [Column("icon")]
        public string? Icon { get; set; }

        /// <summary>Route par défaut du module (ex: "/soft-gcc/evaluations/liste")</summary>
        [MaxLength(255)]
        [Column("route")]
        public string? Route { get; set; }

        /// <summary>FK vers le module parent (nullable, pour les sous-menus)</summary>
        [Column("parent_module_id")]
        public int? ParentModuleId { get; set; }

        /// <summary>Ordre d'affichage dans le menu</summary>
        [Column("sort_order")]
        public int SortOrder { get; set; } = 0;

        /// <summary>État (1 = actif, 0 = supprimé)</summary>
        [Column("state")]
        public int State { get; set; } = 1;

        /// <summary>Description optionnelle</summary>
        [MaxLength(500)]
        [Column("description")]
        public string? Description { get; set; }

        // Navigation properties
        [ForeignKey("ParentModuleId")]
        public Module? ParentModule { get; set; }

        public ICollection<Module> ChildModules { get; set; } = new List<Module>();
        public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
        public ICollection<RoleModule> RoleModules { get; set; } = new List<RoleModule>();
    }
}
