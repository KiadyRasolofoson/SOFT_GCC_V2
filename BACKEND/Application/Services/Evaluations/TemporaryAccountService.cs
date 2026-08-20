using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.AuthInterface;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class TemporaryAccountService
    {
        private readonly IGenericRepository<TemporaryAccount> _temporaryAccountRepository;
        private readonly IGenericRepository<Employee> _employeeRepository;
        private readonly IGenericRepository<Evaluation> _evaluationRepository;
        private readonly IGenericRepository<LoginAttempt> _loginAttemptRepository;
        private readonly IEmailService _emailService;

        public TemporaryAccountService(
            IGenericRepository<TemporaryAccount> temporaryAccountRepository,
            IGenericRepository<Employee> employeeRepository,
            IGenericRepository<Evaluation> evaluationRepository,
            IGenericRepository<LoginAttempt> loginAttemptRepository,
            IEmailService emailService)
        {
            _temporaryAccountRepository = temporaryAccountRepository;
            _employeeRepository = employeeRepository;
            _evaluationRepository = evaluationRepository;
            _loginAttemptRepository = loginAttemptRepository;
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
                loginExists = await _temporaryAccountRepository.AnyAsync(ta => ta.TempLogin == tempLogin);
            } while (loginExists);

            return tempLogin;
        }

        // Génère un login temporaire unique basé sur le nom de l'employé
        private async Task<string> GenerateTemporaryLoginFromEmployeeAsync(Employee employee)
        {
            string baseLogin = $"{(employee.FirstName ?? "x").Substring(0, 1)}{employee.Name ?? ""}".ToLower();
            baseLogin = baseLogin.Replace(" ", "").Replace("-", "");

            // Vérifier si ce login existe déjà et ajouter un nombre aléatoire si c'est le cas
            bool loginExists;
            string tempLogin;
            Random random = new Random();

            do
            {
                int randomNumber = random.Next(1000, 9999); tempLogin = $"{baseLogin}{randomNumber}";
                loginExists = await _temporaryAccountRepository.AnyAsync(ta => ta.TempLogin == tempLogin);
            } while (loginExists);

            return tempLogin;
        }

        // Surcharge pour inclure l'employeeId
        public async Task<TemporaryAccount> CreateTemporaryAccountAsync(int employeeId, int evaluationId)
        {
            // Vérifier si l'employé existe
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
            {
                throw new Exception($"Employé avec ID {employeeId} non trouvé");
            }

            // Vérifier si l'évaluation existe
            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
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
            await _temporaryAccountRepository.CreateAsync(tempAccount);

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

        // Login method for temporary accounts (moved from EvaluationLoginController)
        public async Task<(bool Success, string? Message, string? Token, int? EvaluationId)> LoginAsync(
            string tempLogin, string tempPassword, string ipAddress, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(tempLogin) || string.IsNullOrEmpty(tempPassword))
            {
                return (false, "Login et mot de passe requis", null, null);
            }

            // Créer une entrée dans la table LoginAttempts pour la traçabilité
            var loginAttempt = new LoginAttempt
            {
                TempLogin = tempLogin,
                IPAddress = ipAddress,
                IsSuccess = false
            };

            await _loginAttemptRepository.CreateAsync(loginAttempt);

            // Vérifier l'existence du compte temporaire
            var tempAccount = await _temporaryAccountRepository.GetFirstOrDefaultAsync(ta =>
                ta.TempLogin == tempLogin &&
                ta.TempPassword == tempPassword &&
                ta.ExpirationDate > DateTime.UtcNow &&
                !ta.IsUsed);

            if (tempAccount == null)
            {
                return (false, "Identifiants invalides ou expirés", null, null);
            }

            // Vérifier si l'évaluation est disponible (date de début atteinte)
            var evaluation = await _evaluationRepository.GetByIdAsync(tempAccount.Evaluations_id);
            if (evaluation == null)
            {
                return (false, "Évaluation non trouvée", null, null);
            }

            // Vérifier si la date actuelle est dans la période d'évaluation
            var currentDate = DateTime.UtcNow.Date;
            if (currentDate < evaluation.StartDate)
            {
                return (false,
                    $"L'évaluation n'est pas encore disponible. Elle sera accessible à partir du {evaluation.StartDate:dd/MM/yyyy}",
                    null, null);
            }

            if (currentDate > evaluation.EndDate)
            {
                return (false, "La période d'évaluation est terminée", null, null);
            }

            // Marquer la tentative comme réussie
            loginAttempt.IsSuccess = true;
            await _loginAttemptRepository.UpdateAsync(loginAttempt);

            // Générer le token JWT
            var token = GenerateJwtToken(tempAccount.EmployeeId, tempAccount.Evaluations_id, configuration);

            return (true, null, token, tempAccount.Evaluations_id);
        }

        private string GenerateJwtToken(int userId, int evaluationId, IConfiguration configuration)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("evaluationId", evaluationId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? ""));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}