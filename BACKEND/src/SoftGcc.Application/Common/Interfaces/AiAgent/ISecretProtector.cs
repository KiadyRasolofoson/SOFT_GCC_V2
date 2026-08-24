namespace SoftGcc.Application.Common.Interfaces.AiAgent;

public interface ISecretProtector
{
    string Protect(string plainText);
    string Unprotect(string protectedText);
}
