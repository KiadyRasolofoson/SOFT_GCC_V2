using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using System.Text;
using System.Text.RegularExpressions;

namespace soft_carriere_competence.Application.Services.PDFExtraction
{
    public class PdfExtractionService
    {
        private readonly ILogger<PdfExtractionService> _logger;

        public PdfExtractionService(ILogger<PdfExtractionService> logger)
        {
            _logger = logger;
        }

        public async Task<EvaluationExtractedDto> ExtractDataFromPdfAsync(IFormFile file, int employeeId)
        {
            try
            {
                _logger.LogInformation($"Début de l'extraction de données PDF pour l'employé: {employeeId}");
                
                if (file == null || file.Length == 0)
                    throw new ArgumentException("Aucun fichier fourni");
                
                if (file.ContentType != "application/pdf")
                    throw new ArgumentException("Le fichier doit être au format PDF");
                
                // Extraire le texte du PDF
                string pdfText = await ExtractTextFromPdfAsync(file);
                _logger.LogInformation($"Texte extrait du PDF, longueur: {pdfText.Length} caractères");
                
                // Analyser le texte pour extraire les données structurées
                var extractedData = ParsePdfContent(pdfText, employeeId);
                _logger.LogInformation($"Données extraites: {extractedData.Questions.Count} questions, moyenne: {extractedData.Average}");
                
                return extractedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'extraction des données du PDF");
                throw;
            }
        }
        
        private async Task<string> ExtractTextFromPdfAsync(IFormFile file)
        {
            using var memStream = new MemoryStream();
            await file.CopyToAsync(memStream);
            memStream.Position = 0;
            
            var text = new StringBuilder();
            using (var reader = new PdfReader(memStream))
            {
                for (int page = 1; page <= reader.NumberOfPages; page++)
                {
                    text.Append(PdfTextExtractor.GetTextFromPage(reader, page));
                    text.Append("\n\n"); // Séparateur de pages pour faciliter l'analyse
                }
            }
            
            return text.ToString();
        }
        
        private EvaluationExtractedDto ParsePdfContent(string pdfText, int employeeId)
        {
            var data = new EvaluationExtractedDto
            {
                EmployeeId = employeeId,
                Questions = new List<QuestionResponseDto>(),
                Average = 0
            };
            
            try {
                // Extraire le type d'évaluation
                var typeMatch = Regex.Match(pdfText, @"Type:?\s*([^\r\n]+)");
                if (typeMatch.Success)
                    data.EvaluationType = typeMatch.Groups[1].Value.Trim();
                
                // Extraire la note moyenne
                var averageMatch = Regex.Match(pdfText, @"Note moyenne:?\s*(\d+(\.\d+)?)/5");
                if (averageMatch.Success && decimal.TryParse(averageMatch.Groups[1].Value, out decimal avg))
                    data.Average = avg;
                
                // Extraire les notes - ce modèle doit correspondre à la structure de votre PDF
                // Rechercher dans la section DÉTAIL DES ÉVALUATIONS
                var detailsSection = ExtractSection(pdfText, "DÉTAIL DES ÉVALUATIONS", "VALIDATION");
                if (!string.IsNullOrEmpty(detailsSection))
                {
                    // Extraction basée sur le tableau
                    // Modèle: "Question Compétence Note Commentaire"
                    var lines = detailsSection.Split('\n')
                        .Where(line => line.Trim().Length > 0)
                        .ToArray();
                    
                    // Analyser chaque ligne du tableau après les en-têtes
                    bool headerFound = false;
                    foreach (var line in lines)
                    {
                        // Si on trouve la ligne d'en-tête
                        if (line.Contains("Question") && line.Contains("Compétence") && 
                            line.Contains("Note") && line.Contains("Commentaire"))
                        {
                            headerFound = true;
                            continue; // Passer à la ligne suivante
                        }
                        
                        // Traiter les lignes de données après l'en-tête
                        if (headerFound && !line.Trim().StartsWith("*"))
                        {
                            // Tenter d'extraire les colonnes
                            var questionMatch = ExtractQuestion(line);
                            if (questionMatch != null)
                            {
                                data.Questions.Add(questionMatch);
                            }
                        }
                    }
                }
                
                // Extraire éventuellement les notes générales
                var notesMatch = Regex.Match(pdfText, @"Notes:?\s*([^\r\n]+)");
                if (notesMatch.Success)
                    data.Notes = notesMatch.Groups[1].Value.Trim();
                
                // Si aucune question n'est trouvée, essayer une autre approche
                if (data.Questions.Count == 0)
                {
                    // Alternative: rechercher directement des motifs de question/note/commentaire
                    var questionPattern = @"([^\n]{20,200})\s+(\d+)/5\s+([^\n]+)";
                    var questionMatches = Regex.Matches(pdfText, questionPattern, RegexOptions.Singleline);
                    
                    foreach (Match match in questionMatches)
                    {
                        if (match.Groups.Count >= 3)
                        {
                            string questionText = match.Groups[1].Value.Trim();
                            string ratingText = match.Groups[2].Value.Trim();
                            string comment = match.Groups[3].Value.Trim();
                            
                            // Valider et ajouter
                            if (!string.IsNullOrEmpty(questionText) && 
                                int.TryParse(ratingText, out int rating) && 
                                rating >= 0 && rating <= 5)
                            {
                                data.Questions.Add(new QuestionResponseDto
                                {
                                    QuestionText = questionText,
                                    Rating = rating,
                                    Comment = comment
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'analyse du contenu PDF");
            }
            
            return data;
        }

        private QuestionResponseDto ExtractQuestion(string line)
        {
            try
            {
                // Traiter une ligne du tableau des questions
                // Exemple: "Comment évaluez-vous...   Communication   4/5   Bonne communication"
                var columns = SplitTableLine(line);
                if (columns.Length >= 4)
                {
                    string questionText = columns[0].Trim();
                    string competenceName = columns[1].Trim();
                    
                    // Extraire la note (format X/5)
                    string ratingText = columns[2].Trim();
                    var ratingMatch = Regex.Match(ratingText, @"(\d+)/5");
                    int rating = ratingMatch.Success && int.TryParse(ratingMatch.Groups[1].Value, out int r) 
                        ? r : 0;
                    
                    string comment = columns[3].Trim();
                    
                    return new QuestionResponseDto
                    {
                        QuestionText = questionText,
                        CompetenceName = competenceName,
                        Rating = rating,
                        Comment = comment
                    };
                }
                return null;
            }
            catch
            {
                return null;
            }
        }
        
        private string[] SplitTableLine(string line)
        {
            // Cette fonction est simplifiée et pourrait nécessiter des ajustements
            // selon la structure exacte de votre PDF
            // Diviser en colonnes par espaces, en tenant compte des multiples espaces
            return Regex.Split(line, @"\s{2,}");
        }
        
        private string ExtractSection(string text, string startMarker, string endMarker)
        {
            int startPos = text.IndexOf(startMarker);
            if (startPos < 0) return string.Empty;
            
            startPos += startMarker.Length;
            int endPos = text.IndexOf(endMarker, startPos);
            
            if (endPos < 0) endPos = text.Length;
            
            return text.Substring(startPos, endPos - startPos).Trim();
        }
    }
} 