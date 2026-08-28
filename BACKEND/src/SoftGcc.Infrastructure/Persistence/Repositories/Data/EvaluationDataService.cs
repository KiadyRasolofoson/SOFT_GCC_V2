using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class EvaluationDataService : IEvaluationDataService
    {
        private readonly ApplicationDbContext _context;
        private Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? _transaction;
        private System.Data.Common.DbTransaction? _activeTransaction;

        public EvaluationDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ===================== EvaluationService =====================

        public async Task<List<EvaluationQuestion>> GetAllQuestionsWithIncludes()
        {
            return await QuestionsWithReferences().ToListAsync();
        }

        public async Task<EvaluationQuestion?> GetQuestionWithIncludes(int id)
        {
            return await QuestionsWithReferences().FirstOrDefaultAsync(q => q.questionId == id);
        }

        /// <summary>
        /// La chaîne Skill → Skill_family → Domain_skill porte le domaine et la famille de
        /// la question : c'est l'axe d'organisation du référentiel de questions.
        /// </summary>
        private IQueryable<EvaluationQuestion> QuestionsWithReferences() =>
            _context.evaluationQuestions
                .Include(q => q.EvaluationType)
                .Include(q => q.Position)
                .Include(q => q.CompetenceLine)
                .Include(q => q.ResponseType)
                .Include(q => q.Skill)
                    .ThenInclude(s => s!.Family)
                        .ThenInclude(f => f.Domain);

        public async Task UpdateQuestion(EvaluationQuestion question)
        {
            _context.evaluationQuestions.Update(question);
            await _context.SaveChangesAsync();
        }

        public async Task<List<TrainingSuggestion>> GetAllTrainingSuggestions()
        {
            return await _context.TrainingSuggestions.ToListAsync();
        }

        public async Task<Dictionary<int, string>> GetQuestionTextsAsync(List<int> questionIds)
        {
            var questions = await _context.evaluationQuestions
                .Where(q => questionIds.Contains(q.questionId))
                .Select(q => new { q.questionId, q.question })
                .ToListAsync();

            return questions
                .GroupBy(q => q.questionId)
                .ToDictionary(g => g.Key, g => g.First().question ?? string.Empty);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task CreateEvaluationAsync(Evaluation evaluation)
        {
            await _context.Evaluations.AddAsync(evaluation);
            await _context.SaveChangesAsync();
        }

        public async Task CreateEvaluationQuestionnaireAsync(EvaluationQuestionnaire questionnaire)
        {
            await _context.EvaluationQuestionnaires.AddAsync(questionnaire);
            await _context.SaveChangesAsync();
        }

        public async Task AddRangeAsync<T>(IEnumerable<T> entities) where T : class
        {
            await _context.AddRangeAsync(entities);
            await _context.SaveChangesAsync();
        }

        // ===================== EvaluationPlanningService =====================

        public IQueryable<VEmployeeWithoutEvaluation> GetEmployeesWithoutEvaluationsQuery()
        {
            return _context.vEmployeeWithoutEvaluations.AsQueryable();
        }

        public IQueryable<VEmployeesFinishedEvaluation> GetEmployeesFinishedEvaluationsQuery()
        {
            return _context.vEmployeesFinishedEvaluations.AsQueryable();
        }

        public IQueryable<VEvaluationHistory> GetEvaluationHistoryQuery()
        {
            return _context.vEvaluationHistories.AsQueryable();
        }

        public IQueryable<Evaluation> GetEvaluationsQuery()
        {
            return _context.Evaluations.AsQueryable();
        }

        // ===================== EvaluationInterviewService =====================

        public IQueryable<VEmployeesFinishedEvaluation> GetEmployeesFinishedEvalQuery()
        {
            return _context.vEmployeesFinishedEvaluations.AsQueryable();
        }

        public async Task<Evaluation?> GetEvaluationWithUserAsync(int id)
        {
            return await _context.Evaluations
                .Include(e => e.Employee)
                .FirstOrDefaultAsync(e => e.EvaluationId == id);
        }

        public async Task<Employee?> FindEmployeeByRegistrationNumberAsync(string registrationNumber)
        {
            return await _context.Employee
                .FirstOrDefaultAsync(e => e.RegistrationNumber == registrationNumber);
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
            // Capture la transaction ADO.NET sous-jacente en cherchant dans tous les champs
            _activeTransaction = ExtractDbTransaction(_transaction);
        }

        /// <summary>
        /// Extrait le DbTransaction sous-jacent d'un IDbContextTransaction par reflection.
        /// Parcourt TOUS les champs (publics, privés, hérités) pour trouver le premier DbTransaction.
        /// </summary>
        private static System.Data.Common.DbTransaction? ExtractDbTransaction(
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)
        {
            if (transaction == null) return null;

            var type = transaction.GetType();
            // Parcourir toute la hiérarchie de types
            while (type != null)
            {
                var fields = type.GetFields(
                    System.Reflection.BindingFlags.NonPublic |
                    System.Reflection.BindingFlags.Instance |
                    System.Reflection.BindingFlags.Public |
                    System.Reflection.BindingFlags.DeclaredOnly);
                foreach (var field in fields)
                {
                    if (typeof(System.Data.Common.DbTransaction).IsAssignableFrom(field.FieldType))
                    {
                        if (field.GetValue(transaction) is System.Data.Common.DbTransaction dbTx)
                            return dbTx;
                    }
                }
                type = type.BaseType;
            }
            return null;
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
                _activeTransaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
                _activeTransaction = null;
            }
        }

        // ===================== EvaluationPortalService =====================

        public IQueryable<VEmployeesOngoingEvaluation> GetOngoingEvaluationsQuery()
        {
            return _context.vEmployeesOngoingEvaluations.AsQueryable();
        }

        public IQueryable<VEmployeeEvaluationProgress> GetEmployeesEvaluationProgressQuery()
        {
            return _context.vEmployeesEvaluationProgress.AsQueryable();
        }

        public async Task<EvaluationProgress?> GetProgressByIdAsync(int id)
        {
            return await _context.evaluationProgresses.FindAsync(id);
        }

        public async Task UpdateProgressAsync(EvaluationProgress progress)
        {
            _context.evaluationProgresses.Update(progress);
            await _context.SaveChangesAsync();
        }

        public async Task<Evaluation?> FindEvaluationByIdAsync(int id)
        {
            return await _context.Evaluations.FindAsync(id);
        }

        // ===================== EvaluationResponseService =====================

        public async Task<List<EvaluationQuestion>> GetQuestionsWithTypeAsync(int questionnaireId)
        {
            var questionIds = await _context.EvaluationQuestionnaires
                .Where(eq => eq.EvaluationId == questionnaireId)
                .Select(eq => eq.questionId)
                .ToListAsync();

            return await _context.evaluationQuestions
                .Where(q => questionIds.Contains(q.questionId))
                .Include(q => q.ResponseType)
                .ToListAsync();
        }

        public async Task<EvaluationQuestion?> GetQuestionWithOptionsAsync(int questionId)
        {
            return await _context.evaluationQuestions
                .Include(q => q.ResponseType)
                .FirstOrDefaultAsync(q => q.questionId == questionId);
        }

        public async Task<List<EvaluationQuestionOptions>> GetActiveOptionsByQuestionIdAsync(int questionId)
        {
            return await ActiveOptionsQuery()
                .Where(option => option.QuestionId == questionId)
                .ToListAsync();
        }

        public async Task<List<EvaluationQuestionOptions>> GetActiveOptionsByQuestionIdsAsync(
            IReadOnlyCollection<int> questionIds)
        {
            if (questionIds is null || questionIds.Count == 0)
            {
                return [];
            }

            return await ActiveOptionsQuery()
                .Where(option => questionIds.Contains(option.QuestionId))
                .ToListAsync();
        }

        public async Task<List<(int QuestionId, int OptionCount, int CorrectCount)>> GetQuestionOptionSummariesAsync()
        {
            var rows = await _context.evaluationQuestionOptions
                .Where(option => option.State == 1)
                .GroupBy(option => option.QuestionId)
                .Select(group => new
                {
                    QuestionId = group.Key,
                    OptionCount = group.Count(),
                    CorrectCount = group.Count(option => option.IsCorrect)
                })
                .ToListAsync();

            return rows
                .Select(row => (row.QuestionId, row.OptionCount, row.CorrectCount))
                .ToList();
        }

        public async Task ReplaceQuestionOptionsAsync(
            int questionId,
            IReadOnlyList<EvaluationQuestionOptions> options)
        {
            var existing = await _context.evaluationQuestionOptions
                .Where(option => option.QuestionId == questionId)
                .ToListAsync();

            var keptIds = options
                .Where(option => option.OptionId > 0)
                .Select(option => option.OptionId)
                .ToHashSet();

            foreach (var row in existing)
            {
                if (!keptIds.Contains(row.OptionId))
                {
                    row.State = 0;
                }
            }

            var sortOrder = 0;
            foreach (var incoming in options)
            {
                sortOrder++;
                var text = incoming.OptionText.Trim();
                if (incoming.OptionId > 0)
                {
                    var row = existing.FirstOrDefault(option => option.OptionId == incoming.OptionId);
                    if (row is null)
                    {
                        _context.evaluationQuestionOptions.Add(NewOption(questionId, text, incoming.IsCorrect, sortOrder));
                        continue;
                    }

                    row.OptionText = text;
                    row.IsCorrect = incoming.IsCorrect;
                    row.SortOrder = sortOrder;
                    row.State = 1;
                }
                else
                {
                    _context.evaluationQuestionOptions.Add(NewOption(questionId, text, incoming.IsCorrect, sortOrder));
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeactivateQuestionOptionsAsync(int questionId)
        {
            var existing = await _context.evaluationQuestionOptions
                .Where(option => option.QuestionId == questionId && option.State != 0)
                .ToListAsync();

            if (existing.Count == 0)
            {
                return;
            }

            foreach (var row in existing)
            {
                row.State = 0;
            }

            await _context.SaveChangesAsync();
        }

        private IQueryable<EvaluationQuestionOptions> ActiveOptionsQuery() =>
            _context.evaluationQuestionOptions
                .Where(option => option.State == 1)
                .OrderBy(option => option.SortOrder)
                .ThenBy(option => option.OptionId);

        private static EvaluationQuestionOptions NewOption(
            int questionId,
            string optionText,
            bool isCorrect,
            int sortOrder) =>
            new()
            {
                QuestionId = questionId,
                OptionText = optionText,
                IsCorrect = isCorrect,
                SortOrder = sortOrder,
                State = 1
            };

        public async Task<EvaluationSelectedQuestions?> GetSelectedQuestionAsync(int questionnaireId, int questionId)
        {
            return await _context.evaluationSelectedQuestions
                .FirstOrDefaultAsync(eq => eq.EvaluationId == questionnaireId && eq.QuestionId == questionId);
        }

        public async Task AddResponseAsync(EvaluationResponses response)
        {
            await _context.evaluationResponses.AddAsync(response);
            await _context.SaveChangesAsync();
        }

        public async Task SaveProgressAsync(EvaluationProgress progress)
        {
            _context.evaluationProgresses.Update(progress);
            await _context.SaveChangesAsync();
        }

        public async Task<Evaluation?> FindEvaluationAsync(int id)
        {
            return await _context.Evaluations.FindAsync(id);
        }

        public async Task<EvaluationReferenceAnswer?> GetReferenceAnswerForQuestionAsync(int questionId)
        {
            return await _context.evaluationReferenceAnswers
                .FirstOrDefaultAsync(r => r.QuestionId == questionId);
        }

        public async Task<List<EvaluationReferenceAnswer>> GetReferenceAnswersForQuestionsAsync(List<int> questionIds)
        {
            return await _context.evaluationReferenceAnswers
                .Where(r => questionIds.Contains(r.QuestionId))
                .ToListAsync();
        }

        public async Task UpdateSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion)
        {
            _context.evaluationSelectedQuestions.Update(selectedQuestion);
            await _context.SaveChangesAsync();
        }

        // ===================== CompetenceLineService =====================

        public async Task<List<CompetenceLine>> GetAllCompetenceLinesAsync()
        {
            return await _context.competenceLines
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .ToListAsync();
        }

        public async Task<CompetenceLine?> GetCompetenceLineByIdAsync(int id)
        {
            return await _context.competenceLines.FindAsync(id);
        }

        public async Task<List<CompetenceLine>> GetCompetenceLinesByPositionIdAsync(int positionId)
        {
            return await _context.competenceLines
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .Where(cl => cl.State == 1 && cl.SkillPosition.PositionId == positionId)
                .ToListAsync();
        }

        public async Task<List<CompetenceLine>> GetCompetenceLinesBySkillPositionIdAsync(int skillPositionId)
        {
            return await _context.competenceLines
                .Where(cl => cl.SkillPositionId == skillPositionId)
                .ToListAsync();
        }

        public async Task<SkillPosition?> GetSkillPositionByIdAsync(int skillPositionId)
        {
            return await _context.SkillPosition
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.SkillPositionId == skillPositionId);
        }

        public async Task<SkillPosition?> GetActiveSkillPositionAsync(int positionId, int skillId)
        {
            return await _context.SkillPosition
                .AsNoTracking()
                .Include(sp => sp.Skill)
                .FirstOrDefaultAsync(sp =>
                    sp.PositionId == positionId && sp.SkillId == skillId && sp.State > 0);
        }

        public async Task<List<SkillPosition>> GetActiveSkillPositionsByPositionIdAsync(int positionId)
        {
            return await _context.SkillPosition
                .AsNoTracking()
                .Include(sp => sp.Skill)
                    .ThenInclude(s => s.Family)
                        .ThenInclude(f => f.Domain)
                .Where(sp => sp.PositionId == positionId && sp.State > 0)
                .ToListAsync();
        }

        public async Task<Skill?> GetSkillByIdAsync(int skillId)
        {
            return await _context.Skill
                .AsNoTracking()
                .Include(s => s.Family)
                    .ThenInclude(f => f.Domain)
                .FirstOrDefaultAsync(s => s.SkillId == skillId);
        }

        public async Task<CompetenceLine?> FindCompetenceLineBySkillPositionAsync(int skillPositionId)
        {
            return await _context.competenceLines
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(cl => cl.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .OrderByDescending(cl => cl.State)
                .ThenBy(cl => cl.CompetenceLineId)
                .FirstOrDefaultAsync(cl => cl.SkillPositionId == skillPositionId);
        }

        public async Task CreateCompetenceLineAsync(CompetenceLine competenceLine)
        {
            await _context.competenceLines.AddAsync(competenceLine);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateCompetenceLineAsync(CompetenceLine competenceLine)
        {
            _context.competenceLines.Update(competenceLine);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCompetenceLineAsync(int id)
        {
            var entity = await _context.competenceLines.FindAsync(id);
            if (entity != null)
            {
                _context.competenceLines.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // ===================== CompetenceTrainingService =====================

        public async Task<List<CompetenceTraining>> GetAllCompetenceTrainingsAsync()
        {
            return await _context.competenceTrainings.ToListAsync();
        }

        public async Task<CompetenceTraining?> GetCompetenceTrainingByIdAsync(int id)
        {
            return await _context.competenceTrainings.FindAsync(id);
        }

        public async Task<List<CompetenceTraining>> GetCompetenceTrainingsByLineIdAsync(int competenceLineId)
        {
            return await _context.competenceTrainings
                .Where(ct => ct.CompetenceLineId == competenceLineId)
                .ToListAsync();
        }

        public async Task CreateCompetenceTrainingAsync(CompetenceTraining training)
        {
            await _context.competenceTrainings.AddAsync(training);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateCompetenceTrainingAsync(CompetenceTraining training)
        {
            _context.competenceTrainings.Update(training);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCompetenceTrainingAsync(int id)
        {
            var entity = await _context.competenceTrainings.FindAsync(id);
            if (entity != null)
            {
                _context.competenceTrainings.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // ===================== EvaluationCompetenceService =====================

        public async Task<int> ExecuteScalarAsync(string sql, params object[] parameters)
        {
            var connection = _context.Database.GetDbConnection();
            var connectionWasClosed = connection.State == System.Data.ConnectionState.Closed;
            
            if (connectionWasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;

                // Si une transaction ADO.NET est active, l'associer à la commande
                if (_activeTransaction != null)
                    command.Transaction = _activeTransaction;

                for (int i = 0; i < parameters.Length; i++)
                {
                    command.Parameters.Add(new SqlParameter($"@p{i}", parameters[i]));
                }

                var result = await command.ExecuteScalarAsync();
                return result != null ? Convert.ToInt32(result) : 0;
            }
            finally
            {
                if (connectionWasClosed && connection.State == System.Data.ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        public async Task<List<Dictionary<string, object>>> ExecuteReaderAsync(string sql, params object[] parameters)
        {
            var connection = _context.Database.GetDbConnection();
            var connectionWasClosed = connection.State == System.Data.ConnectionState.Closed;
            
            if (connectionWasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;

                // Si une transaction ADO.NET est active, l'associer à la commande
                if (_activeTransaction != null)
                    command.Transaction = _activeTransaction;

                for (int i = 0; i < parameters.Length; i++)
                {
                    command.Parameters.Add(new SqlParameter($"@p{i}", parameters[i]));
                }

                var result = new List<Dictionary<string, object>>();
                await using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        row[reader.GetName(i)] = reader.GetValue(i);
                    }
                    result.Add(row);
                }

                return result;
            }
            finally
            {
                if (connectionWasClosed && connection.State == System.Data.ConnectionState.Open)
                    await connection.CloseAsync();
            }
        }

        public async Task<int> ExecuteNonQueryAsync(string sql, params object[] parameters)
        {
            return await _context.Database.ExecuteSqlRawAsync(sql, parameters);
        }

        // ===================== PermissionService =====================

        public async Task<List<Permission>> GetAllPermissionsAsync()
        {
            return await _context.Permissions.ToListAsync();
        }

        public async Task<Permission?> GetPermissionByIdAsync(int id)
        {
            return await _context.Permissions.FindAsync(id);
        }

        public async Task<List<RolePermission>> GetPermissionsByRoleIdAsync(int roleId)
        {
            return await _context.rolePermissions
                .Include(rp => rp.Permission)
                .Where(rp => rp.RoleId == roleId)
                .ToListAsync();
        }

        public async Task<Role?> GetRoleWithPermissionsAsync(int roleId)
        {
            return await _context.Roles.FindAsync(roleId);
        }

        public async Task CreatePermissionAsync(Permission permission)
        {
            await _context.Permissions.AddAsync(permission);
            await _context.SaveChangesAsync();
        }

        public async Task UpdatePermissionAsync(Permission permission)
        {
            _context.Permissions.Update(permission);
            await _context.SaveChangesAsync();
        }

        public async Task DeletePermissionAsync(int id)
        {
            var entity = await _context.Permissions.FindAsync(id);
            if (entity != null)
            {
                _context.Permissions.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteRolePermissionsAsync(int roleId)
        {
            var permissions = await _context.rolePermissions
                .Where(rp => rp.RoleId == roleId)
                .ToListAsync();

            _context.rolePermissions.RemoveRange(permissions);
            await _context.SaveChangesAsync();
        }

        public async Task AddRolePermissionAsync(RolePermission rolePermission)
        {
            await _context.rolePermissions.AddAsync(rolePermission);
            await _context.SaveChangesAsync();
        }

        // ===================== RoleService =====================

        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<Role?> GetRoleByIdAsync(int id)
        {
            return await _context.Roles.FindAsync(id);
        }

        public async Task CreateRoleAsync(Role role)
        {
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateRoleAsync(Role role)
        {
            _context.Roles.Update(role);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteRoleAsync(int id)
        {
            var entity = await _context.Roles.FindAsync(id);
            if (entity != null)
            {
                _context.Roles.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // ===================== ResponseTypeService =====================

        public async Task<List<ResponseType>> GetAllResponseTypesAsync()
        {
            return await _context.ResponseTypes.ToListAsync();
        }

        public async Task<ResponseType?> GetResponseTypeByIdAsync(int id)
        {
            return await _context.ResponseTypes.FindAsync(id);
        }

        public async Task CreateResponseTypeAsync(ResponseType responseType)
        {
            await _context.ResponseTypes.AddAsync(responseType);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateResponseTypeAsync(ResponseType responseType)
        {
            _context.ResponseTypes.Update(responseType);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteResponseTypeAsync(int id)
        {
            var entity = await _context.ResponseTypes.FindAsync(id);
            if (entity != null)
            {
                _context.ResponseTypes.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // ===================== UserService =====================

        public async Task<List<VEmployeeDetails>> GetAllEmployeeDetailsAsync()
        {
            return await _context.VEmployeeDetails.ToListAsync();
        }

        public async Task<VEmployeeDetails?> GetEmployeeDetailsAsync(int id)
        {
            return await _context.VEmployeeDetails
                .FirstOrDefaultAsync(e => e.EmployeeId == id);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<List<User>> GetManagersAndDirectorsAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.Title != null &&
                    (u.Role.Title.Contains("Manager")
                     || u.Role.Title.Contains("Director")
                     || u.Role.Title.Contains("Directeur")))
                .ToListAsync();
        }

        public IQueryable<VEmployeeDetails> GetEmployeeDetailsQuery()
        {
            return _context.VEmployeeDetails.AsQueryable();
        }

        // ===================== TemporaryAccountService =====================

        public async Task<bool> TemporaryAccountExistsAsync(string email)
        {
            return await _context.temporaryAccounts.AnyAsync(a => a.TempLogin == email);
        }

        // ===================== TrainingSuggestionService =====================

        public async Task<bool> EvaluationTypeExistsAsync(int id)
        {
            return await _context.EvaluationTypes.AnyAsync(e => e.EvaluationTypeId == id);
        }

        public async Task<bool> EvaluationQuestionExistsAsync(int id)
        {
            return await _context.evaluationQuestions.AnyAsync(e => e.questionId == id);
        }

        public async Task<EvaluationQuestion?> FindQuestionByTextAndTypeAsync(string questionText, int evaluationTypeId)
        {
            return await _context.evaluationQuestions
                .FirstOrDefaultAsync(q => q.question == questionText && q.evaluationTypeId == evaluationTypeId);
        }

        // ===================== Additional EvaluationService Methods =====================

        public async Task<TemporaryAccount?> GetTemporaryAccountAsync(int employeeId, int evaluationId)
        {
            return await _context.temporaryAccounts
                .FirstOrDefaultAsync(ta => ta.EmployeeId == employeeId && ta.Evaluations_id == evaluationId);
        }

        public async Task<List<User>> GetSupervisorsForEvaluationAsync(int evaluationId)
        {
            return await _context.EvaluationSupervisors
                .Where(es => es.EvaluationId == evaluationId)
                .Join(_context.Users,
                    es => es.SupervisorId,
                    u => u.Id,
                    (es, u) => u)
                .ToListAsync();
        }

        public async Task<List<TrainingSuggestion>> GetAllTrainingSuggestionsWithIncludesAsync()
        {
            return await _context.TrainingSuggestions
                .Include(ts => ts.evaluationType)
                .Include(ts => ts.evaluationQuestion)
                .ToListAsync();
        }

        public async Task<TrainingSuggestion?> GetTrainingSuggestionByIdWithIncludesAsync(int id)
        {
            return await _context.TrainingSuggestions
                .Include(ts => ts.evaluationType)
                .Include(ts => ts.evaluationQuestion)
                .FirstOrDefaultAsync(ts => ts.TrainingSuggestionId == id);
        }

        public async Task<(List<EvaluationQuestion> Items, int TotalCount)> GetPaginatedQuestionsAsync(int pageNumber, int pageSize)
        {
            var totalCount = await _context.evaluationQuestions.CountAsync(q => q.state == 1);

            var items = await QuestionsWithReferences()
                .Where(q => q.state == 1)
                .OrderByDescending(q => q.questionId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<EvaluationQuestion> Items, int TotalCount)> GetPaginatedQuestionsByTypeAsync(int evaluationTypeId, int pageNumber, int pageSize)
        {
            var query = _context.evaluationQuestions
                .Where(q => q.evaluationTypeId == evaluationTypeId)
                .OrderByDescending(q => q.questionId);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<EvaluationSelectedQuestions>> GetSelectedQuestionsForEvaluationAsync(int evaluationId)
        {
            return await _context.evaluationSelectedQuestions
                .Where(esq => esq.EvaluationId == evaluationId)
                .Include(esq => esq.SelectedQuestion)
                .Include(esq => esq.SelectedCompetenceLine)
                .ToListAsync();
        }

        public async Task AddSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion)
        {
            await _context.evaluationSelectedQuestions.AddAsync(selectedQuestion);
            await _context.SaveChangesAsync();
        }

        public async Task<EvaluationSelectedQuestions?> FindSelectedQuestionAsync(int evaluationId, int questionId)
        {
            return await _context.evaluationSelectedQuestions
                .FirstOrDefaultAsync(esq => esq.EvaluationId == evaluationId && esq.QuestionId == questionId);
        }

        public async Task RemoveSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion)
        {
            _context.evaluationSelectedQuestions.Remove(selectedQuestion);
            await _context.SaveChangesAsync();
        }

        public async Task<EvaluationProgress?> GetProgressByEvaluationIdAsync(int evaluationId)
        {
            return await _context.evaluationProgresses
                .FirstOrDefaultAsync(ep => ep.evaluationId == evaluationId);
        }

        // ===================== ReferenceAnswerService =====================

        public async Task SaveReferenceAnswerAsync(EvaluationReferenceAnswer answer)
        {
            if (answer.ReferenceAnswerId == 0)
                await _context.evaluationReferenceAnswers.AddAsync(answer);
            else
                _context.evaluationReferenceAnswers.Update(answer);

            await _context.SaveChangesAsync();
        }

        public async Task DeleteReferenceAnswerAsync(int id)
        {
            var entity = await _context.evaluationReferenceAnswers.FindAsync(id);
            if (entity != null)
            {
                _context.evaluationReferenceAnswers.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
    }
}
