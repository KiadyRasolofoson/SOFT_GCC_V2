using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class CompetenceLineService
    {
        private readonly ApplicationDbContext _context;

        public CompetenceLineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CompetenceLine>> GetAllAsync()
        {
            return await _context.competenceLines
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .Where(c => c.State == 1)
                .ToListAsync();
        }

        public async Task<CompetenceLine> GetByIdAsync(int id)
        {
            return await _context.competenceLines
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .FirstOrDefaultAsync(c => c.CompetenceLineId == id && c.State == 1);
        }

        public async Task<IEnumerable<CompetenceLine>> GetByPositionIdAsync(int positionId)
        {
            return await _context.competenceLines
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .Where(c => c.SkillPosition.Position.PositionId == positionId && c.State == 1)
                .Select(c => new CompetenceLine
                {
                    CompetenceLineId = c.CompetenceLineId,
                    SkillPositionId = c.SkillPositionId,
                    Description = c.Description,
                    State = c.State,
                    SkillPosition = new SkillPosition
                    {
                        SkillPositionId = c.SkillPosition.SkillPositionId,
                        Skill = c.SkillPosition.Skill,
                        Position = c.SkillPosition.Position
                    }
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<CompetenceLine>> GetBySkillPositionIdAsync(int skillPositionId)
        {
            return await _context.competenceLines
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Skill)
                .Include(c => c.SkillPosition)
                    .ThenInclude(sp => sp.Position)
                .Where(c => c.SkillPositionId == skillPositionId && c.State == 1)
                .ToListAsync();
        }

        public async Task<CompetenceLine> CreateAsync(CompetenceLine competenceLine)
        {
            competenceLine.State = 1;
            _context.competenceLines.Add(competenceLine);
            await _context.SaveChangesAsync();
            return competenceLine;
        }

        public async Task<CompetenceLine> UpdateAsync(CompetenceLine competenceLine)
        {
            var existingCompetenceLine = await _context.competenceLines.FindAsync(competenceLine.CompetenceLineId);
            if (existingCompetenceLine == null)
                throw new Exception("Ligne de compétence non trouvée");

            existingCompetenceLine.SkillPositionId = competenceLine.SkillPositionId;
            existingCompetenceLine.Description = competenceLine.Description;
            existingCompetenceLine.State = competenceLine.State;
            
            await _context.SaveChangesAsync();
            return existingCompetenceLine;
        }

        public async Task DeleteAsync(int id)
        {
            var competenceLine = await _context.competenceLines.FindAsync(id);
            if (competenceLine == null)
                throw new Exception("Ligne de compétence non trouvée");

            competenceLine.State = 0;
            await _context.SaveChangesAsync();
        }
    }
} 