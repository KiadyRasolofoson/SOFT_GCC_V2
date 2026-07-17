using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class ResponseTypeService
    {
        private readonly IGenericRepository<ResponseType> _repository;

        public ResponseTypeService(IGenericRepository<ResponseType> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ResponseType>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<ResponseType?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<ResponseType> CreateAsync(ResponseType responseType)
        {
            await _repository.CreateAsync(responseType);
            return responseType;
        }

        public async Task<ResponseType> UpdateAsync(ResponseType responseType)
        {
            var existingResponseType = await _repository.GetByIdAsync(responseType.ResponseTypeId);
            if (existingResponseType == null)
                throw new Exception("Type de réponse non trouvé");

            existingResponseType.TypeName = responseType.TypeName;
            existingResponseType.Description = responseType.Description;
            
            await _repository.UpdateAsync(existingResponseType);
            return existingResponseType;
        }

        public async Task DeleteAsync(int id)
        {
            var responseType = await _repository.GetByIdAsync(id);
            if (responseType == null)
                throw new Exception("Type de réponse non trouvé");

            await _repository.DeleteAsync(responseType);
        }
    }
} 