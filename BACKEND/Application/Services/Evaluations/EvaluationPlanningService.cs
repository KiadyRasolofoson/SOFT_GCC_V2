using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;

namespace soft_carriere_competence.Application.Services.Evaluations
{

    public class EvaluationPlanningService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<Position> _posteRepository;
        private readonly IGenericRepository<Department> _departementRepository;
        private readonly IGenericRepository<Employee> _employeeRepository;
        private readonly IGenericRepository<EvaluationType> _evaluationTypeRepository;


        public EvaluationPlanningService(
            IEvaluationDataService dataService,
            IGenericRepository<Department> department,
            IGenericRepository<Position> poste,
            IGenericRepository<Employee> employeeRepository,
            IGenericRepository<EvaluationType> evaluationTypeRepository)
        {
            _dataService = dataService;
            _posteRepository = poste;
            _departementRepository = department;
            _employeeRepository = employeeRepository;
            _evaluationTypeRepository = evaluationTypeRepository;
        }

        public async Task<IEnumerable<VEmployeeWithoutEvaluation>> GetEmployeesWithoutEvaluationsAsync(
                int? position = null, 
                int? department = null, 
                string? search = null)
        {
            var query = _dataService.GetEmployeesWithoutEvaluationsQuery();

            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    ((e.FirstName ?? "") + " " + (e.LastName ?? "")).Contains(search) ||
                    (e.FirstName ?? "").Contains(search) ||
                    (e.LastName ?? "").Contains(search));

            return query.ToList();
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
            var query = _dataService.GetEmployeesWithoutEvaluationsQuery();

            // Appliquer les filtres
            if (position.HasValue)
                query = query.Where(e => e.positionId == position);

            if (department.HasValue)
                query = query.Where(e => e.DepartmentId == department);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e =>
                    ((e.FirstName ?? "") + " " + (e.LastName ?? "")).Contains(search) ||
                    (e.FirstName ?? "").Contains(search) ||
                    (e.LastName ?? "").Contains(search));
                    
            // Éliminer les doublons en récupérant les IDs uniques
            var uniqueEmployeeIds = query
                .Select(e => e.EmployeeId)
                .Distinct()
                .ToList();
                
            // Pour chaque ID unique, récupérer le premier enregistrement correspondant
            var uniqueEmployees = new List<VEmployeeWithoutEvaluation>();
            foreach (var employeeId in uniqueEmployeeIds)
            {
                var employee = query
                    .FirstOrDefault(e => e.EmployeeId == employeeId);
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
            // Récupérer toutes les données nécessaires
            var evaluations = _dataService.GetEvaluationsQuery().Where(e => e.state == 10).ToList();
            var employees = (await _employeeRepository.GetAllAsync()).ToDictionary(e => e.EmployeeId);
            var evaluationTypes = (await _evaluationTypeRepository.GetAllAsync()).ToDictionary(et => et.EvaluationTypeId);
            var positions = (await _posteRepository.GetAllAsync()).ToDictionary(p => p.PositionId);
            var departments = (await _departementRepository.GetAllAsync()).ToDictionary(d => d.DepartmentId);

            // Construire le DTO en mémoire
            var query = evaluations
                .Where(e => employees.ContainsKey(e.EmployeeId))
                .Select(e =>
                {
                    var emp = employees.GetValueOrDefault(e.EmployeeId);
                    var et = evaluationTypes.GetValueOrDefault(e.EvaluationTypeId);
                    return new PlannedEvaluationDto
                    {
                        EvaluationId = e.EvaluationId,
                        EmployeeId = emp?.EmployeeId ?? 0,
                        EmployeeFirstName = emp?.FirstName ?? "",
                        EmployeeLastName = emp?.Name ?? "",
                        PositionId = emp != null && emp.Department_id.HasValue ? positions.GetValueOrDefault(emp.Department_id.Value)?.PositionId ?? 0 : 0,
                        PositionName = emp != null && emp.Department_id.HasValue ? positions.GetValueOrDefault(emp.Department_id.Value)?.PositionName ?? "Non défini" : "Non défini",
                        DepartmentId = emp?.Department_id ?? 0,
                        DepartmentName = emp != null && emp.Department_id.HasValue ? departments.GetValueOrDefault(emp.Department_id.Value)?.Name ?? "Non défini" : "Non défini",
                        EvaluationTypeId = e.EvaluationTypeId,
                        EvaluationTypeName = et?.Designation ?? "",
                        StartDate = e.StartDate,
                        EndDate = e.EndDate,
                        State = e.state
                    };
                }).AsQueryable();

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
            var totalItems = query.Count();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            // Récupérer la page demandée
            var result = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (result, totalPages);
        }
    }
}
