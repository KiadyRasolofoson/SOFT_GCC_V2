using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class RoleService
    {
        private readonly IGenericRepository<Role> _repository;

        public RoleService(IGenericRepository<Role> repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Role>> GetAllAsync()
        {
            return await _repository.FindAsync(r => r.state == null || r.state == 1);
        }

        public async Task<Role> GetByIdAsync(int id)
        {
            return await _repository.GetFirstOrDefaultAsync(r => r.Roleid == id && (r.state == null || r.state == 1));
        }

        public async Task<Role> CreateAsync(Role role)
        {
            role.state = 1;
            await _repository.CreateAsync(role);
            return role;
        }

        public async Task<Role> UpdateAsync(Role role)
        {
            var existingRole = await _repository.GetByIdAsync(role.Roleid);
            if (existingRole == null)
                throw new Exception("Rôle non trouvé");

            existingRole.Title = role.Title;
            existingRole.state = role.state;
            await _repository.UpdateAsync(existingRole);
            return existingRole;
        }

        public async Task DeleteAsync(int id)
        {
            var role = await _repository.GetByIdAsync(id);
            if (role == null)
                throw new Exception("Rôle non trouvé");

            role.state = 0;
            await _repository.UpdateAsync(role);
        }
    }
} 