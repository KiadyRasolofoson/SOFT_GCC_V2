using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResponseTypeController : ControllerBase
    {
        private readonly ResponseTypeService _responseTypeService;

        public ResponseTypeController(ResponseTypeService responseTypeService)
        {
            _responseTypeService = responseTypeService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ResponseType>>> GetAll()
        {
            try
            {
                var responseTypes = await _responseTypeService.GetAllAsync();
                // Formater les données pour assurer la cohérence avec le format attendu par le frontend
                var formattedResponseTypes = responseTypes.Select(rt => new {
                    ResponseTypeId = rt.ResponseTypeId,
                    TypeName = rt.TypeName ?? "Non défini",
                    Description = rt.Description ?? "Sans description"
                }).ToList();
                
                return Ok(formattedResponseTypes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des types de réponse: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ResponseType>> GetById(int id)
        {
            try
            {
                var responseType = await _responseTypeService.GetByIdAsync(id);
                if (responseType == null)
                    return NotFound(new { error = $"Type de réponse avec ID {id} non trouvé" });
                    
                // Formater la réponse pour assurer la cohérence
                var formattedResponseType = new {
                    ResponseTypeId = responseType.ResponseTypeId,
                    TypeName = responseType.TypeName ?? "Non défini",
                    Description = responseType.Description ?? "Sans description"
                };
                
                return Ok(formattedResponseType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ResponseType>> Create(ResponseType responseType)
        {
            try
            {
                // Validation basique
                if (string.IsNullOrWhiteSpace(responseType.TypeName))
                {
                    return BadRequest(new { error = "Le nom du type de réponse est requis" });
                }
                
                var createdResponseType = await _responseTypeService.CreateAsync(responseType);
                
                // Formater la réponse pour assurer la cohérence
                var formattedResponseType = new {
                    ResponseTypeId = createdResponseType.ResponseTypeId,
                    TypeName = createdResponseType.TypeName ?? "Non défini",
                    Description = createdResponseType.Description ?? "Sans description"
                };
                
                return CreatedAtAction(nameof(GetById), new { id = createdResponseType.ResponseTypeId }, formattedResponseType);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ResponseType responseType)
        {
            if (id != responseType.ResponseTypeId)
                return BadRequest(new { error = "L'ID dans l'URL ne correspond pas à l'ID dans les données" });

            try
            {
                // Validation basique
                if (string.IsNullOrWhiteSpace(responseType.TypeName))
                {
                    return BadRequest(new { error = "Le nom du type de réponse est requis" });
                }
                
                await _responseTypeService.UpdateAsync(responseType);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _responseTypeService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }
} 