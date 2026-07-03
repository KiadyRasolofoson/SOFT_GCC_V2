using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class PositionService
	{
		private readonly ICrudRepository<Position> _repository;

		public PositionService(ICrudRepository<Position> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Position>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Position> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Position position)
		{
			await _repository.Add(position);
		}

		public async Task Update(Position position)
		{
			await _repository.Update(position);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
