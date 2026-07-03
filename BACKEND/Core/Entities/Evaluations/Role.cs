using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Roles")]
    public class Role
    {
        [Key]
        [Column("Role_id")]
        public int Roleid { get; set; }

        [MaxLength(255)]
        public string Title { get; set; }

        [Column("state")]
        public int? state {  get; set; }
    }
}
