using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class ResponseTypeService
    {
        private readonly ApplicationDbContext _context;

        public ResponseTypeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ResponseType>> GetAllAsync()
        {
            return await _context.ResponseTypes.ToListAsync();
        }

        public async Task<ResponseType> GetByIdAsync(int id)
        {
            return await _context.ResponseTypes.FindAsync(id);
        }

        public async Task<ResponseType> CreateAsync(ResponseType responseType)
        {
            _context.ResponseTypes.Add(responseType);
            await _context.SaveChangesAsync();
            return responseType;
        }

        public async Task<ResponseType> UpdateAsync(ResponseType responseType)
        {
            var existingResponseType = await _context.ResponseTypes.FindAsync(responseType.ResponseTypeId);
            if (existingResponseType == null)
                throw new Exception("Type de réponse non trouvé");

            existingResponseType.TypeName = responseType.TypeName;
            existingResponseType.Description = responseType.Description;
            
            await _context.SaveChangesAsync();
            return existingResponseType;
        }

        public async Task DeleteAsync(int id)
        {
            var responseType = await _context.ResponseTypes.FindAsync(id);
            if (responseType == null)
                throw new Exception("Type de réponse non trouvé");

            _context.ResponseTypes.Remove(responseType);
            await _context.SaveChangesAsync();
        }
    }
} 