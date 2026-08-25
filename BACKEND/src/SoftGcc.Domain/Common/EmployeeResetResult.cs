namespace SoftGcc.Domain.Common
{
    public record EmployeeResetResult(
        int EmployeesDeleted,
        int EvaluationsDeleted,
        int CompetenceResultsDeleted,
        int TemporaryAccountsDeleted,
        int SkillsDeleted,
        int EducationsDeleted,
        int LanguagesDeleted,
        int OtherFormationsDeleted,
        int WishEvolutionDeleted,
        int UsersDetached);
}
