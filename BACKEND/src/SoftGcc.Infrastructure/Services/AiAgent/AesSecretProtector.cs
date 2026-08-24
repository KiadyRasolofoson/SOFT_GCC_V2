using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SoftGcc.Application.Common.Interfaces.AiAgent;

namespace SoftGcc.Infrastructure.Services.AiAgent;

public sealed class AesSecretProtector : ISecretProtector
{
    private readonly byte[] _key;

    public AesSecretProtector(IConfiguration configuration)
    {
        var secret = configuration["AiAgent:EncryptionKey"]
            ?? throw new InvalidOperationException("AiAgent:EncryptionKey est manquant dans la configuration.");

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public string Protect(string plainText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(plainText);

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor();
        var plain = Encoding.UTF8.GetBytes(plainText);
        var cipher = encryptor.TransformFinalBlock(plain, 0, plain.Length);

        var payload = new byte[aes.IV.Length + cipher.Length];
        Buffer.BlockCopy(aes.IV, 0, payload, 0, aes.IV.Length);
        Buffer.BlockCopy(cipher, 0, payload, aes.IV.Length, cipher.Length);
        return Convert.ToBase64String(payload);
    }

    public string Unprotect(string protectedText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(protectedText);

        var payload = Convert.FromBase64String(protectedText);
        if (payload.Length < 17)
            throw new CryptographicException("Secret chiffré invalide.");

        using var aes = Aes.Create();
        aes.Key = _key;
        var iv = payload.AsSpan(0, 16).ToArray();
        var cipher = payload.AsSpan(16).ToArray();
        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        var plain = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
        return Encoding.UTF8.GetString(plain);
    }
}
