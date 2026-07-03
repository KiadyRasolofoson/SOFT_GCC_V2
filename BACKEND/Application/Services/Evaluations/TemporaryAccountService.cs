using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Application.Services.EmailService;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class TemporaryAccountService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public TemporaryAccountService(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // Génère un login temporaire unique basé sur le nom de l'utilisateur
        private async Task<string> GenerateTemporaryLoginAsync(User user)
        {
            string baseLogin = $"{user.FirstName.Substring(0, 1)}{user.LastName}".ToLower();
            baseLogin = baseLogin.Replace(" ", "").Replace("-", "");

            // Vérifier si ce login existe déjà et ajouter un nombre aléatoire si c'est le cas
            bool loginExists;
            string tempLogin;
            Random random = new Random();

            do
            {
                int randomNumber = random.Next(1000, 9999); tempLogin = $"{baseLogin}{randomNumber}";
                loginExists = await _context.temporaryAccounts.AnyAsync(ta => ta.TempLogin == tempLogin);
            } while (loginExists);

            return tempLogin;
        }

        // Génère un login temporaire unique basé sur le nom de l'employé
        private async Task<string> GenerateTemporaryLoginFromEmployeeAsync(Employee employee)
        {
            string baseLogin = $"{employee.FirstName.Substring(0, 1)}{employee.Name}".ToLower();
            baseLogin = baseLogin.Replace(" ", "").Replace("-", "");

            // Vérifier si ce login existe déjà et ajouter un nombre aléatoire si c'est le cas
            bool loginExists;
            string tempLogin;
            Random random = new Random();

            do
            {
                int randomNumber = random.Next(1000, 9999); tempLogin = $"{baseLogin}{randomNumber}";
                loginExists = await _context.temporaryAccounts.AnyAsync(ta => ta.TempLogin == tempLogin);
            } while (loginExists);

            return tempLogin;
        }

        // Crée un compte temporaire pour un utilisateur
        //public async Task<TemporaryAccount> CreateTemporaryAccountAsync(int userId, int evaluationId)
        //{
        //    var user = await _context.Users.FindAsync(userId);
        //    var evaluation = await _context.Evaluations.FindAsync(evaluationId);

        //    if (user == null || evaluation == null)
        //        throw new ArgumentException("Utilisateur ou évaluation invalide");

        //    var tempAccount = new TemporaryAccount
        //    {
        //        UserId = userId,
        //        Evaluations_id = evaluationId,
        //        TempLogin = await GenerateTemporaryLoginAsync(user),
        //        TempPassword = GenerateTemporaryPassword(),
        //        CreatedAt = DateTime.UtcNow,
        //        ExpirationDate = DateTime.UtcNow.AddDays(2)
        //    };

        //    _context.temporaryAccounts.Add(tempAccount);
        //    await _context.SaveChangesAsync();

        //    await _emailService.SendEmailAsync(user.Email, "Identifiants temporaires pour l'évaluation",
        //        $"Votre login : {tempAccount.TempLogin}\nVotre mot de passe : {tempAccount.TempPassword}\n" +
        //        $"Notez que ces identifiants ne seront valides qu'à partir de {evaluation.StartDate.ToShortDateString()}.");

        //    return tempAccount;
        //}

        // Surcharge pour inclure l'employeeId
        public async Task<TemporaryAccount> CreateTemporaryAccountAsync(int employeeId, int evaluationId)
        {
            // Vérifier si l'employé existe
            var employee = await _context.Employee.FindAsync(employeeId);
            if (employee == null)
            {
                throw new Exception($"Employé avec ID {employeeId} non trouvé");
            }

            // Vérifier si l'évaluation existe
            var evaluation = await _context.Evaluations.FindAsync(evaluationId);
            if (evaluation == null)
            {
                throw new Exception($"Évaluation avec ID {evaluationId} non trouvée");
            }

            // Générer les identifiants temporaires
            string tempLogin = GenerateTemporaryLogin(employee);
            string tempPassword = GenerateTemporaryPassword();

            // Créer le compte temporaire
            var tempAccount = new TemporaryAccount
            {
                EmployeeId = employeeId,
                Evaluations_id = evaluationId,
                TempLogin = tempLogin,
                TempPassword = tempPassword,
                ExpirationDate = evaluation.EndDate.AddDays(1), // Expire un jour après la fin de l'évaluation
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            // Sauvegarder dans la base de données
            await _context.temporaryAccounts.AddAsync(tempAccount);
            await _context.SaveChangesAsync();

            return tempAccount;
        }

        // Génère un mot de passe temporaire |
        private string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 10)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        // Méthode pour générer un login temporaire à partir d'un employé
        private string GenerateTemporaryLogin(Employee employee)
        {
            if (employee == null)
                throw new ArgumentNullException(nameof(employee));

            // Construire un login basé sur le prénom et le nom
            string baseName = $"{employee.FirstName?.Substring(0, Math.Min(3, employee.FirstName?.Length ?? 0))}{employee.Name?.Substring(0, Math.Min(3, employee.Name?.Length ?? 0))}".ToLower();
            
            // Ajouter un timestamp pour l'unicité
            string timestamp = DateTime.UtcNow.ToString("yyMMddHHmm");
            
            // Retourner le login temporaire
            return $"{baseName}{timestamp}";
        }
    }
}