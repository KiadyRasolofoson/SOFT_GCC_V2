using CsvHelper;
using DocumentFormat.OpenXml.Packaging;
using OfficeOpenXml;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using System.Globalization;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class FileProcessingService : IFileProcessingService
    {
        // Lecture des fichiers DOCX
        public string ExtractTextFromDocx(Stream fileStream)
        {
            using (var wordDoc = WordprocessingDocument.Open(fileStream, false))
            {
                var body = wordDoc.MainDocumentPart.Document.Body;
                return body.InnerText; // Retourne le contenu brut du fichier Word
            }
        }

        // Lecture des fichiers Excel
        public List<string[]> ExtractDataFromExcel(Stream fileStream)
        {
            var data = new List<string[]>();
            using (var package = new ExcelPackage(fileStream))
            {
                var worksheet = package.Workbook.Worksheets[0]; // Lit la première feuille
                for (int row = 1; row <= worksheet.Dimension.Rows; row++)
                {
                    var rowData = new List<string>();
                    for (int col = 1; col <= worksheet.Dimension.Columns; col++)
                    {
                        rowData.Add(worksheet.Cells[row, col].Text);
                    }
                    data.Add(rowData.ToArray());
                }
            }
            return data;
        }

        // Lecture des fichiers CSV
        public List<dynamic> ExtractDataFromCsv(Stream fileStream)
        {
            using (var reader = new StreamReader(fileStream))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                return csv.GetRecords<dynamic>().ToList(); // Retourne une liste dynamique pour les colonnes
            }
        }
    }
}
