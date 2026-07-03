using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationTypeController : ControllerBase
    {
        private readonly EvaluationTypeService _evaluationTypeService;

        public EvaluationTypeController(EvaluationTypeService evaluationTypeService)
        {
            _evaluationTypeService = evaluationTypeService;
        }

        // GET: api/EvaluationType
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EvaluationType>>> GetEvaluationTypes()
        {
            var evaluationTypes = await _evaluationTypeService.GetAllEvaluationTypeAsync();
            return Ok(evaluationTypes);
        }

        // GET: api/EvaluationType/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EvaluationType>> GetEvaluationType(int id)
        {
            var evaluationType = await _evaluationTypeService.GetEvaluationTypeByIdAsync(id);
            if (evaluationType == null)
            {
                return NotFound();
            }
            return Ok(evaluationType);
        }

        // POST: api/EvaluationType
        [HttpPost]
        public async Task<ActionResult<EvaluationType>> PostEvaluationType(EvaluationType evaluationType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var createdEvaluationType = await _evaluationTypeService.CreateEvaluationTypeAsync(evaluationType);
            return CreatedAtAction(nameof(GetEvaluationType), new { id = createdEvaluationType.EvaluationTypeId }, createdEvaluationType);
        }

        // PUT: api/EvaluationType/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEvaluationType(int id, EvaluationType evaluationType)
        {
            if (id != evaluationType.EvaluationTypeId)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingType = await _evaluationTypeService.GetEvaluationTypeByIdAsync(id);
            if (existingType == null)
            {
                return NotFound();
            }

            await _evaluationTypeService.UpdateEvaluationTypeAsync(evaluationType);
            return NoContent();
        }

        // DELETE: api/EvaluationType/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvaluationType(int id)
        {
            var evaluationType = await _evaluationTypeService.GetEvaluationTypeByIdAsync(id);
            if (evaluationType == null)
            {
                return NotFound();
            }

            await _evaluationTypeService.DeleteEvaluationTypeAsync(id);
            return NoContent();
        }
    }
} 