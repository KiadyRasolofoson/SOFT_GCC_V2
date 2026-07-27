namespace soft_carriere_competence.Application.Dtos.Profile
{
    /// <summary>
    /// DTO retourné par GET /api/me/profile.
    /// Usage STRICT : affichage navbar React et informations d'interface.
    /// NE PAS utiliser pour l'autorisation côté serveur — les policies ABAC restent la source de vérité.
    /// </summary>
    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public int RoleId { get; set; }
        public string RoleTitle { get; set; } = string.Empty;
        public int? EmployeeId { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? DepartmentName { get; set; }

        /// <summary>Modules visibles dans la navbar React (ex: "evaluations", "competences", "carrieres").</summary>
        public List<string> VisibleModules { get; set; } = new();

        /// <summary>Permissions effectives de l'utilisateur (ex: "MANAGE_EVALUATIONS", "VIEW_REPORTS").</summary>
        public List<string> Permissions { get; set; } = new();
    }
}
