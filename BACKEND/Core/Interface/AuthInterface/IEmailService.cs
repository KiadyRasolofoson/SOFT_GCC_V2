namespace soft_carriere_competence.Core.Interface.AuthInterface
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);

    }
}
