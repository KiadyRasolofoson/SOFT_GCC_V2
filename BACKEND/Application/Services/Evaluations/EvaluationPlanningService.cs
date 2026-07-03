using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;

namespace soft_carriere_competence.Application.Services.Evaluations
{

    public class EvaluationPlanningService
    {
        //private readonly IEvaluationQuestionRepository _questionRepository;
        //private readonly IGenericRepository<EvaluationType> _evaluationTypeRepository;
        //private readonly IGenericRepository<EvaluationQuestion> _evaluationQuestion;
        //private readonly IGenericRepository<TrainingSuggestion> _trainingSuggestionsRepository;
        //private readonly IGenericRepository<EvaluationQuestionnaire> _evaluationQuestionnaireRepository;
        //private readonly IGenericRepository<Evaluation> _evaluationRepository;

        private readonly ApplicationDbContext _context;
        private readonly IGenericRepository<Position> _posteRepository;
        private readonly IGenericRepository<Department> _departementRepository;


        public EvaluationPlanningService(ApplicationDbContext context, 
            IGenericRepository<Department> department, IGenericRepository<Position> poste)
        {
            _context = context;
            _posteRepository = poste;
            _departementRepository = department;
        }

        public async Task<IEnumerable<VEmployeeWithoutEvaluation>> GetEmployeesWithoutEvaluationsAsync(
                int? position = null, 
                int? department = null, 
                string? search = null)
        {
                    var query = _context.vEmployeeWithoutEvaluations.AsQueryable();

                    if (position.HasValue)
                        query = query.Where(e => e.positionId == position);

                    if (department.HasValue)
                        query = query.Where(e => e.DepartmentId == department);

                    if (!string.IsNullOrEmpty(search))
                        query = query.Where(e =>
                            (e.FirstName + " " + e.LastName).Contains(search) ||
                            e.FirstName.Contains(search) ||
                            e.LastName.Contains(search));

                    return await query.ToListAsync();
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
            return await _departementRepository.GetAllAsync();
        }


        public async Task<(IEnumerable<VEmployeeWithoutEvaluation> Employees, int TotalPages)> GetEmployeesWithoutEvaluationsPaginatedAsync(
    int pageNumber = 1,
    int pageSize = 10,
    int? position = null,
    int? department = null,
    string? search = null,
    string? sortBy = null,
    string? sortDirection = null)
        {
            var query = _context.vEmployeeWithoutEvaluations.AsQueryable();

            // Appliquer les filtres
            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    (e.FirstName + " " + e.LastName).Contains(search) ||
                    e.FirstName.Contains(search) ||
                    e.LastName.Contains(search));
                    
            // Éliminer les doublons en récupérant les IDs uniques
            var uniqueEmployeeIds = await query
                .Select(e => e.EmployeeId)
                .Distinct()
                .ToListAsync();
                
            // Pour chaque ID unique, récupérer le premier enregistrement correspondant
            var uniqueEmployees = new List<VEmployeeWithoutEvaluation>();
            foreach (var employeeId in uniqueEmployeeIds)
            {
                var employee = await query
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
                if (employee != null)
                {
                    uniqueEmployees.Add(employee);
                }
            }
            
            // Recréer une requête à partir des employés uniques
            query = uniqueEmployees.AsQueryable();

            // Appliquer le tri
            if (!string.IsNullOrEmpty(sortBy))
            {
                bool isAscending = string.IsNullOrEmpty(sortDirection) || sortDirection.ToLower() == "ascending";
                
                switch (sortBy.ToLower())
                {
                    case "name":
                        query = isAscending 
                            ? query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName)
                            : query.OrderByDescending(e => e.FirstName).ThenByDescending(e => e.LastName);
                        break;
                    case "position":
                        query = isAscending 
                            ? query.OrderBy(e => e.Position)
                            : query.OrderByDescending(e => e.Position);
                        break;
                    case "department":
                        query = isAscending 
                            ? query.OrderBy(e => e.Department)
                            : query.OrderByDescending(e => e.Department);
                        break;
                   
                    default:
                        // Tri par défaut si la clé de tri n'est pas reconnue
                        query = query.OrderBy(e => e.FirstName).ThenBy(e => e.LastName);
                        break;
                }
            }

            // Le nombre total d'éléments est maintenant la taille de notre liste d'employés uniques
            var totalItems = uniqueEmployees.Count;

            // Calculer le nombre total de pages
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // Paginer les résultats - appliqué en mémoire puisque query est maintenant en mémoire
            var employees = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (employees, totalPages);
        }

        // Méthode pour récupérer les évaluations planifiées avec pagination
        public async Task<(IEnumerable<PlannedEvaluationDto>, int)> GetPlannedEvaluationsPaginatedAsync(
            int pageNumber,
            int pageSize,
            int? position = null,
            int? department = null,
            string? search = null,
            string? sortBy = null,
            string? sortDirection = null)
        {
            // Requête pour obtenir toutes les évaluations planifiées (état 10)
            var query = from e in _context.Evaluations
                        join emp in _context.Employee on e.EmployeeId equals emp.EmployeeId
                        join et in _context.EvaluationTypes on e.EvaluationTypeId equals et.EvaluationTypeId
                        join pos in _context.Position on emp.Department_id equals pos.PositionId into positions
                        from p in positions.DefaultIfEmpty()
                        join dept in _context.Department on emp.Department_id equals dept.DepartmentId into departments
                        from d in departments.DefaultIfEmpty()
                        where e.state == 10 // État planifié
                        select new PlannedEvaluationDto
                        {
                            EvaluationId = e.EvaluationId,
                            EmployeeId = emp.EmployeeId,
                            EmployeeFirstName = emp.FirstName,
                            EmployeeLastName = emp.Name,
                            PositionId = p.PositionId,
                            PositionName = p.PositionName ?? "Non défini",
                            DepartmentId = emp.Department_id ?? 0,
                            DepartmentName = d.Name ?? "Non défini",
                            EvaluationTypeId = e.EvaluationTypeId,
                            EvaluationTypeName = et.Designation,
                            StartDate = e.StartDate,
                            EndDate = e.EndDate,
                            State = e.state
                        };

            // Appliquer les filtres
            if (position.HasValue && position.Value > 0)
            {
                query = query.Where(e => e.PositionId == position.Value);
            }

            if (department.HasValue && department.Value > 0)
            {
                query = query.Where(e => e.DepartmentId == department.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(e =>
                    e.EmployeeFirstName.ToLower().Contains(search) ||
                    e.EmployeeLastName.ToLower().Contains(search) ||
                    e.PositionName.ToLower().Contains(search) ||
                    e.DepartmentName.ToLower().Contains(search) ||
                    e.EvaluationTypeName.ToLower().Contains(search)
                );
            }

            // Appliquer le tri
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                bool isAscending = string.IsNullOrWhiteSpace(sortDirection) || sortDirection.ToLower() == "ascending";

                switch (sortBy.ToLower())
                {
                    case "employeelastname":
                        query = isAscending
                            ? query.OrderBy(e => e.EmployeeLastName).ThenBy(e => e.EmployeeFirstName)
                            : query.OrderByDescending(e => e.EmployeeLastName).ThenByDescending(e => e.EmployeeFirstName);
                        break;
                    case "positionname":
                        query = isAscending
                            ? query.OrderBy(e => e.PositionName)
                            : query.OrderByDescending(e => e.PositionName);
                        break;
                    case "departmentname":
                        query = isAscending
                            ? query.OrderBy(e => e.DepartmentName)
                            : query.OrderByDescending(e => e.DepartmentName);
                        break;
                    case "startdate":
                        query = isAscending
                            ? query.OrderBy(e => e.StartDate)
                            : query.OrderByDescending(e => e.StartDate);
                        break;
                    case "enddate":
                        query = isAscending
                            ? query.OrderBy(e => e.EndDate)
                            : query.OrderByDescending(e => e.EndDate);
                        break;
                    case "evaluationtypename":
                        query = isAscending
                            ? query.OrderBy(e => e.EvaluationTypeName)
                            : query.OrderByDescending(e => e.EvaluationTypeName);
                        break;
                    default:
                        query = query.OrderBy(e => e.StartDate);
                        break;
                }
            }
            else
            {
                query = query.OrderBy(e => e.StartDate);
            }

            // Calculer le nombre total de pages
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            // Récupérer la page demandée
            var evaluations = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (evaluations, totalPages);
        }
    }
}
