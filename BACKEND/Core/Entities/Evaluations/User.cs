using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;

[Table("users")]
public class User
{
    [Key]
    [Column("UserId")]
    public int Id { get; set; }

    [MaxLength(255)]
    [Column("last_name")]
    public string LastName { get; set; }

    [MaxLength(255)]
    [Column("first_name")]
    public string FirstName { get; set; }

    [MaxLength(255)]
    [Column("username")]
    public string? Username { get; set; }

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(255)]
    public string Password { get; set; }

    
    [Column("role_id")]
    public int RoleId { get; set; }

    
   
    [Column("creation_date",TypeName = "date")]
    public DateTime CreationDate { get; set; } = DateTime.UtcNow;
    [Column("deletion_date")]
    public DateTime? DeletionDate { get; set; }
    [Column("deleted_by")]
    public long? DeletedBy { get; set; }
    [Column("created_by")]
    public int Createdby { get; set; }

    // Navigation Properties
    [ForeignKey("RoleId")]
    public Role? Role { get; set; }
   
}
