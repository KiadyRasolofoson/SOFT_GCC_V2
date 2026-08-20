using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("Roles")]
    public class Role
    {
        [Key]
        [Column("Role_id")]
        public int Roleid { get; set; }

        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Column("state")]
        public int? state {  get; set; }
    }
}
