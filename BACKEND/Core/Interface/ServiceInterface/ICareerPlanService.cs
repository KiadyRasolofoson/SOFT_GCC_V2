using soft_carriere_competence.Core.Entities.career_plan;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service CareerPlan.
    /// </summary>
    public interface ICareerPlanService : IService<CareerPlan>
    {
        // Méthodes spécifiques au plan de carrière
        Task<IEnumerable<CareerPlan>> GetByEmployeeId(int employeeId);
    }
}
