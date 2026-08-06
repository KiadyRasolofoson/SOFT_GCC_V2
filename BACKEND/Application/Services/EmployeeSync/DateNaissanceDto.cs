namespace soft_carriere_competence.Application.Services.EmployeeSync
{
    /// <summary>
    /// DTO pour la requête SQL brute de diagnostic DateNaissance.
    /// </summary>
    internal class DateNaissanceDto
    {
        public string MatriculeSalarie { get; set; } = string.Empty;
        public DateTime? DateNaissance { get; set; }
    }
}
