using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.career_plan
{
	public class CareerPlanService : ICareerPlanService
	{
		private readonly IGenericRepository<CareerPlan> _repository;
		private readonly ICareerPlanDataService _dataService;
		private readonly IEchelonService _echelonService;
		private readonly ILegalClassService _legalClassService;
		private readonly IIndicationService _indicationService;
		private readonly IAssignmentTypeService _assignmentTypeService;
		private readonly IHistoryService _historyService;

		public CareerPlanService(
			IGenericRepository<CareerPlan> repository,
			ICareerPlanDataService dataService,
			IEchelonService echelonService,
			ILegalClassService legalClassService,
			IIndicationService indicationService,
			IAssignmentTypeService assignmentTypeService,
			IHistoryService historyService)
		{
			_repository = repository;
			_dataService = dataService;
			_echelonService = echelonService;
			_legalClassService = legalClassService;
			_indicationService = indicationService;
			_assignmentTypeService = assignmentTypeService;
			_historyService = historyService;
		}

		public async Task<CareerPlan?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Update(CareerPlan careerPlan)
		{
			await _repository.Update(careerPlan);
		}

		public async Task Add(CareerPlan careerPlan)
		{
			await _repository.Add(careerPlan);
		}

		/// <summary>
		/// Crée un acte de carrière : contrôle du type, validation métier (FP-03),
		/// clôture des plans actifs (FP-01), insertion et journal d'activité.
		/// Toute la logique vit ici (controllers minces, zéro logique métier en présentation).
		/// </summary>
		public async Task<CareerPlan> CreateAsync(CareerPlan careerPlan, string? clientIp = null)
		{
			if (careerPlan == null)
			{
				throw new ValidationException("Le plan de carrière est requis.");
			}

			AssignmentType? assignmentType = await _assignmentTypeService.GetById(careerPlan.AssignmentTypeId);
			if (assignmentType == null)
			{
				throw new NotFoundException("Type d'affectation", careerPlan.AssignmentTypeId);
			}

			await ValidateAsync(careerPlan);
			await CloseActivePlansAsync(careerPlan.RegistrationNumber, careerPlan.AssignmentDate);
			await Add(careerPlan);

			await _historyService.Add(new ActivityLog
			{
				UserId = 1, // TODO : remplacer par l'ID utilisateur du contexte (claim "userId")
				Module = 2,
				Action = "Création",
				Description = $"L'utilisateur 1 a créé un nouveau plan de carrière de type {assignmentType.AssignmentTypeName} pour l'employé {careerPlan.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = clientIp ?? "IP inconnue"
			});

			return careerPlan;
		}

		/// <summary>
		/// Met à jour un acte de carrière : validation métier (FP-03), mise à jour et journal d'activité.
		/// </summary>
		public async Task UpdateAsync(CareerPlan careerPlan, string? clientIp = null)
		{
			if (careerPlan == null)
			{
				throw new ValidationException("Le plan de carrière est requis.");
			}

			await ValidateAsync(careerPlan);
			await Update(careerPlan);

			AssignmentType? assignmentType = await _assignmentTypeService.GetById(careerPlan.AssignmentTypeId);
			await _historyService.Add(new ActivityLog
			{
				UserId = 1,
				Module = 2,
				Action = "Modification",
				Description = $"L'utilisateur 1 a modifié un plan de carrière de type {assignmentType?.AssignmentTypeName} pour l'employé {careerPlan.RegistrationNumber}",
				Timestamp = DateTime.UtcNow,
				Metadata = clientIp ?? "IP inconnue"
			});
		}

		// Recuperer les nominations d'un employe
		public async Task<List<VAssignmentAppointment>> GetAssignmentAppointment(string registrationNumber)
			=> await _dataService.GetAssignmentAppointment(registrationNumber);

		// Recuperer les avancements d'un employe
		public async Task<List<VAssignmentAdvancement>> GetAssignmentAdvancement(string registrationNumber)
			=> await _dataService.GetAssignmentAdvancement(registrationNumber);

		// Recuperer les mises en disponibilites d'un employe
		public async Task<List<VAssignmentAvailability>> GetAssignmentAvailability(string registrationNumber)
			=> await _dataService.GetAssignmentAvailability(registrationNumber);

		// Recuperer le dernier plan de carrière de l'employé 
		public async Task<CareerPlan?> GetLastCareerPlanByEmployee(string registrationNumber)
			=> await _dataService.GetLastCareerPlanByEmployee(registrationNumber);

		// Recuperer les mises en disponibilites d'un employe
		public async Task<List<History>> GetHistory(string registrationNumber)
			=> await _dataService.GetHistory(registrationNumber);

		// Recuperer les mises en disponibilites d'un employe
		public async Task<VEmployeeCareer?> GetCareerByEmployee(string registrationNumber)
			=> await _dataService.GetCareerByEmployee(registrationNumber);

		// Nombre de carriere des employes
		public async Task<object> GetAllCareers(int pageNumber = 1, int pageSize = 10)
			=> await _dataService.GetAllCareers(pageNumber, pageSize);

		// Filtrer les carrieres
		public async Task<(List<VEmployeeCareer> Data, int TotalCount)> GetAllCareersFilter(
			string? keyWord = null,
			string? departmentId = null,
			string? positionId = null,
			string? dateAssignmentMin = null,
			string? dateAssignmentMax = null,
			int page = 1,
			int pageSize = 10)
			=> await _dataService.GetAllCareersFilter(keyWord, departmentId, positionId, dateAssignmentMin, dateAssignmentMax, page, pageSize);

		// Filtrer les carrieres
		public async Task<object> GetAllCareersFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
			=> await _dataService.GetAllCareersFilter(keyWord, pageNumber, pageSize);

		// supprimer un plan de carrière
		public async Task<bool> DeleteCareerPlan(int careerPlanId)
			=> await _dataService.DeleteCareerPlan(careerPlanId);

		// Restaurer un plan de carrière
		public async Task<bool> RestoreCareerPlan(int careerPlanId)
			=> await _dataService.RestoreCareerPlan(careerPlanId);

		// Supprimer definitivement un plan de carrière
		public async Task<bool> DeleteDefinitivelyCareerPlan(int careerPlanId)
			=> await _dataService.DeleteDefinitivelyCareerPlan(careerPlanId);

		// Supprimer definitivement un plan de carrière
		public async Task<bool> DeleteHistory(int historyId)
			=> await _dataService.DeleteHistory(historyId);

		// Récuperer la dernière ligne enregistré pour l'employé et le type de contrat correspondant
		public async Task<CareerPlan?> GetByEmployeeAndContractType(string? registrationNumber)
			=> await _dataService.GetByEmployeeAndContractType(registrationNumber);

		/// <summary>
		/// FP-03 : valide les règles métier d'un acte de carrière avant création/modification.
		/// Lève une <see cref="ValidationException"/> (HTTP 422 via le middleware global) en cas de violation.
		/// </summary>
		public async Task ValidateAsync(CareerPlan plan)
		{
			if (plan == null)
			{
				throw new ValidationException("Le plan de carrière est requis.");
			}

			// Dates cohérentes : la décision ne peut pas être postérieure à l'affectation.
			if (plan.DecisionDate.HasValue && plan.AssignmentDate.HasValue && plan.DecisionDate > plan.AssignmentDate)
			{
				throw new ValidationException(
					$"La date de décision ({plan.DecisionDate:yyyy-MM-dd}) ne peut pas être postérieure à la date d'affectation ({plan.AssignmentDate:yyyy-MM-dd}).");
			}

			// R2 : l'échelon doit correspondre à l'indice de la grille (Echelon.Indication_id).
			if (plan.EchelonId.HasValue && plan.IndicationId.HasValue)
			{
				Echelon? echelon = await _echelonService.GetById(plan.EchelonId.Value);
				if (echelon != null && echelon.IndicationId.HasValue && echelon.IndicationId.Value != plan.IndicationId.Value)
				{
					throw new ValidationException(
						$"L'échelon « {echelon.EchelonName ?? echelon.EchelonId.ToString()} » ne correspond pas à l'indice sélectionné.");
				}
			}

			// Grille minima : le salaire de base doit être >= au minimum de la classe légale.
			if (plan.LegalClassId.HasValue && plan.BaseSalary.HasValue)
			{
				LegalClass? legalClass = await _legalClassService.GetById(plan.LegalClassId.Value);
				if (legalClass != null && legalClass.MinSalary.HasValue && plan.BaseSalary.Value < (double)legalClass.MinSalary.Value)
				{
					throw new ValidationException(
						$"Le salaire de base ({plan.BaseSalary.Value}) est inférieur au minimum de la classe légale « {legalClass.LegalClassName ?? legalClass.LegalClassId.ToString()} » ({legalClass.MinSalary.Value}).");
				}
			}

			// R1 : pour un avancement (type 3), l'indice doit être strictement supérieur à l'indice actuel.
			if (plan.AssignmentTypeId == 3 && plan.IndicationId.HasValue)
			{
				CareerPlan? last = await GetLastCareerPlanByEmployee(plan.RegistrationNumber);
				if (last != null && last.CareerPlanId != plan.CareerPlanId && last.IndicationId.HasValue)
				{
					Indication? current = await _indicationService.GetById(last.IndicationId.Value);
					Indication? next = await _indicationService.GetById(plan.IndicationId.Value);
					if (current?.IndicationValue.HasValue == true && next?.IndicationValue.HasValue == true
						&& next.IndicationValue.Value <= current.IndicationValue.Value)
					{
						throw new ValidationException(
							$"Le nouvel indice ({next.IndicationValue.Value}) doit être strictement supérieur à l'indice actuel ({current.IndicationValue.Value}).");
					}
				}
			}
		}

		/// <summary>
		/// FP-01 : clôture tous les plans actifs de l'employé avant d'insérer le nouvel acte.
		/// </summary>
		public async Task<int> CloseActivePlansAsync(string? registrationNumber, DateTime? endingDate)
			=> await _dataService.CloseActivePlansAsync(registrationNumber, endingDate);
	}
}
