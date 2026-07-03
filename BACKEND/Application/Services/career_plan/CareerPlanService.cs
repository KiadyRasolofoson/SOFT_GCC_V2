using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.career_plan
{
	public class CareerPlanService
	{
		private readonly ICrudRepository<CareerPlan> _repository;
		private readonly ICareerPlanDataService _dataService;

		public CareerPlanService(ICrudRepository<CareerPlan> repository, ICareerPlanDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<CareerPlan> GetById(int id)
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
	}
}
