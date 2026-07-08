using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using Microsoft.AspNetCore.Authorization;

namespace soft_carriere_competence.Controllers.Evaluations
{
	[ApiController]
	[Route("api/[controller]")]
	public class EvaluationController : ControllerBase
	{
		private readonly EvaluationService _evaluationService;
		private readonly EvaluationResponseService _responseService;
		private readonly EvaluationCompetenceService _evaluationCompetenceService;
		private readonly CompetenceLineService _competenceLineService;
		private readonly ResponseTypeService _responseTypeService;
		private readonly TrainingSuggestionService _trainingSuggestionService;

		public EvaluationController(EvaluationService evaluationService,
		EvaluationResponseService responseService, EvaluationCompetenceService evaluationCompetenceService,
		CompetenceLineService competenceLineService, ResponseTypeService responseTypeService, TrainingSuggestionService trainingSuggestionService)
		{
			_evaluationService = evaluationService;
			_responseService = responseService;
			_evaluationCompetenceService = evaluationCompetenceService;
			_competenceLineService = competenceLineService;
			_responseTypeService = responseTypeService;
			_trainingSuggestionService = trainingSuggestionService;
		}

		// Create a new evaluation question
		[HttpPost("questions")]
		public async Task<IActionResult> CreateEvaluationQuestion([FromBody] EvaluationQuestionDto questionDto)
		{
			if (questionDto == null)
			{
				return BadRequest("Les données de la question sont requises.");
			}

			try
			{
				// Créer une nouvelle instance de EvaluationQuestion avec seulement les propriétés simples
				var newQuestion = new EvaluationQuestion
				{
					question = questionDto.Question,
					evaluationTypeId = questionDto.EvaluationTypeId,
					positionId = questionDto.PositionId,
					CompetenceLineId = questionDto.CompetenceLineId,
					ResponseTypeId = questionDto.ResponseTypeId,
					state = questionDto.State
				};

				// Utiliser le service pour créer la question
				await _evaluationService.CreateEvaluationQuestionAsync(newQuestion);

				return CreatedAtAction(nameof(GetEvaluationQuestionById), new { id = newQuestion.questionId }, new
				{
					questionId = newQuestion.questionId,
					question = newQuestion.question,
					evaluationTypeId = newQuestion.evaluationTypeId,
					positionId = newQuestion.positionId,
					CompetenceLineId = newQuestion.CompetenceLineId,
					ResponseTypeId = newQuestion.ResponseTypeId,
					state = newQuestion.state
				});
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la création de la question: {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				return StatusCode(500, new
				{
					error = ex.Message,
					details = "Erreur lors de la création de la question",
					stackTrace = ex.StackTrace
				});
			}
		}
		// Get all evaluation questions
		[HttpGet("questionsAll")]
		public async Task<IActionResult> GetAllEvaluationQuestions()
		{
			var questions = await _evaluationService.GetAllEvaluationQuestionsAsync();
			return Ok(questions);
		}

		// Delete an evaluation question
		[HttpDelete("questions/{id}")]
		public async Task<IActionResult> DeleteEvaluationQuestion(int id)
		{
			try
			{
				var deleted = await _evaluationService.DeleteEvaluationQuestionAsync(id);
				if (!deleted)
				{
					return NotFound($"Question with ID {id} not found.");
				}
				return NoContent(); // 204 No Content
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}


		// Update an existing evaluation question
		[HttpPut("questions/{id}")]
		public async Task<IActionResult> UpdateEvaluationQuestion(int id, [FromBody] EvaluationQuestionDto questionDto)
		{
			if (questionDto == null || (questionDto.QuestionId.HasValue && questionDto.QuestionId.Value != id))
			{
				return BadRequest("Données de question invalides.");
			}

			try
			{
				var existingQuestion = await _evaluationService.GetEvaluationQuestionByIdAsync(id);

				if (existingQuestion == null)
				{
					return NotFound($"Question avec ID {id} non trouvée.");
				}

				// Mettre à jour les propriétés simples
				existingQuestion.question = questionDto.Question;
				existingQuestion.evaluationTypeId = questionDto.EvaluationTypeId;
				existingQuestion.positionId = questionDto.PositionId;
				existingQuestion.CompetenceLineId = questionDto.CompetenceLineId;
				existingQuestion.ResponseTypeId = questionDto.ResponseTypeId;
				existingQuestion.state = questionDto.State;

				// Utiliser le service pour mettre à jour la question
				await _evaluationService.UpdateEvaluationQuestionAsync(existingQuestion);

				return NoContent(); // 204 No Content
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la mise à jour de la question: {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				return StatusCode(500, new
				{
					error = ex.Message,
					details = "Erreur lors de la mise à jour de la question",
					stackTrace = ex.StackTrace
				});
			}
		}

		// Get a specific evaluation question by ID
		[HttpGet("questions/{id}")]
		public async Task<IActionResult> GetEvaluationQuestionById(int id)
		{
			try
			{
				var question = await _evaluationService.GetEvaluationQuestionByIdAsync(id);
				if (question == null)
				{
					return NotFound($"Question with ID {id} not found.");
				}
				return Ok(question);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}
		[HttpGet("questions")]
		public async Task<IActionResult> GetEvaluationQuestions([FromQuery] int evaluationTypeId, [FromQuery] int positionId)
		{
			try
			{
				var questions = await _evaluationService.GetEvaluationQuestionsAsync(evaluationTypeId, positionId);
				return Ok(questions);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("types")]
		public async Task<IActionResult> GetEvaluationTypes()
		{
			var evaluationTypes = await _evaluationService.GetEvaluationTypeAsync();
			if (evaluationTypes == null || !evaluationTypes.Any())
				return NotFound("No evaluation types found.");

			return Ok(evaluationTypes);
		}

		[HttpGet("postes")]
		public async Task<IActionResult> GetPostes()
		{
			var posts = await _evaluationService.GetPostesAsync(); // Assuming you have a method in your service to get posts
			if (posts == null || !posts.Any())
				return NotFound("No posts found.");

			return Ok(posts);
		}

		[HttpPost("calculate-average")]
		public IActionResult CalculateAverage([FromBody] Dictionary<int, int> ratings)
		{
			if (ratings == null || ratings.Count == 0)
			{
				return BadRequest("No ratings provided.");
			}

			double average = _evaluationService.CalculateAverageRating(ratings);
			return Ok(new { average = Math.Round(average, 2) });
		}



		[HttpPost("save-evaluation-results")]
		public async Task<IActionResult> SaveEvaluationResults([FromBody] EvaluationResultsDto dto)
		{
			// Log des données reçues
			Console.WriteLine("==== Données reçues dans SaveEvaluationResults ====");
			Console.WriteLine($"EvaluationId: {dto.EvaluationId}");
			Console.WriteLine("Ratings:");
			foreach (var rating in dto.Ratings)
			{
				Console.WriteLine($"  QuestionId: {rating.Key}, Score: {rating.Value}");
			}
			Console.WriteLine($"OverallScore: {dto.OverallScore}");
			Console.WriteLine($"Strengths: {dto.Strengths}");
			Console.WriteLine($"Weaknesses: {dto.Weaknesses}");
			Console.WriteLine($"GeneralEvaluation: {dto.GeneralEvaluation}");

			// Log des notations détaillées si présentes
			if (dto.HasDetailedRatings())
			{
				Console.WriteLine("Notations détaillées par critères:");
				foreach (var detailedRating in dto.DetailedRatings)
				{
					Console.WriteLine($"  Question {detailedRating.QuestionId}:");
					Console.WriteLine($"    Pertinence: {detailedRating.Relevance?.ToString() ?? "0"}/5");
					Console.WriteLine($"    Technique: {detailedRating.Technical?.ToString() ?? "0"}/5");
					Console.WriteLine($"    Clarté: {detailedRating.Clarity?.ToString() ?? "0"}/5");
					Console.WriteLine($"    Note globale: {detailedRating.OverallRating}/5");
					Console.WriteLine($"    Commentaire: {(string.IsNullOrEmpty(detailedRating.Comment) ? "(aucun)" : detailedRating.Comment)}");
				}
			}

			try
			{
				Console.WriteLine("==== Appel du service SaveEvaluationResultsAsync ====");

				// Appel au service pour sauvegarder les données
				await _evaluationService.SaveEvaluationResultsAsync(dto);

				Console.WriteLine("==== Sauvegarde réussie ====");

				return Ok(new { message = "Evaluation results saved successfully." });
			}
			catch (Exception ex)
			{
				// Log de l'exception
				Console.WriteLine("==== Erreur lors de la sauvegarde ====");
				Console.WriteLine(ex.Message);

				return StatusCode(500, new { error = ex.Message });
			}
		}


		[HttpPost("suggestions")]
		public async Task<IActionResult> GetTrainingSuggestions([FromBody] TrainingSuggestionsRequestDto dto)
		{
			try
			{
				var suggestions = await _evaluationService.GetTrainingSuggestionsByQuestionsAsync(dto.Ratings);
				return Ok(suggestions);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}



		[HttpPost("validate-evaluation")]
		public async Task<IActionResult> ValidateEvaluation([FromBody] EvaluationValidationDto dto)
		{
			try
			{
				var success = await _evaluationService.ValidateEvaluationAsync(
					dto.EvaluationId,
					dto.IsServiceApproved,
					dto.IsDgApproved,
					dto.ServiceApprovalDate,
					dto.DgApprovalDate);

				if (success)
				{
					return Ok(new { message = "Evaluation validated successfully." });
				}
				return BadRequest("Failed to validate evaluation.");
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}




		[HttpPost("create-training-suggestion")]
		public async Task<IActionResult> CreateTrainingSuggestion([FromBody] TrainingSuggestionCreationDto dto)
		{
			try
			{
				var suggestion = new TrainingSuggestion
				{
					evaluationTypeId = dto.EvaluationTypeId,
					questionId = dto.QuestionId,
					Training = dto.Training,
					Details = dto.Details,
					scoreThreshold = dto.ScoreThreshold,
					state = dto.State
				};
				await _evaluationService.CreateTrainingSuggestionAsync(suggestion);
				return Ok(new { message = "Training suggestion created successfully." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("evaluation/{evaluationId}/responses")]
		public async Task<IActionResult> SaveResponse(int evaluationId, [FromBody] EvaluationResponseDto response)
		{
			try
			{
				await _responseService.SaveResponseAsync(evaluationId, response);
				return Ok();
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("evaluation/{evaluationId}/responses")]
		public async Task<IActionResult> GetResponses(int evaluationId)
		{
			try
			{
				var responses = await _responseService.GetResponsesAsync(evaluationId);
				return Ok(responses);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("evaluation/{evaluationId}/responses/{questionId}")]
		public async Task<IActionResult> GetResponse(int evaluationId, int questionId)
		{
			try
			{
				var response = await _responseService.GetResponseAsync(evaluationId, questionId);
				if (response == null)
				{
					return NotFound();
				}
				return Ok(response);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPut("responses/{responseId}")]
		public async Task<IActionResult> UpdateResponse(int responseId, [FromBody] EvaluationResponseDto response)
		{
			try
			{
				await _responseService.UpdateResponseAsync(responseId, response);
				return Ok();
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpDelete("responses/{responseId}")]
		public async Task<IActionResult> DeleteResponse(int responseId)
		{
			try
			{
				await _responseService.DeleteResponseAsync(responseId);
				return NoContent();
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}



		//CRUD TRAINING SUGGESTIONS
		// Get all training suggestions
		[HttpGet("training-suggestions")]
		public async Task<IActionResult> GetAllTrainingSuggestions()
		{
			try
			{
				var suggestions = await _evaluationService.GetAllTrainingSuggestionsAsync();
				return Ok(suggestions);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// Get a specific training suggestion by ID
		[HttpGet("training-suggestions/{id}")]
		public async Task<IActionResult> GetTrainingSuggestionById(int id)
		{
			try
			{
				var suggestion = await _evaluationService.GetTrainingSuggestionByIdAsync(id);
				if (suggestion == null)
				{
					return NotFound($"Training suggestion with ID {id} not found.");
				}
				return Ok(suggestion);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// Update an existing training suggestion
		[HttpPut("training-suggestions/{id}")]
		public async Task<IActionResult> UpdateTrainingSuggestion(int id, [FromBody] TrainingSuggestionCreationDto dto)
		{
			try
			{
				var suggestion = new TrainingSuggestion
				{
					TrainingSuggestionId = id,
					evaluationTypeId = dto.EvaluationTypeId,
					questionId = dto.QuestionId,
					Training = dto.Training,
					Details = dto.Details,
					scoreThreshold = dto.ScoreThreshold,
					state = dto.State
				};

				var updated = await _evaluationService.UpdateTrainingSuggestionAsync(suggestion);
				if (!updated)
				{
					return NotFound($"Training suggestion with ID {id} not found.");
				}
				return NoContent(); // 204 No Content
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// Delete a training suggestion
		[HttpDelete("training-suggestions/{id}")]
		public async Task<IActionResult> DeleteTrainingSuggestion(int id)
		{
			try
			{
				var deleted = await _evaluationService.DeleteTrainingSuggestionAsync(id);
				if (!deleted)
				{
					return NotFound($"Training suggestion with ID {id} not found.");
				}
				return NoContent(); // 204 No Content
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}


		[HttpGet("training-suggestions/paginated")]
		public IActionResult GetPaginatedTrainingSuggestions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
		{
			try
			{
				if (pageNumber < 1) pageNumber = 1;
				if (pageSize < 1) pageSize = 10;
				if (pageSize > 100) pageSize = 100; // Limite supérieure pour éviter les requêtes excessives

				var (items, totalPages) = _evaluationService.GetPaginatedTrainingSuggestionsAsync(pageNumber, pageSize).Result;

				return Ok(new
				{
					Items = items,
					PageNumber = pageNumber,
					PageSize = pageSize,
					TotalPages = totalPages
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("questions/paginated")]
		public async Task<IActionResult> GetPaginatedEvaluationQuestions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
		{
			try
			{
				var result = await _evaluationService.GetPaginatedEvaluationQuestionsAsync(pageNumber, pageSize);

				// Formater les résultats pour inclure plus d'informations sur chaque question
				var formattedItems = result.Items.Select(q => new
				{
					id = q.questionId,
					question = q.question,
					evaluationTypeId = q.evaluationTypeId,
					evaluationTypeName = q.EvaluationType?.Designation,
					positionId = q.positionId,
					positionName = q.Position?.PositionName,
					competenceLineId = q.CompetenceLineId,
					competenceName = q.CompetenceLine?.Description,
					responseTypeId = q.ResponseTypeId,
					responseTypeName = q.ResponseType?.TypeName,
					state = q.state
				}).ToList();

				return Ok(new
				{
					items = formattedItems,
					totalPages = result.TotalPages,
					currentPage = pageNumber,
					pageSize = pageSize,
					totalItems = formattedItems.Count
				});
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur dans l'endpoint questions/paginated: {ex.Message}");
				return StatusCode(500, new { error = ex.Message });
			}
		}


		//EVALUATIONSALARY LOGIN

		[HttpGet("validate-token")]
		public IActionResult ValidateToken()
		{
			// Le jeton est déjà validé par le middleware d'authentification
			// Si cette méthode est atteinte, c'est que le jeton est valide
			return Ok(new { valid = true });
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> GetEvaluationDetails(int id)
		{
			try
			{
				var result = await _evaluationService.GetEvaluationDetailsAsync(id);

				if (result == null)
				{
					return NotFound("Évaluation non trouvée.");
				}

				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur lors de la récupération des détails de l'évaluation : {ex.Message}");
			}
		}

		// Ajouter ces nouveaux endpoints

		[HttpGet("{evaluationId}/options")]
		public async Task<IActionResult> GetQuestionOptions(int evaluationId)
		{
			try
			{
				var groupedOptions = await _responseService.GetAllQuestionOptionsAsync(evaluationId);
				return Ok(groupedOptions);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("{evaluationId}/save-progress")]
		public async Task<IActionResult> SaveProgress(int evaluationId, [FromBody] EvaluationProgressDto progress)
		{
			try
			{
				await _responseService.SaveProgressAsync(evaluationId, progress);
				return Ok(new { message = "Progression sauvegardée" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("{evaluationId}/time-remaining")]
		public async Task<IActionResult> GetTimeRemaining(int evaluationId)
		{
			try
			{
				var timeRemaining = await _responseService.GetTimeRemainingAsync(evaluationId);
				return Ok(timeRemaining);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpPost("{evaluationId}/submit")]
		public async Task<IActionResult> SubmitEvaluation(int evaluationId, [FromBody] EvaluationSubmissionDto submission)
		{
			try
			{
				// Log des données reçues
				Console.WriteLine($"Reçu demande de soumission pour l'évaluation {evaluationId}");
				Console.WriteLine($"Nombre de réponses: {submission.Responses?.Count ?? 0}");
				Console.WriteLine($"Date de complétion: {submission.CompletionDate}");

				// Vérifier si les réponses sont nulles
				if (submission.Responses == null)
				{
					return BadRequest("Aucune réponse fournie");
				}

				// Déléguer toute la logique au service
				await _evaluationService.SubmitEvaluationAsync(evaluationId, submission);

				return Ok(new { success = true });
			}
			catch (Exception ex)
			{
				// Log l'erreur pour le débogage
				Console.WriteLine($"Erreur lors de la soumission de l'évaluation: {ex.Message}");
				return StatusCode(500, "Une erreur est survenue lors de la soumission de l'évaluation.");
			}
		}

		[HttpPost("{evaluationId}/process-responses")]
		public async Task<IActionResult> ProcessResponses(int evaluationId)
		{
			try
			{
				var result = await _responseService.ProcessResponsesAfterSubmission(evaluationId);
				if (!result)
				{
					return StatusCode(500, "Une erreur est survenue lors du traitement des réponses.");
				}
				return Ok(new { success = true, message = "Les réponses ont été traitées avec succès." });
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors du traitement des réponses: {ex.Message}");
				return StatusCode(500, "Une erreur est survenue lors du traitement des réponses.");
			}
		}

		[HttpGet("evaluation/{evaluationId}/selected-questions")]
		public async Task<IActionResult> GetSelectedQuestionsAndResponses(int evaluationId)
		{
			try
			{
				var result = await _evaluationService.GetSelectedQuestionsAndResponsesAsync(evaluationId);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Erreur interne du serveur: {ex.Message}");
			}
		}

		// API pour récupérer la liste des modèles d'évaluation (templates)
		[HttpGet("templates")]
		public async Task<IActionResult> GetEvaluationTemplates()
		{
			try
			{
				var templates = await _evaluationService.GetEvaluationTemplatesAsync();
				return Ok(templates);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// API pour récupérer les questions d'une évaluation spécifique
		[HttpGet("{evaluationTypeId}/questions")]
		public async Task<IActionResult> GetQuestionsByEvaluationType(int evaluationTypeId)
		{
			try
			{
				var result = await _evaluationService.GetQuestionsByEvaluationTypeAsync(evaluationTypeId);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		// API pour mettre à jour le temps par question
		[HttpPost("questions/update-time")]
		public async Task<IActionResult> UpdateQuestionsTime([FromBody] List<QuestionTimeUpdateDto> questions)
		{
			try
			{
				if (questions == null || !questions.Any())
				{
					return BadRequest("Aucune question à mettre à jour");
				}

				await _evaluationService.UpdateQuestionsTimeAsync(questions);
				return Ok(new { success = true, message = "Temps des questions mis à jour avec succès" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}

		[HttpGet("{evaluationTypeId}/questions/paginated")]
		public async Task<IActionResult> GetPaginatedEvaluationQuestionsByType(int evaluationTypeId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
		{
			try
			{
				var result = await _evaluationService.GetPaginatedEvaluationQuestionsByTypeAsync(evaluationTypeId, pageNumber, pageSize);
				return Ok(new
				{
					items = result.Items,
					totalPages = result.TotalPages,
					currentPage = pageNumber,
					pageSize = pageSize
				});
			}
			catch (Exception ex)
			{
				return BadRequest(ex.Message);
			}
		}

		[HttpGet("competence-lines")]
		public async Task<IActionResult> GetCompetenceLines()
		{
			try
			{
				var competenceLines = await _competenceLineService.GetAllAsync();

				if (competenceLines == null)
				{
					return Ok(new List<object>());
				}

				// Formater les données pour assurer une structure cohérente
				// Format PascalCase pour correspondre à ce qu'attend le frontend
				var formattedLines = competenceLines.Select(cl => new
				{
					CompetenceLineId = cl.CompetenceLineId,
					SkillPositionId = cl.SkillPositionId,
					Description = !string.IsNullOrEmpty(cl.Description) ? cl.Description : "Sans description",
					SkillName = cl.SkillPosition?.Skill?.Name ?? "Non défini",
					PositionName = cl.SkillPosition?.Position?.PositionName ?? "Non défini",
					PositionId = cl.SkillPosition?.Position?.PositionId ?? 0,
					SkillId = cl.SkillPosition?.Skill?.SkillId ?? 0,
					State = cl.State
				}).ToList();

				return Ok(formattedLines);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la récupération des lignes de compétence: {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				return StatusCode(500, new
				{
					error = ex.Message,
					details = "Erreur lors de la récupération des lignes de compétence",
					stackTrace = ex.StackTrace
				});
			}
		}

		[HttpGet("response-types")]
		public async Task<IActionResult> GetResponseTypes()
		{
			try
			{
				var responseTypes = await _responseTypeService.GetAllAsync();

				if (responseTypes == null)
				{
					return Ok(new List<object>());
				}

				// Formater les données pour assurer la cohérence
				// Format PascalCase pour correspondre à ce qu'attend le frontend
				var formattedResponseTypes = responseTypes.Select(rt => new
				{
					ResponseTypeId = rt.ResponseTypeId,
					TypeName = !string.IsNullOrEmpty(rt.TypeName) ? rt.TypeName : "Non défini",
					Description = !string.IsNullOrEmpty(rt.Description) ? rt.Description : "Sans description"
				}).ToList();

				return Ok(formattedResponseTypes);
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Erreur lors de la récupération des types de réponse: {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				return StatusCode(500, new
				{
					error = ex.Message,
					details = "Erreur lors de la récupération des types de réponse",
					stackTrace = ex.StackTrace
				});
			}
		}

		[HttpPost("import-training-suggestions")]
		[Authorize]
		public async Task<IActionResult> ImportTrainingSuggestions(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest("Aucun fichier fourni");

			if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
				return BadRequest("Seuls les fichiers CSV sont acceptés");

			try
			{
				var importResults = await _trainingSuggestionService.ImportFromCsvAsync(file);
				return Ok(new
				{
					imported = importResults.ImportedCount,
					errors = importResults.Errors
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { error = ex.Message });
			}
		}
	}
}
