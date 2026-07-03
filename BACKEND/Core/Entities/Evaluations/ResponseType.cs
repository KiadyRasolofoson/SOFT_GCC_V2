using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("ResponseTypes")]
    public class ResponseType
    {
        [Key]
        [Column("ResponseTypeId")]
        public int ResponseTypeId { get; set; }
        
        [Column("TypeName")]
        public string TypeName { get; set; }
        
        [Column("Description")]
        public string Description { get; set; }
    }
} 