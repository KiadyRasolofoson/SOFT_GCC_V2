namespace soft_carriere_competence.Application.Dtos.LoginDto
{
    public class RegisterDto
    {
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string Username { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }
    }
}
