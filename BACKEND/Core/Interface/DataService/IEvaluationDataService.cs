using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface IEvaluationDataService
    {
        // EvaluationService
        Task<List<EvaluationQuestion>> GetAllQuestionsWithIncludes();
        Task<EvaluationQuestion?> GetQuestionWithIncludes(int id);
        Task UpdateQuestion(EvaluationQuestion question);
        Task<List<TrainingSuggestion>> GetAllTrainingSuggestions();
        Task<Dictionary<int, string>> GetQuestionTextsAsync(List<int> questionIds);
        Task SaveChangesAsync();
        Task CreateEvaluationAsync(Evaluation evaluation);
        Task CreateEvaluationQuestionnaireAsync(EvaluationQuestionnaire questionnaire);
        Task AddRangeAsync<T>(IEnumerable<T> entities) where T : class;

        // EvaluationPlanningService
        IQueryable<VEmployeeWithoutEvaluation> GetEmployeesWithoutEvaluationsQuery();
        IQueryable<VEmployeesFinishedEvaluation> GetEmployeesFinishedEvaluationsQuery();
        IQueryable<VEvaluationHistory> GetEvaluationHistoryQuery();
        IQueryable<Evaluation> GetEvaluationsQuery();

        // EvaluationInterviewService
        IQueryable<VEmployeesFinishedEvaluation> GetEmployeesFinishedEvalQuery();
        Task<Evaluation?> GetEvaluationWithUserAsync(int id);
        Task<Employee?> FindEmployeeByRegistrationNumberAsync(string registrationNumber);
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();

        // EvaluationPortalService
        IQueryable<VEmployeesOngoingEvaluation> GetOngoingEvaluationsQuery();
        IQueryable<VEmployeeEvaluationProgress> GetEmployeesEvaluationProgressQuery();
        Task<EvaluationProgress?> GetProgressByIdAsync(int id);
        Task UpdateProgressAsync(EvaluationProgress progress);
        Task<Evaluation?> FindEvaluationByIdAsync(int id);

        // EvaluationResponseService
        Task<List<EvaluationQuestion>> GetQuestionsWithTypeAsync(int questionnaireId);
        Task<EvaluationQuestion?> GetQuestionWithOptionsAsync(int questionId);
        Task<EvaluationSelectedQuestions?> GetSelectedQuestionAsync(int questionnaireId, int questionId);
        Task AddResponseAsync(EvaluationResponses response);
        Task SaveProgressAsync(EvaluationProgress progress);
        Task<Evaluation?> FindEvaluationAsync(int id);
        Task<EvaluationReferenceAnswer?> GetReferenceAnswerForQuestionAsync(int questionId);
        Task<List<EvaluationReferenceAnswer>> GetReferenceAnswersForQuestionsAsync(List<int> questionIds);
        Task UpdateSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion);

        // CompetenceLineService
        Task<List<CompetenceLine>> GetAllCompetenceLinesAsync();
        Task<CompetenceLine?> GetCompetenceLineByIdAsync(int id);
        Task<List<CompetenceLine>> GetCompetenceLinesByPositionIdAsync(int positionId);
        Task<List<CompetenceLine>> GetCompetenceLinesBySkillPositionIdAsync(int skillPositionId);
        Task CreateCompetenceLineAsync(CompetenceLine competenceLine);
        Task UpdateCompetenceLineAsync(CompetenceLine competenceLine);
        Task DeleteCompetenceLineAsync(int id);

        // CompetenceTrainingService
        Task<List<CompetenceTraining>> GetAllCompetenceTrainingsAsync();
        Task<CompetenceTraining?> GetCompetenceTrainingByIdAsync(int id);
        Task<List<CompetenceTraining>> GetCompetenceTrainingsByLineIdAsync(int competenceLineId);
        Task CreateCompetenceTrainingAsync(CompetenceTraining training);
        Task UpdateCompetenceTrainingAsync(CompetenceTraining training);
        Task DeleteCompetenceTrainingAsync(int id);

        // EvaluationCompetenceService
        Task<int> ExecuteScalarAsync(string sql, params object[] parameters);
        Task<List<Dictionary<string, object>>> ExecuteReaderAsync(string sql, params object[] parameters);
        Task<int> ExecuteNonQueryAsync(string sql, params object[] parameters);

        // PermissionService
        Task<List<Permission>> GetAllPermissionsAsync();
        Task<Permission?> GetPermissionByIdAsync(int id);
        Task<List<RolePermission>> GetPermissionsByRoleIdAsync(int roleId);
        Task<Role?> GetRoleWithPermissionsAsync(int roleId);
        Task CreatePermissionAsync(Permission permission);
        Task UpdatePermissionAsync(Permission permission);
        Task DeletePermissionAsync(int id);
        Task DeleteRolePermissionsAsync(int roleId);
        Task AddRolePermissionAsync(RolePermission rolePermission);

        // RoleService
        Task<List<Role>> GetAllRolesAsync();
        Task<Role?> GetRoleByIdAsync(int id);
        Task CreateRoleAsync(Role role);
        Task UpdateRoleAsync(Role role);
        Task DeleteRoleAsync(int id);

        // ResponseTypeService
        Task<List<ResponseType>> GetAllResponseTypesAsync();
        Task<ResponseType?> GetResponseTypeByIdAsync(int id);
        Task CreateResponseTypeAsync(ResponseType responseType);
        Task UpdateResponseTypeAsync(ResponseType responseType);
        Task DeleteResponseTypeAsync(int id);

        // UserService
        Task<List<VEmployeeDetails>> GetAllEmployeeDetailsAsync();
        Task<VEmployeeDetails?> GetEmployeeDetailsAsync(int id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByIdAsync(int id);
        Task<List<User>> GetManagersAndDirectorsAsync();
        IQueryable<VEmployeeDetails> GetEmployeeDetailsQuery();

        // TemporaryAccountService
        Task<bool> TemporaryAccountExistsAsync(string email);

        // TrainingSuggestionService
        Task<bool> EvaluationTypeExistsAsync(int id);
        Task<bool> EvaluationQuestionExistsAsync(int id);
        Task<EvaluationQuestion?> FindQuestionByTextAndTypeAsync(string questionText, int evaluationTypeId);

        // ReferenceAnswerService
        Task SaveReferenceAnswerAsync(EvaluationReferenceAnswer answer);
        Task DeleteReferenceAnswerAsync(int id);

        // ===================== Additional EvaluationService Methods =====================
        Task<TemporaryAccount?> GetTemporaryAccountAsync(int employeeId, int evaluationId);
        Task<List<User>> GetSupervisorsForEvaluationAsync(int evaluationId);
        Task<List<TrainingSuggestion>> GetAllTrainingSuggestionsWithIncludesAsync();
        Task<TrainingSuggestion?> GetTrainingSuggestionByIdWithIncludesAsync(int id);
        Task<(List<EvaluationQuestion> Items, int TotalCount)> GetPaginatedQuestionsAsync(int pageNumber, int pageSize);
        Task<(List<EvaluationQuestion> Items, int TotalCount)> GetPaginatedQuestionsByTypeAsync(int evaluationTypeId, int pageNumber, int pageSize);
        Task<List<EvaluationSelectedQuestions>> GetSelectedQuestionsForEvaluationAsync(int evaluationId);
        Task AddSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion);
        Task<EvaluationSelectedQuestions?> FindSelectedQuestionAsync(int evaluationId, int questionId);
        Task RemoveSelectedQuestionAsync(EvaluationSelectedQuestions selectedQuestion);
        Task<EvaluationProgress?> GetProgressByEvaluationIdAsync(int evaluationId);
    }
}
