namespace soft_carriere_competence.Core.Interface.EvaluationInterface
{
    public interface IFileProcessingService
    {
        string ExtractTextFromDocx(Stream fileStream);
        List<string[]> ExtractDataFromExcel(Stream fileStream);
        List<dynamic> ExtractDataFromCsv(Stream fileStream);
    }
}
