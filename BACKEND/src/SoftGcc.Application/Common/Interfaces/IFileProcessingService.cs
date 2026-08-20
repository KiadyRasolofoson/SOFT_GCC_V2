namespace SoftGcc.Application.Common.Interfaces
{
    public interface IFileProcessingService
    {
        string ExtractTextFromDocx(Stream fileStream);
        List<string[]> ExtractDataFromExcel(Stream fileStream);
        List<dynamic> ExtractDataFromCsv(Stream fileStream);
    }
}
