namespace LicenseGenerator.UI.Models
{
    /// <summary>
    /// Représente le payload d'une licence avant signature RSA.
    /// ⚠️ Les noms de propriétés DOIVENT être en PascalCase pour correspondre
    /// exactement à la désérialisation du LicenseValidator backend.
    /// </summary>
    public class LicensePayload
    {
        public string LicenseId { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; } = string.Empty;
        public string MachineId { get; set; } = string.Empty;
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpireAt { get; set; }
        public string LicenseType { get; set; } = "Standard";
        public List<string> Features { get; set; } = new();
    }
}
