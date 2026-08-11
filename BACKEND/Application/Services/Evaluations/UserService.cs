using Microsoft.CodeAnalysis.Scripting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using soft_carriere_competence.Application.Dtos.LoginDto;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Core.Interface.DataService;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class UserService : IUserService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IEvaluationDataService _dataService;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService; // Service pour l'envoi d'emails.




        public UserService(IGenericRepository<User> repository, IEvaluationDataService dataService, IConfiguration configuration, IEmailService emailService)
        {
            _userRepository = repository;
            _dataService = dataService;
            _configuration = configuration;
            _emailService = emailService;
        }
        // Méthode pour récupérer tous les employés
        public async Task<IEnumerable<User>> GetAllEmployeesAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        // Méthode pour récupérer tous les employés avec leur position et date d'évaluation
        public async Task<IEnumerable<VEmployeeDetails>> GetAllEmployeesWithDetailsAsync()
        {
            return await _dataService.GetAllEmployeeDetailsAsync();
        }

        public async Task<VEmployeeDetails?> GetEmployeeAsync(int employeeId)
        {
            return await _dataService.GetEmployeeDetailsAsync(employeeId);
        }


        public async Task<Position?> GetPostByIdAsync(int postId)
        {
            var result = await _dataService.ExecuteReaderAsync(
                "SELECT * FROM Position WHERE PositionId = @p0", postId);
            if (result.Count == 0) return null;
            var row = result[0];
            return new Position
            {
                PositionId = Convert.ToInt32(row["PositionId"]),
                PositionName = row["Name"]?.ToString() ?? row["Designation"]?.ToString()
            };
        }

        public async Task<IEnumerable<User>> GetManagerAndDirector()
        {
            var rows = await _dataService.ExecuteReaderAsync(
                "SELECT * FROM Users WHERE role_id = 2 OR role_id = 4");
            return rows.Select(row => new User
            {
                Id = Convert.ToInt32(row["UserId"]),
                LastName = row["last_name"]?.ToString() ?? string.Empty,
                FirstName = row["first_name"]?.ToString() ?? string.Empty,
                Email = row["email"]?.ToString() ?? string.Empty,
                Username = row.ContainsKey("username") ? row["username"]?.ToString() : null,
                RoleId = Convert.ToInt32(row["role_id"])
            }).ToList();
        }

        // --------------------------------------AUTHENTIFICATION--------------------------------------- //


        // Méthode pour inscrire un nouvel utilisateur.
        public async Task<string> RegisterAsync(RegisterDto dto)
        {
            // Vérifie si l'email existe déjà dans la base de données.
            var userWithEmail = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == dto.Email);
            if (userWithEmail != null)
                throw new Exception("Email déjà utilisé.");

            // Vérifie si le nom d'utilisateur existe déjà
            var userWithUsername = await _userRepository.GetFirstOrDefaultAsync(u => u.Username == dto.Username);
            if (userWithUsername != null)
                throw new Exception("Nom d'utilisateur déjà utilisé.");

            // Hashage sécurisé du mot de passe.
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Création d'un nouvel utilisateur.
            var user = new User
            {
                LastName = dto.LastName,
                FirstName = dto.FirstName,
                Username = dto.Username,
                Email = dto.Email,
                Password = hashedPassword,
                RoleId = dto.RoleId,
                CreationDate = DateTime.UtcNow,
                Createdby = 1
            };

            await _userRepository.CreateAsync(user); // Ajout de l'utilisateur dans la base de données.
            return "Utilisateur enregistré avec succès.";
        }

        // Méthode pour connecter un utilisateur.
        public async Task<string> LoginAsync(LoginDto dto)
        {
            Console.WriteLine("Tentative de connexion");

            User? user = null;

            // Compatibilité avec l'ancienne API:
            // Dans la version précédente, le DTO pouvait avoir une propriété Email 
            // On vérifie si la propriété Identifier est null ou vide (cas de l'ancienne API)
            string identifier = dto.Identifier;

            // Si l'identifiant contient @, on le considère comme un email
            if (identifier.Contains("@"))
            {
                user = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == identifier, u => u.Role);
            }
            else
            {
                // Sinon, c'est un nom d'utilisateur
                user = await _userRepository.GetFirstOrDefaultAsync(u => u.Username == identifier, u => u.Role);
                
                // Si on ne trouve pas par nom d'utilisateur, on essaie par email
                // (certains utilisateurs pourraient ne pas avoir de nom d'utilisateur)
                if (user == null)
                {
                    user = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == identifier, u => u.Role);
                }
            }

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
                throw new Exception("Identifiant ou mot de passe incorrect.");

            // Génération du token JWT si la connexion est réussie.
            var token = GenerateJwtToken(user);
            Console.WriteLine("Connexion réussie, token généré");
            return token;
        }

        public async Task<string> ForgotPasswordAsync(string email)
        {
            // Recherche de l'utilisateur par email.
            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                throw new Exception("Utilisateur non trouvé.");

            // Génération d'un token de réinitialisation unique.
            var resetToken = Guid.NewGuid().ToString();
            // Ce token peut être sauvegardé en base de données pour validation ultérieure.

            // Envoi de l'email contenant le token de réinitialisation.
            await _emailService.SendEmailAsync(user.Email ?? "", "Réinitialisation du mot de passe",
                $"Votre token de réinitialisation est : {resetToken}");

            return "Email de réinitialisation envoyé.";
        }

        // Méthode pour réinitialiser un mot de passe.
        public async Task<string> ResetPasswordAsync(ResetPasswordDto dto)
        {
            // Vérification du token ici (si nécessaire, selon la logique de stockage).

            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                throw new Exception("Utilisateur non trouvé.");

            // Hashage du nouveau mot de passe et mise à jour.
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _userRepository.UpdateAsync(user);

            return "Mot de passe réinitialisé avec succès.";
        }

        // Méthode pour générer un token JWT pour un utilisateur.
        private string GenerateJwtToken(User user)
        {
            var key = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(key))
            {
                throw new Exception("La clé JWT est manquante ou invalide dans la configuration.");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
    {
        new Claim("userId", user.Id.ToString()), // ID de l'utilisateur
        new Claim("email", user.Email ?? ""), // Email de l'utilisateur
        new Claim("firstName", user.FirstName ?? ""), // Prénom
        new Claim("lastName", user.LastName ?? ""), // Nom
        new Claim("roleId", user.RoleId.ToString()), // ID du rôle
        new Claim("roleTitle", user.Role?.Title ?? "Unknown"), // Titre du rôle
    };

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        public async Task<int> CountAsync(int? department = null)
        {
            if (department.HasValue)
            {
                return await _dataService.ExecuteScalarAsync(
                    "SELECT COUNT(*) FROM Users WHERE DepartmentId = @p0", department.Value);
            }
            return await _dataService.ExecuteScalarAsync("SELECT COUNT(*) FROM Users");
        }

        public async Task<IEnumerable<User>> GetUsersPaginatedAsync(int pageNumber, int pageSize, string includeProperties = "")
        {
            // Utilise la méthode GetPage du GenericRepository pour récupérer les utilisateurs paginés
            return _userRepository.GetPage(pageNumber, pageSize, includeProperties);
        }

        public int GetTotalPages(int pageSize)
        {
            // Utilise la méthode GetTotalPages du GenericRepository pour calculer le nombre total de pages
            return _userRepository.GetTotalPages(pageSize);
        }

        public async Task<(IEnumerable<User> Users, int TotalPages)> GetUsersWithPaginationAsync(int pageNumber, int pageSize)
        {
            var users = await GetUsersPaginatedAsync(pageNumber, pageSize);
            var totalPages = GetTotalPages(pageSize);

            return (users, totalPages);
        }

        public async Task<(IEnumerable<VEmployeeDetails> Employees, int TotalPages)> GetVEmployeeDetailsPaginatedAsync(
            int pageNumber = 1, 
            int pageSize = 10,
            string? search = null,
            int? position = null,
            int? department = null,
            string? sortBy = null,
            string? sortDirection = null)
        {
            var query = _dataService.GetEmployeeDetailsQuery();

            // Appliquer les filtres
            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    (e.FirstName + " " + e.LastName).Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search));
            
            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            // Pour le filtre par département, nous devons adapter car VEmployeeDetails n'a pas de DepartmentId explicite
            // Dans ce cas, nous pourrions filtrer par nom de département obtenu à partir de l'ID
            if (department.HasValue)
            {
                var deptRows = await _dataService.ExecuteReaderAsync(
                    "SELECT Name FROM Department WHERE DepartmentId = @p0", department.Value);
                if (deptRows.Count > 0)
                {
                    var deptName = deptRows[0]["Name"]?.ToString();
                    if (!string.IsNullOrEmpty(deptName))
                    {
                        query = query.Where(e => e.Department != null && e.Department.Contains(deptName));
                    }
                }
            }

            // Appliquer le tri
            if (!string.IsNullOrEmpty(sortBy))
            {
                bool isAscending = string.IsNullOrEmpty(sortDirection) || sortDirection.ToLower() == "ascending";
                
                switch (sortBy.ToLower())
                {
                    case "name":
                        query = isAscending 
                            ? query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
                            : query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName);
                        break;
                    case "position":
                        query = isAscending 
                            ? query.OrderBy(e => e.Position)
                            : query.OrderByDescending(e => e.Position);
                        break;
                    case "department":
                        query = isAscending 
                            ? query.OrderBy(e => e.Department)
                            : query.OrderByDescending(e => e.Department);
                        break;
                    case "evaluationdate":
                        query = isAscending 
                            ? query.OrderBy(e => e.EvaluationDate)
                            : query.OrderByDescending(e => e.EvaluationDate);
                        break;
                    default:
                        // Tri par défaut si la clé de tri n'est pas reconnue
                        query = query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName);
                        break;
                }
            }

            // Calculer le nombre total d'éléments
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // Paginer les résultats
            var employees = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (employees, totalPages);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _dataService.GetUserByEmailAsync(email);
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _dataService.GetUserByIdAsync(userId);
        }

        // Méthode pour mettre à jour un utilisateur
        public async Task<string> UpdateUserAsync(User user)
        {
            try
            {
                // Vérifier si un autre utilisateur a déjà ce nom d'utilisateur
                if (!string.IsNullOrWhiteSpace(user.Username))
                {
                    var existingUser = await _userRepository.GetFirstOrDefaultAsync(u => u.Username == user.Username && u.Id != user.Id);
                    if (existingUser != null)
                    {
                        throw new Exception("Ce nom d'utilisateur est déjà utilisé.");
                    }
                }

                // Vérifier si un autre utilisateur a déjà cet email
                if (!string.IsNullOrWhiteSpace(user.Email))
                {
                    var existingUser = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == user.Email && u.Id != user.Id);
                    if (existingUser != null)
                    {
                        throw new Exception("Cet email est déjà utilisé.");
                    }
                }

                await _userRepository.UpdateAsync(user);
                return "Utilisateur mis à jour avec succès.";
            }
            catch (Exception ex)
            {
                throw new Exception($"Erreur lors de la mise à jour de l'utilisateur: {ex.Message}");
            }
        }

        // Get all roles
        public async Task<IEnumerable<object>> GetRolesAsync()
        {
            var roles = await _dataService.GetAllRolesAsync();
            return roles
                .Where(r => r.state == null || r.state == 1)
                .Select(r => new { roleId = r.Roleid, name = r.Title })
                .ToList();
        }

        // Get paginated users with search
        public async Task<(IEnumerable<object> Users, int TotalPages)> GetPaginatedUsersAsync(int pageNumber, int pageSize, string? search)
        {
            string whereClause = string.IsNullOrEmpty(search)
                ? "1=1"
                : $"u.first_name LIKE @p2 OR u.last_name LIKE @p2 OR u.username LIKE @p2 OR u.Email LIKE @p2";

            string searchParam = string.IsNullOrEmpty(search) ? "" : $"%{search}%";
            var parameters = new List<object> { pageSize, (pageNumber - 1) * pageSize };
            if (!string.IsNullOrEmpty(search))
            {
                parameters.Add(searchParam);
            }

            var users = await _dataService.ExecuteReaderAsync($@"
                SELECT u.UserId, u.last_name, u.first_name, u.username, u.Email, u.role_id,
                       r.Title AS RoleTitle,
                       COUNT(*) OVER() AS TotalCount
                FROM Users u
                LEFT JOIN Roles r ON u.role_id = r.Role_id
                WHERE {whereClause}
                ORDER BY u.last_name, u.first_name
                OFFSET @p1 ROWS
                FETCH NEXT @p0 ROWS ONLY",
                parameters.ToArray());

            var totalItems = users.FirstOrDefault()?.ContainsKey("TotalCount") == true
                ? Convert.ToInt32(users.First()["TotalCount"])
                : 0;

            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var userList = users.Select(row => new
            {
                Id = Convert.ToInt32(row["UserId"]),
                LastName = row["last_name"]?.ToString(),
                FirstName = row["first_name"]?.ToString(),
                Username = row["username"]?.ToString(),
                Email = row["Email"]?.ToString(),
                RoleId = row.ContainsKey("role_id") ? Convert.ToInt32(row["role_id"]) : 0,
                Role = row.ContainsKey("RoleTitle") ? new { Title = row["RoleTitle"]?.ToString() ?? "" } : null
            }).ToList();

            return (userList, totalPages);
        }
    }
}
