using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompetenceTrainingController : ControllerBase
    {
        private readonly CompetenceTrainingService _competenceTrainingService;

        public CompetenceTrainingController(CompetenceTrainingService competenceTrainingService)
        {
            _competenceTrainingService = competenceTrainingService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetenceTraining>>> GetAll()
        {
            var trainings = await _competenceTrainingService.GetAllAsync();
            return Ok(trainings);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CompetenceTraining>> GetById(int id)
        {
            var training = await _competenceTrainingService.GetByIdAsync(id);
            if (training == null)
                return NotFound();
            return Ok(training);
        }

        [HttpGet("competence/{competenceLineId}")]
        public async Task<ActionResult<IEnumerable<CompetenceTraining>>> GetByCompetenceLineId(int competenceLineId)
        {
            var trainings = await _competenceTrainingService.GetByCompetenceLineIdAsync(competenceLineId);
            return Ok(trainings);
        }

        [HttpPost]
        public async Task<ActionResult<CompetenceTraining>> Create(CompetenceTraining training)
        {
            try
            {
                var createdTraining = await _competenceTrainingService.CreateAsync(training);
                return CreatedAtAction(nameof(GetById), new { id = createdTraining.TrainingId }, createdTraining);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CompetenceTraining training)
        {
            if (id != training.TrainingId)
                return BadRequest("ID mismatch");

            try
            {
                await _competenceTrainingService.UpdateAsync(training);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _competenceTrainingService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
} 