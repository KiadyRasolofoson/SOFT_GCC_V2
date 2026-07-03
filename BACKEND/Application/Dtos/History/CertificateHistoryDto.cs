namespace soft_carriere_competence.Application.Dtos.History
{
    public class CertificateHistoryDto
    {
        public int Id { get; set; }
        public string? RegistrationNumber { get; set; }
        public int? CertificateTypeId { get; set; }
        public string? Reference { get; set; }
        public string? FileName { get; set; }
        public int? State { get; set; }
        public string? ContentType { get; set; }
        public long FileSize { get; set; } // en octets
        public DateTime? CreatedAt { get; set; }
    }
}
