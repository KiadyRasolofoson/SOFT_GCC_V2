using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations;

/// <summary>Catalogue des suggestions de formation déclenchées par les notes d'une évaluation.</summary>
[ApiController]
[Route("api/Evaluation")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
public sealed class EvaluationTrainingSuggestionsController : ControllerBase
{
    private readonly IEvaluationTrainingSuggestionService _trainingSuggestionService;
    private readonly ITrainingSuggestionImportService _importService;

    public EvaluationTrainingSuggestionsController(
        IEvaluationTrainingSuggestionService trainingSuggestionService,
        ITrainingSuggestionImportService importService)
    {
        _trainingSuggestionService = trainingSuggestionService;
        _importService = importService;
    }

    [HttpPost("suggestions")]
    [ProducesResponseType(typeof(IEnumerable<TrainingSuggestionResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrainingSuggestionResultDto>>> GetSuggestionsForRatingsAsync(
        [FromBody] TrainingSuggestionsRequestDto request)
    {
        return Ok(await _trainingSuggestionService.GetTrainingSuggestionsByQuestionsAsync(request.Ratings));
    }

    [HttpPost("create-training-suggestion")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> CreateSuggestionAsync(
        [FromBody] TrainingSuggestionCreationDto suggestion)
    {
        await _trainingSuggestionService.CreateTrainingSuggestionAsync(suggestion);

        return Ok(new ApiResponse<object>(Message: "Training suggestion created successfully."));
    }

    [HttpGet("training-suggestions")]
    [ProducesResponseType(typeof(IEnumerable<TrainingSuggestion>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrainingSuggestion>>> GetSuggestionsAsync()
    {
        return Ok(await _trainingSuggestionService.GetAllTrainingSuggestionsAsync());
    }

    [HttpGet("training-suggestions/paginated")]
    [ProducesResponseType(typeof(PagedResult<TrainingSuggestion>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<TrainingSuggestion>>> GetSuggestionPageAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize)
    {
        var page = PageRequest.Create(pageNumber, pageSize);

        return Ok(await _trainingSuggestionService.GetTrainingSuggestionPageAsync(page));
    }

    [HttpGet("training-suggestions/{id}")]
    [ProducesResponseType(typeof(TrainingSuggestion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrainingSuggestion>> GetSuggestionAsync(int id)
    {
        return Ok(await _trainingSuggestionService.GetRequiredTrainingSuggestionAsync(id));
    }

    [HttpPut("training-suggestions/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSuggestionAsync(
        int id,
        [FromBody] TrainingSuggestionCreationDto suggestion)
    {
        await _trainingSuggestionService.UpdateTrainingSuggestionAsync(id, suggestion);

        return NoContent();
    }

    [HttpDelete("training-suggestions/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSuggestionAsync(int id)
    {
        await _trainingSuggestionService.DeleteTrainingSuggestionAsync(id);

        return NoContent();
    }

    [HttpPost("import-training-suggestions")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TrainingSuggestionImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<TrainingSuggestionImportResultDto>> ImportSuggestionsAsync(IFormFile file)
    {
        return Ok(await _importService.ImportFromCsvAsync(file));
    }
}
