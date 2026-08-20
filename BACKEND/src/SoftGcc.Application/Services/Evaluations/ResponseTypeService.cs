using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Services.Evaluations
{
    public class ResponseTypeService : IResponseTypeService
    {
        private const string MissingTypeNameLabel = "Non défini";
        private const string MissingDescriptionLabel = "Sans description";

        private readonly IGenericRepository<ResponseType> _repository;

        public ResponseTypeService(IGenericRepository<ResponseType> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ResponseType>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<IEnumerable<ResponseTypeSummaryDto>> GetSummariesAsync()
        {
            var responseTypes = await _repository.GetAllAsync();
            if (responseTypes is null)
            {
                return Array.Empty<ResponseTypeSummaryDto>();
            }

            return responseTypes.Select(responseType => new ResponseTypeSummaryDto(
                responseType.ResponseTypeId,
                string.IsNullOrEmpty(responseType.TypeName) ? MissingTypeNameLabel : responseType.TypeName,
                string.IsNullOrEmpty(responseType.Description)
                    ? MissingDescriptionLabel
                    : responseType.Description)).ToList();
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
                throw new NotFoundException("Type de réponse", responseType.ResponseTypeId);

            existingResponseType.TypeName = responseType.TypeName;
            existingResponseType.Description = responseType.Description;
            
            await _repository.UpdateAsync(existingResponseType);
            return existingResponseType;
        }

        public async Task DeleteAsync(int id)
        {
            var responseType = await _repository.GetByIdAsync(id);
            if (responseType == null)
                throw new NotFoundException("Type de réponse", id);

            await _repository.DeleteAsync(responseType);
        }
    }
} 