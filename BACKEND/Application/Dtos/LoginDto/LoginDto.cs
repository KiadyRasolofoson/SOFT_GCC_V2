namespace soft_carriere_competence.Application.Dtos.LoginDto
{
    public class LoginDto
    {
        // Le champ identifier peut être soit un nom d'utilisateur soit un email
        public string Identifier { get; set; }
        public string Password { get; set; }
    }
}
