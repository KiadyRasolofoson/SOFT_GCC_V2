using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;
using System.Text;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationHistoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IGenericRepository<VEvaluationHistory> _evaluationHistoryRepository;
        private readonly EvaluationInterviewService _evaluationService;
        private readonly UserService _userService;
        private readonly IGenericRepository<Department> _departementRepository;
        private readonly IGenericRepository<Position> _posteRepository;





        public EvaluationHistoryService(ApplicationDbContext context, IGenericRepository<VEvaluationHistory> evaluationHistoryRepository, EvaluationInterviewService evaluationService
            , UserService userService, IGenericRepository<Department> departementRepository)
        {
            _context = context;
            _evaluationHistoryRepository = evaluationHistoryRepository;
            _evaluationService = evaluationService;
            _userService = userService;
            _departementRepository = departementRepository;
        }

        public async Task<List<EvaluationHistoryDto>> GetEvaluationHistoryAsync(
    DateTime? startDate,
    DateTime? endDate,
    string? evaluationType,
    string? department,
    string? employeeName)
        {
            var query = _context.vEvaluationHistories.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(e => e.StartDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(e => e.EndDate <= endDate.Value);

            if (!string.IsNullOrEmpty(evaluationType))
                query = query.Where(e => e.EvaluationType != null && e.EvaluationType == evaluationType);

            if (!string.IsNullOrEmpty(department))
                query = query.Where(e => e.Department != null && e.Department == department);

            if (!string.IsNullOrEmpty(employeeName))
                query = query.Where(e =>
                    (e.LastName != null && e.LastName.Contains(employeeName)) ||
                    (e.FirstName != null && e.FirstName.Contains(employeeName))
                );

            return await query.Select(e => new EvaluationHistoryDto
            {
                EvaluationId = e.EvaluationId,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                EvaluationType = e.EvaluationType ?? "",
                OverallScore = e.OverallScore,
                Status = e.status ,
                Recommendations = e.Recommendations ?? "",
                FirstName =e.FirstName,
                LastName=e.LastName,
                Position=e.Position
            }).ToListAsync();
        }

        public async Task<(IEnumerable<EvaluationHistoryDto> Evaluations, int TotalPages)> GetEvaluationHistoryPaginatedAsync(
    int pageNumber = 1,
    int pageSize = 10,
    DateTime? startDate = null,
    DateTime? endDate = null,
    string? evaluationType = null,
    string? department = null,
    string? employeeName = null)
        {
            var query = _context.vEvaluationHistories.AsQueryable();

            // Appliquer les filtres
            if (startDate.HasValue)
                query = query.Where(e => e.StartDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(e => e.EndDate <= endDate.Value);

            if (!string.IsNullOrEmpty(evaluationType))
                query = query.Where(e => e.EvaluationType != null && e.EvaluationType == evaluationType);

            if (!string.IsNullOrEmpty(department))
                query = query.Where(e => e.Department != null && e.Department == department);

            if (!string.IsNullOrEmpty(employeeName))
                query = query.Where(e => e.LastName != null && e.LastName.Contains(employeeName));

            // Calculer le nombre total d'éléments
            var totalItems = await query.CountAsync();

            // Calculer le nombre total de pages
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // Paginer les résultats
            var evaluations = await query
                .Select(e => new EvaluationHistoryDto
                {
                    EvaluationId = e.EvaluationId,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    EvaluationType = e.EvaluationType ?? "",
                    OverallScore = e.OverallScore,
                    Status = e.status,
                    Recommendations = e.Recommendations ?? "",
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    Position = e.Position
                })
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (evaluations, totalPages);
        }

        public async Task<EvaluationHistoryDetailDto> GetEvaluationDetailAsync(int evaluationId)
        {
            // Charger les informations principales de l'évaluation
            var evaluation = await _context.vEvaluationHistories
                .Where(e => e.EvaluationId == evaluationId)
                .Select(e => new
                {
                    e.EvaluationId,
                    e.LastName,
                    e.FirstName,
                    e.Position,
                    e.EvaluationType,
                    e.StartDate,
                    e.EndDate,
                    e.OverallScore,
                    e.EvaluationComments,
                    e.Strengths,
                    e.Weaknesses,
                    e.Department,
                    e.InterviewDate,
                    e.InterviewStatus,
                    e.Recommendations,
                    e.ParticipantNames
                })
                .FirstOrDefaultAsync();

            if (evaluation == null)
                throw new KeyNotFoundException("Evaluation not found.");

            // Charger les détails des questions séparément et les mapper vers le DTO
            var questionDetails = await _context.EvaluationQuestionnaires
                .Where(q => q.EvaluationId == evaluationId)
                .Select(q => new QuestionDetailDto
                {
                    QuestionId = q.questionId,
                    Question = q.evaluationQuestion.question,
                    Score = q.Score
                })
                .ToListAsync();

            // Transform ParticipantNames en une liste
            var participants = evaluation.ParticipantNames?
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(name => name.Trim())
                .ToList();

            return new EvaluationHistoryDetailDto
            {
                EvaluationId = evaluation.EvaluationId,
                LastName = evaluation.LastName,
                FirstName = evaluation.FirstName,
                Position = evaluation.Position,
                EvaluationType = evaluation.EvaluationType,
                StartDate = evaluation.StartDate,
                EndDate = evaluation.EndDate,
                OverallScore = evaluation.OverallScore,
                EvaluationComments = evaluation.EvaluationComments,
                Strengths = evaluation.Strengths,
                Weaknesses = evaluation.Weaknesses,
                Department = evaluation.Department,
                InterviewDate = evaluation.InterviewDate,
                InterviewStatus = evaluation.InterviewStatus,
                Recommendations = evaluation.Recommendations,
                Participants = participants,
                QuestionDetails = questionDetails // Utilisation du nouveau DTO
            };
        }

        public async Task<StatisticsDto> GetEvaluationStatisticsAsync(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.vEvaluationHistories.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(e => e.StartDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(e => e.EndDate <= endDate.Value);

            var totalEvaluations = await query.CountAsync();
            var completedEvaluations = await query.CountAsync(e => e.status == 20);

            var evaluationTypeDistribution = await query
                .GroupBy(e => e.EvaluationType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Type, x => x.Count);

            return new StatisticsDto
            {
                TotalEvaluations = totalEvaluations,
                CompletedEvaluations = completedEvaluations,
                CompletionRate = totalEvaluations > 0
                    ? (decimal)completedEvaluations / totalEvaluations * 100 : 0,
                EvaluationTypeDistribution = evaluationTypeDistribution
            };
        }


        public async Task<IEnumerable<GlobalPerformanceDto>> GetGlobalPerformanceAsync(DateTime? startDate, DateTime? endDate, string department, string evaluationType)
        {
            try
            {
                var query = _context.vEvaluationHistories.AsQueryable();

                if (startDate.HasValue)
                {
                    query = query.Where(e => e.StartDate >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(e => e.EndDate <= endDate.Value);
                }

                if (!string.IsNullOrEmpty(department))
                {
                    query = query.Where(e => e.Department == department);
                }

                if (!string.IsNullOrEmpty(evaluationType))
                {
                    query = query.Where(e => e.EvaluationType == evaluationType);
                }

                // Vérification qu'il y a des données après filtrage
                if (!await query.AnyAsync())
                {
                    Console.WriteLine("Aucune donnée trouvée après application des filtres");
                    return new List<GlobalPerformanceDto>();
                }

                var groupedData = await query
                    .GroupBy(e => e.StartDate.Year)
                    .Select(g => new
                    {
                        Year = g.Key,
                        // Vérifier que OverallScore existe et n'est pas null avant de calculer la moyenne
                        AverageScore = g.Any(e => e.OverallScore.HasValue) ? 
                                      g.Where(e => e.OverallScore.HasValue)
                                       .Average(e => e.OverallScore.Value) : 
                                      (decimal?)null,
                        EvaluationCount = g.Count(),
                        Department = department
                    })
                    .ToListAsync();

                // Convertir en DTO avec une gestion sûre des nulls
                var result = groupedData.Select(g => new GlobalPerformanceDto
                {
                    Year = g.Year,
                    AverageScore = g.AverageScore ?? 0, // Utiliser 0 si la moyenne est null
                    EvaluationCount = g.EvaluationCount,
                    Department = g.Department
                }).ToList();

                Console.WriteLine($"Données groupées récupérées: {result.Count()} entrées");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception dans GetGlobalPerformanceAsync: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                
                // Retourner une liste vide en cas d'erreur
                return new List<GlobalPerformanceDto>();
            }
        }

        public async Task<KPIResult> GetKPIsAsync(DateTime? startDate, DateTime? endDate, string? departmentName)
        {
            try
            {
                Console.WriteLine($"Recherche de KPI pour département: {departmentName ?? "tous"}, startDate: {startDate?.ToString("yyyy-MM-dd")}, endDate: {endDate?.ToString("yyyy-MM-dd")}");
            
                // Utiliser directement vEvaluationHistories pour plus de fiabilité
                var query = _context.vEvaluationHistories.AsQueryable();
            
                // Appliquer les filtres
                if (startDate.HasValue)
                {
                    Console.WriteLine($"Filtrage par date de début: {startDate.Value.ToString("yyyy-MM-dd")}");
                    query = query.Where(e => e.StartDate >= startDate.Value);
                }
            
                if (endDate.HasValue)
                {
                    Console.WriteLine($"Filtrage par date de fin: {endDate.Value.ToString("yyyy-MM-dd")}");
                    query = query.Where(e => e.EndDate <= endDate.Value);
                }
            
                // Filtrer par département si spécifié
                if (!string.IsNullOrEmpty(departmentName))
                {
                    Console.WriteLine($"Filtrage par département: {departmentName}");
                    query = query.Where(e => e.Department == departmentName);
                }
                
                // Ajouter une protection contre les valeurs NULL pour éviter les exceptions
                query = query.Where(e => e.EvaluationId != 0);
                
                List<VEvaluationHistory> evaluations = new List<VEvaluationHistory>();
                try
                {
                    // Récupérer les données filtrées de manière sûre
                    evaluations = await query.ToListAsync();
                    Console.WriteLine($"Nombre d'évaluations trouvées après filtrage: {evaluations.Count}");
                    
                    // Afficher la distribution des statuts
                    try {
                        var statusDistribution = evaluations
                            .GroupBy(e => e.status) // status est déjà un int non-nullable
                            .Select(g => new { Status = g.Key, Count = g.Count() })
                            .OrderBy(x => x.Status);
                        
                        Console.WriteLine("Distribution des statuts :");
                        foreach (var statusGroup in statusDistribution)
                        {
                            Console.WriteLine($"  Status {statusGroup.Status}: {statusGroup.Count} évaluations");
                        }
                        
                        // Distribution des scores avec protection NULL
                        var scoreDistribution = evaluations
                            .Where(e => e.OverallScore.HasValue)
                            .GroupBy(e => (int)Math.Floor((double)e.OverallScore.Value))
                            .Select(g => new { ScoreBin = g.Key, Count = g.Count() })
                            .OrderBy(x => x.ScoreBin);
                            
                        Console.WriteLine("Distribution des scores :");
                        foreach (var scoreGroup in scoreDistribution)
                        {
                            Console.WriteLine($"  Score {scoreGroup.ScoreBin}: {scoreGroup.Count} évaluations");
                        }
                    }
                    catch (Exception ex) {
                        Console.WriteLine($"Erreur non critique lors du calcul des distributions: {ex.Message}");
                    }
                    
                    // Si aucune donnée, utiliser des statistiques minimales mais non nulles
                    if (!evaluations.Any())
                    {
                        Console.WriteLine("Aucune évaluation trouvée, retour de valeurs par défaut");
                        // Utiliser des valeurs plus représentatives pour le cas "pas de données"
                        return new KPIResult
                        {
                            ParticipationRate = 0,
                            ApprovalRate = 0,
                            OverallAverage = 0,
                            TotalEvaluations = 0
                        };
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception lors de la récupération des évaluations: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                    
                    // Retourner des valeurs par défaut en cas d'erreur
                    return new KPIResult
                    {
                        ParticipationRate = 0,
                        ApprovalRate = 0,
                        OverallAverage = 0,
                        TotalEvaluations = 0
                    };
                }

                // MODIFICATION: Récupérer les IDs d'évaluation à partir des résultats filtrés
                var filteredEvaluationIds = evaluations.Select(e => e.EvaluationId).ToList();

                // MODIFICATION: Récupérer les évaluations complètes avec une gestion d'erreur robuste
                List<Evaluation> completeEvaluations = new List<Evaluation>();
                try 
                {
                    // Approche alternative plus sûre utilisant LINQ et des protections contre les valeurs NULL
                    completeEvaluations = await _context.Evaluations
                        .AsNoTracking()
                        .Where(e => filteredEvaluationIds.Contains(e.EvaluationId))
                        .Where(e => e.EmployeeId != 0 && e.state != null) // Protection contre les NULLs
                        .ToListAsync();
                    
                    Console.WriteLine($"Requête d'évaluations réussie: {completeEvaluations.Count} évaluations récupérées");
                }
                catch (Exception ex)
                {
                    // En cas d'erreur, enregistrer l'erreur mais continuer avec une liste vide
                    Console.WriteLine($"Erreur lors de la récupération des évaluations complètes: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                }

                // Vérifier qu'on a bien récupéré des évaluations
                Console.WriteLine($"Nombre d'évaluations complètes récupérées: {completeEvaluations.Count}");

                // MODIFICATION: Obtenir les employés uniques qui ont des évaluations actives
                var uniqueParticipatingEmployeeIds = completeEvaluations
                    .Where(e => e.state != 40) // Exclure les évaluations annulées
                    .Select(e => e.EmployeeId)
                    .Distinct()
                    .ToList();

                var uniqueParticipatingEmployees = uniqueParticipatingEmployeeIds.Count;
                Console.WriteLine($"Nombre d'employés uniques ayant participé: {uniqueParticipatingEmployees}");
                
                // MODIFICATION: Compter le nombre total d'employés éligibles selon les mêmes filtres
                var totalEligibleEmployeesQuery = _context.Employee.AsQueryable();
                
                // Appliquer le filtre de département si spécifié
                int? departmentId = null;
                if (!string.IsNullOrEmpty(departmentName))
                {
                    try
                    {
                        // Rechercher l'ID du département par son nom
                        var departments = await _departementRepository.GetAllAsync();
                        departmentId = departments
                            .Where(d => d != null && d.Name != null) // Protection contre les valeurs NULL
                            .FirstOrDefault(d => d.Name == departmentName)?.DepartmentId;
                        
                        Console.WriteLine($"ID de département trouvé pour '{departmentName}': {departmentId}");
                        
                        if (departmentId.HasValue)
                        {
                            totalEligibleEmployeesQuery = totalEligibleEmployeesQuery.Where(e => e.Department_id == departmentId.Value);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur lors de la recherche du département: {ex.Message}");
                    }
                }
                
                int totalEligibleEmployees = 0;
                try
                {
                    totalEligibleEmployees = await totalEligibleEmployeesQuery.CountAsync();
                    Console.WriteLine($"Nombre total d'employés éligibles: {totalEligibleEmployees}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erreur lors du comptage des employés éligibles: {ex.Message}");
                }

                // Calcul des KPI avec une approche plus flexible pour les statuts
                // Status 10 = Planifiée, 20 = En cours, 30 = Terminée, 40 = Annulée
                var allActiveEvaluations = evaluations.Count(e => e.status != 40); // Toutes sauf annulées
                var completedEvaluations = evaluations.Count(e => e.status >= 20); // En cours ou terminées 
                var approvedEvaluations = evaluations.Count(e => e.status == 30);  // Uniquement terminées
            
                // S'assurer que les scores sont disponibles et calculer une moyenne plus robuste
                var validScores = evaluations
                    .Where(e => e.OverallScore.HasValue && e.OverallScore > 0)
                    .Select(e => e.OverallScore.Value)
                    .ToList();
                
                var overallAverage = validScores.Any() ? validScores.Average() : 0;
            
                Console.WriteLine($"Évaluations actives: {allActiveEvaluations}, complétées: {completedEvaluations}, approuvées: {approvedEvaluations}");
                Console.WriteLine($"Scores valides: {validScores.Count}, moyenne: {overallAverage}");

                // MODIFICATION: Calculer le taux de participation avec la nouvelle méthode
                var participationRate = totalEligibleEmployees > 0 
                    ? (uniqueParticipatingEmployees / (double)totalEligibleEmployees) * 100 
                    : 0;
                
                var approvalRate = completedEvaluations > 0 ? (approvedEvaluations / (double)completedEvaluations) * 100 : 0;
            
                Console.WriteLine($"KPIs calculés - Participation: {participationRate}%, Approbation: {approvalRate}%, Moyenne: {overallAverage}");

                // Retourner les KPI
                return new KPIResult
                {
                    ParticipationRate = participationRate,
                    ApprovalRate = approvalRate,
                    OverallAverage = overallAverage,
                    TotalEvaluations = evaluations.Count
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception dans GetKPIsAsync: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                
                // Retourner des valeurs par défaut en cas d'erreur
                return new KPIResult
                {
                    ParticipationRate = 0,
                    ApprovalRate = 0,
                    OverallAverage = 0,
                    TotalEvaluations = 0
                };
            }
        }

        public async Task<(byte[] Content, string ContentType, string FileName)> ExportDataAsync(string format, DateTime? startDate, DateTime? endDate)
        {
            try
            {
                // Filtrage des évaluations par date
                var evaluations = _context.Evaluations
                    .Include(e => e.EvaluationType)
                    .Include(e => e.Employee)
                    .Where(e => (!startDate.HasValue || e.StartDate >= startDate) &&
                                (!endDate.HasValue || e.EndDate <= endDate))
                    .ToList();

                switch (format.ToLower())
                {
                    case "csv":
                        var csvContent = GenerateCsv(evaluations);
                        return (csvContent, "text/csv", "Evaluations.csv");

                    case "excel":
                        var excelContent = GenerateExcel(evaluations);
                        return (excelContent, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Evaluations.xlsx");

                    case "pdf":
                        var pdfContent = await GeneratePdfAsync(evaluations);
                        return (pdfContent, "application/pdf", "Evaluations.pdf");

                    default:
                        throw new ArgumentException("Format d'exportation non supporté.");
                }
            }
            catch (Exception ex)
            {
                // Log erreur (assurez-vous que le logger est configuré)
                Console.WriteLine("erreur rencontroler, "+ex.Message);
                throw; // Réémet l'exception pour renvoyer une erreur 500
            }
        }

        // Génération de contenu CSV
        private byte[] GenerateCsv(IEnumerable<Evaluation> evaluations)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Date,Type d'évaluation,Employé,Score Global,Statut");

            foreach (var eval in evaluations)
            {
                var date = eval.StartDate.ToString("yyyy-MM-dd") ?? "N/A";
                var type = eval.EvaluationType?.Designation ?? "Inconnu";
                var employee = $"{eval.Employee?.FirstName ?? "N/A"} {eval.Employee?.Name ?? "N/A"}";
                var score = eval.OverallScore?.ToString() ?? "N/A";
                var state = eval.state;

                builder.AppendLine($"{date},{type},{employee},{score},{state}");
            }

            return Encoding.UTF8.GetBytes(builder.ToString());
        }


        // Génération de contenu Excel
        private byte[] GenerateExcel(IEnumerable<Evaluation> evaluations)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Historique des Évaluations");

            worksheet.Cell(1, 1).Value = "Date";
            worksheet.Cell(1, 2).Value = "Type d'évaluation";
            worksheet.Cell(1, 3).Value = "Employé";
            worksheet.Cell(1, 4).Value = "Score Global";
            worksheet.Cell(1, 5).Value = "Statut";

            int row = 2;
            foreach (var eval in evaluations)
            {
                worksheet.Cell(row, 1).Value = eval.StartDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 2).Value = eval.EvaluationType.Designation;
                worksheet.Cell(row, 3).Value = $"{eval.Employee.FirstName} {eval.Employee.Name}";
                worksheet.Cell(row, 4).Value = eval.OverallScore;
                worksheet.Cell(row, 5).Value = eval.state;
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        // Génération de contenu PDF
        private async Task<byte[]> GeneratePdfAsync(IEnumerable<Evaluation> evaluations)
        {
            using var stream = new MemoryStream();

            // Création du document PDF
            var document = new iTextSharp.text.Document();
            var writer = iTextSharp.text.pdf.PdfWriter.GetInstance(document, stream);
            document.Open();

            // Titre du document
            var titleFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA_BOLD, 16);
            var bodyFont = iTextSharp.text.FontFactory.GetFont(iTextSharp.text.FontFactory.HELVETICA, 12);

            document.Add(new iTextSharp.text.Paragraph("Historique des Évaluations", titleFont));
            document.Add(new iTextSharp.text.Paragraph("\n")); // Ligne vide

            // Ajout des données d'évaluation
            foreach (var eval in evaluations)
            {
                document.Add(new iTextSharp.text.Paragraph($"Date : {eval.StartDate:yyyy-MM-dd}", bodyFont));
                document.Add(new iTextSharp.text.Paragraph($"Type d'évaluation : {eval.EvaluationType.Designation}", bodyFont));
                document.Add(new iTextSharp.text.Paragraph($"Employé : {eval.Employee.FirstName} {eval.Employee.Name}", bodyFont));
                document.Add(new iTextSharp.text.Paragraph($"Score Global : {eval.OverallScore}", bodyFont));
                document.Add(new iTextSharp.text.Paragraph($"Statut : {eval.state}", bodyFont));
                document.Add(new iTextSharp.text.Paragraph("\n")); // Ligne vide
            }

            document.Close();

            // Retourner le contenu du PDF en tant que tableau d'octets
            return stream.ToArray();
        }


        public async Task<Position> GetPosteByIdAsync(int posteId)
        {
            return await _posteRepository.GetByIdAsync(posteId);
        }

        public async Task<Department> GetDepartmentByIdAsync(int departmentId)
        {
            return await _departementRepository.GetByIdAsync(departmentId);
        }

        public async Task<IEnumerable<Position>> GetAllPostesAsync()
        {
            return await _posteRepository.GetAllAsync();
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsAsync()
        {
            try
            {
                return await _departementRepository.GetAllAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des départements : {ex.Message}");
                return new List<Department>();
            }
        }

        public async Task<DetailedStatisticsDto> GetDetailedStatisticsAsync(DateTime? startDate, DateTime? endDate, string? department = null, string? evaluationType = null)
        {
            try
            {
                var query = _context.vEvaluationHistories.AsQueryable();

                // Appliquer les filtres
                if (startDate.HasValue)
                    query = query.Where(e => e.StartDate >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(e => e.EndDate <= endDate.Value);

                if (!string.IsNullOrEmpty(department))
                    query = query.Where(e => e.Department == department);

                if (!string.IsNullOrEmpty(evaluationType))
                    query = query.Where(e => e.EvaluationType == evaluationType);

                // Récupérer toutes les évaluations filtrées
                var evaluations = await query.ToListAsync();
                
                // Valeurs par défaut en cas de données vides
                var defaultStats = new DetailedStatisticsDto
                {
                    ScoreDistribution = new ScoreDistributionDto 
                    {
                        Low = 0,
                        Medium = 0,
                        High = 0,
                        Average = 0,
                        Min = 0,
                        Max = 0
                    },
                    DepartmentDistribution = new List<DistributionItemDto>(),
                    EvaluationTypeDistribution = new List<DistributionItemDto>(),
                    PerformanceByYear = new List<YearlyPerformanceDto>(),
                    TrendData = new TrendDto 
                    { 
                        IsIncreasing = false,
                        PercentageChange = 0,
                        StartValue = 0,
                        EndValue = 0,
                        StandardDeviation = 0
                    }
                };
                
                if (evaluations.Count == 0)
                {
                    return defaultStats;
                }

                // Utilisation de valeurs sûres avec ?? pour éviter les NullReferenceException
                var validScores = evaluations.Where(e => e.OverallScore.HasValue).Select(e => e.OverallScore.Value).ToList();
                
                // 1. Distribution des scores - avec vérification des nulls
                var scoreDistribution = new ScoreDistributionDto
                {
                    Low = evaluations.Count(e => e.OverallScore.HasValue && e.OverallScore.Value < 2.5m),
                    Medium = evaluations.Count(e => e.OverallScore.HasValue && e.OverallScore.Value >= 2.5m && e.OverallScore.Value < 4m),
                    High = evaluations.Count(e => e.OverallScore.HasValue && e.OverallScore.Value >= 4m),
                    Average = validScores.Any() ? validScores.Average() : 0m,
                    Min = validScores.Any() ? validScores.Min() : 0m,
                    Max = validScores.Any() ? validScores.Max() : 0m
                };

                // 2. Distribution par département - avec vérification des nulls
                var departmentDistribution = await query
                    .GroupBy(e => e.Department)
                    .Where(g => g.Key != null)
                    .Select(g => new DistributionItemDto
                    {
                        Label = g.Key ?? "Non défini",
                        Value = g.Count(),
                        AverageScore = g.Any(e => e.OverallScore.HasValue) ? g.Where(e => e.OverallScore.HasValue).Average(e => e.OverallScore.Value) : 0m
                    })
                    .ToListAsync();

                // 3. Distribution par type d'évaluation - avec vérification des nulls
                var evaluationTypeDistribution = await query
                    .GroupBy(e => e.EvaluationType)
                    .Where(g => g.Key != null)
                    .Select(g => new DistributionItemDto
                    {
                        Label = g.Key ?? "Non défini",
                        Value = g.Count(),
                        AverageScore = g.Any(e => e.OverallScore.HasValue) ? g.Where(e => e.OverallScore.HasValue).Average(e => e.OverallScore.Value) : 0m
                    })
                    .ToListAsync();

                // 4. Performance par année - avec vérification des nulls
                var performanceByYear = await query
                    .GroupBy(e => e.StartDate.Year)
                    .Select(g => new YearlyPerformanceDto
                    {
                        Year = g.Key,
                        AverageScore = g.Any(e => e.OverallScore.HasValue) ? g.Where(e => e.OverallScore.HasValue).Average(e => e.OverallScore.Value) : 0m,
                        Count = g.Count(),
                        BestDepartment = g.GroupBy(e => e.Department)
                                        .Where(dg => dg.Key != null)
                                        .OrderByDescending(dg => dg.Any(e => e.OverallScore.HasValue) ? 
                                            dg.Where(e => e.OverallScore.HasValue).Average(e => e.OverallScore.Value) : 0m)
                                        .Select(dg => dg.Key)
                                        .FirstOrDefault() ?? "N/A"
                    })
                    .OrderBy(y => y.Year)
                    .ToListAsync();

                // 5. Données de tendance - avec vérification des valeurs vides et division par zéro
                var trendData = new TrendDto
                {
                    IsIncreasing = performanceByYear.Count > 1 && 
                                performanceByYear.Last().AverageScore > performanceByYear.First().AverageScore,
                    PercentageChange = performanceByYear.Count > 1 && performanceByYear.First().AverageScore != 0 ?
                                    (performanceByYear.Last().AverageScore - performanceByYear.First().AverageScore) / 
                                    performanceByYear.First().AverageScore * 100 : 0,
                    StartValue = performanceByYear.FirstOrDefault()?.AverageScore ?? 0,
                    EndValue = performanceByYear.LastOrDefault()?.AverageScore ?? 0,
                    StandardDeviation = CalculateStandardDeviation(validScores)
                };

                // Retourner toutes les statistiques
                return new DetailedStatisticsDto
                {
                    ScoreDistribution = scoreDistribution,
                    DepartmentDistribution = departmentDistribution,
                    EvaluationTypeDistribution = evaluationTypeDistribution,
                    PerformanceByYear = performanceByYear,
                    TrendData = trendData
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du calcul des statistiques détaillées: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // En cas d'erreur, retourner un objet vide mais valide
                return new DetailedStatisticsDto
                {
                    ScoreDistribution = new ScoreDistributionDto 
                    {
                        Low = 0,
                        Medium = 0,
                        High = 0,
                        Average = 0,
                        Min = 0,
                        Max = 0
                    },
                    DepartmentDistribution = new List<DistributionItemDto>(),
                    EvaluationTypeDistribution = new List<DistributionItemDto>(),
                    PerformanceByYear = new List<YearlyPerformanceDto>(),
                    TrendData = new TrendDto 
                    { 
                        IsIncreasing = false,
                        PercentageChange = 0,
                        StartValue = 0,
                        EndValue = 0,
                        StandardDeviation = 0
                    }
                };
            }
        }

        private double CalculateStandardDeviation(List<decimal> values)
        {
            try
            {
                if (!values.Any()) return 0;
                
                double avg = (double)values.Average();
                double sumOfSquaredDifferences = values.Sum(val => Math.Pow((double)val - avg, 2));
                return Math.Sqrt(sumOfSquaredDifferences / values.Count);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du calcul de l'écart-type: {ex.Message}");
                return 0;
            }
        }

        public async Task<IEnumerable<string>> GetEvaluationTypesAsync()
        {
            try
            {
                var types = await _context.EvaluationTypes
                    .Select(et => et.Designation)
                    .Distinct()
                    .ToListAsync();
                
                if (!types.Any())
                {
                    // Retourner des valeurs par défaut si aucun type n'est trouvé
                    return new List<string> { "Annuelle", "Trimestrielle", "Probatoire", "Promotion" };
                }
                
                return types;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des types d'évaluation : {ex.Message}");
                // Retourner des valeurs par défaut en cas d'erreur
                return new List<string> { "Annuelle", "Trimestrielle", "Probatoire", "Promotion" };
            }
        }

        public async Task<IEnumerable<Employee>> GetEmployeesAsync()
        {
            try
            {
                return await _context.Employee
                    .Select(e => new Employee
                    {
                        EmployeeId = e.EmployeeId,
                        FirstName = e.FirstName,
                        Name = e.Name,
                        RegistrationNumber = e.RegistrationNumber
                        // Position n'existe pas dans le modèle Employee
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des employés : {ex.Message}");
                return new List<Employee>();
            }
        }

    }

    // Rechercher la classe GlobalPerformanceDto et ajouter les propriétés manquantes
    public class GlobalPerformanceDto
    {
        public int Year { get; set; }
        public decimal AverageScore { get; set; }
        public int EvaluationCount { get; set; }
        public string Department { get; set; }
    }
}
