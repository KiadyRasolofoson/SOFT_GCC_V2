using System.Security.Cryptography;

namespace SoftGcc.Application.Common.Interfaces;

public interface IRsaPublicKeyProvider
{
    string PublicKey { get; }
    RSA GetRsa();
}
