using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Domain.Interfaces.Evaluations;
using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.Evaluations;

public class EvaluationQuestionServiceTests
{
    [Fact]
    public async Task CreateQuestionAsync_WithoutSkillId_ThrowsValidationException()
    {
        var harness = CreateHarness();

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            harness.Service.CreateQuestionAsync(new EvaluationQuestionDto
            {
                Question = "TEST-AGENT question",
                EvaluationTypeId = 1,
                SkillId = 0,
                ResponseTypeId = 1
            }));

        Assert.Contains("compétence", ex.Message, StringComparison.OrdinalIgnoreCase);
        harness.Questions.Verify(q => q.CreateAsync(It.IsAny<EvaluationQuestion>()), Times.Never);
    }

    [Fact]
    public async Task CreateQuestionAsync_WithArchivedSkill_ThrowsValidationException()
    {
        var harness = CreateHarness();
        harness.Data.Setup(d => d.GetSkillByIdAsync(7)).ReturnsAsync(new Skill
        {
            SkillId = 7,
            Name = "Java",
            State = SkillLifecycle.Archived
        });

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            harness.Service.CreateQuestionAsync(new EvaluationQuestionDto
            {
                Question = "TEST-AGENT question",
                EvaluationTypeId = 1,
                SkillId = 7,
                ResponseTypeId = 1
            }));

        Assert.Contains("archiv", ex.Message, StringComparison.OrdinalIgnoreCase);
        harness.Questions.Verify(q => q.CreateAsync(It.IsAny<EvaluationQuestion>()), Times.Never);
    }

    [Fact]
    public async Task CreateQuestionAsync_WithNullPosition_PersistsQuestionOnSkill()
    {
        var harness = CreateHarness();
        harness.Data.Setup(d => d.GetSkillByIdAsync(3)).ReturnsAsync(new Skill
        {
            SkillId = 3,
            Name = "Java",
            State = SkillLifecycle.Active
        });
        EvaluationQuestion? created = null;
        harness.Questions.Setup(q => q.CreateAsync(It.IsAny<EvaluationQuestion>()))
            .Callback<EvaluationQuestion>(question => created = question)
            .Returns(Task.CompletedTask);

        var result = await harness.Service.CreateQuestionAsync(new EvaluationQuestionDto
        {
            Question = "TEST-AGENT question sans poste",
            EvaluationTypeId = 1,
            SkillId = 3,
            PositionId = null,
            ResponseTypeId = 1,
            State = 1
        });

        Assert.NotNull(created);
        Assert.Equal(3, created!.SkillId);
        Assert.Null(created.positionId);
        Assert.Equal(3, result.SkillId);
        Assert.Null(result.PositionId);
    }

    [Fact]
    public async Task FindQuestionsAsync_ByDomainId_ForwardsFilterToRepository()
    {
        var harness = CreateHarness();
        EvaluationQuestionQuery? captured = null;
        harness.QuestionRepository
            .Setup(r => r.FindAsync(It.IsAny<EvaluationQuestionQuery>()))
            .Callback<EvaluationQuestionQuery>(query => captured = query)
            .ReturnsAsync(Array.Empty<EvaluationQuestion>());

        await harness.Service.FindQuestionsAsync(new EvaluationQuestionFilterDto(
            EvaluationTypeId: 1,
            PositionId: null,
            CompetenceLineId: null,
            DomainId: 12));

        Assert.NotNull(captured);
        Assert.Equal(12, captured!.DomainId);
        Assert.Equal(1, captured.EvaluationTypeId);
        Assert.Null(captured.PositionId);
    }

    [Fact]
    public async Task CreateQuestionAsync_QcmWithoutOptions_ThrowsValidationException()
    {
        var harness = CreateHarness();
        harness.Data.Setup(d => d.GetSkillByIdAsync(3)).ReturnsAsync(new Skill
        {
            SkillId = 3,
            Name = "Java",
            State = SkillLifecycle.Active
        });

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            harness.Service.CreateQuestionAsync(new EvaluationQuestionDto
            {
                Question = "TEST-AGENT QCM sans choix",
                EvaluationTypeId = 1,
                SkillId = 3,
                ResponseTypeId = 2,
                Options = []
            }));

        Assert.Contains("deux choix", ex.Message, StringComparison.OrdinalIgnoreCase);
        harness.Questions.Verify(q => q.CreateAsync(It.IsAny<EvaluationQuestion>()), Times.Never);
        harness.Data.Verify(
            d => d.ReplaceQuestionOptionsAsync(It.IsAny<int>(), It.IsAny<IReadOnlyList<EvaluationQuestionOptions>>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateQuestionAsync_QcmWithOptions_PersistsChoicesAndCorrectAnswers()
    {
        var harness = CreateHarness();
        harness.Data.Setup(d => d.GetSkillByIdAsync(3)).ReturnsAsync(new Skill
        {
            SkillId = 3,
            Name = "Java",
            State = SkillLifecycle.Active
        });
        IReadOnlyList<EvaluationQuestionOptions>? saved = null;
        harness.Data
            .Setup(d => d.ReplaceQuestionOptionsAsync(It.IsAny<int>(), It.IsAny<IReadOnlyList<EvaluationQuestionOptions>>()))
            .Callback<int, IReadOnlyList<EvaluationQuestionOptions>>((_, options) => saved = options)
            .Returns(Task.CompletedTask);
        harness.Questions
            .Setup(q => q.CreateAsync(It.IsAny<EvaluationQuestion>()))
            .Callback<EvaluationQuestion>(question => question.questionId = 88)
            .Returns(Task.CompletedTask);

        await harness.Service.CreateQuestionAsync(new EvaluationQuestionDto
        {
            Question = "TEST-AGENT QCM multi",
            EvaluationTypeId = 1,
            SkillId = 3,
            ResponseTypeId = 2,
            State = 1,
            Options =
            [
                new EvaluationQuestionOptionDto { OptionText = "Alpha", IsCorrect = true, SortOrder = 1 },
                new EvaluationQuestionOptionDto { OptionText = "Beta", IsCorrect = false, SortOrder = 2 },
                new EvaluationQuestionOptionDto { OptionText = "Gamma", IsCorrect = true, SortOrder = 3 }
            ]
        });

        Assert.NotNull(saved);
        Assert.Equal(3, saved!.Count);
        Assert.Equal(2, saved.Count(option => option.IsCorrect));
        Assert.Equal(new[] { "Alpha", "Beta", "Gamma" }, saved.Select(option => option.OptionText).ToArray());
        harness.Data.Verify(
            d => d.ReplaceQuestionOptionsAsync(88, It.IsAny<IReadOnlyList<EvaluationQuestionOptions>>()),
            Times.Once);
    }

    [Fact]
    public async Task GetQuestionOptionsAsync_ReturnsPersistedChoices()
    {
        var harness = CreateHarness();
        harness.Questions
            .Setup(q => q.GetByIdAsync(10))
            .ReturnsAsync(new EvaluationQuestion { questionId = 10, ResponseTypeId = 2 });
        harness.Data
            .Setup(d => d.GetActiveOptionsByQuestionIdAsync(10))
            .ReturnsAsync(
            [
                new EvaluationQuestionOptions
                {
                    OptionId = 1,
                    QuestionId = 10,
                    OptionText = "Alpha",
                    IsCorrect = true,
                    SortOrder = 1,
                    State = 1
                },
                new EvaluationQuestionOptions
                {
                    OptionId = 2,
                    QuestionId = 10,
                    OptionText = "Beta",
                    IsCorrect = false,
                    SortOrder = 2,
                    State = 1
                }
            ]);

        var options = await harness.Service.GetQuestionOptionsAsync(10);

        Assert.Equal(2, options.Count);
        Assert.True(options[0].IsCorrect);
        Assert.Equal("Alpha", options[0].OptionText);
    }

    private static Harness CreateHarness()
    {
        var questionRepository = new Mock<IEvaluationQuestionRepository>();
        var evaluationTypes = new Mock<IGenericRepository<EvaluationType>>();
        var questions = new Mock<IGenericRepository<EvaluationQuestion>>();
        var evaluations = new Mock<IGenericRepository<Evaluation>>();
        var questionnaires = new Mock<IGenericRepository<EvaluationQuestionnaire>>();
        var trainings = new Mock<IGenericRepository<TrainingSuggestion>>();
        var users = new Mock<IGenericRepository<User>>();
        var positions = new Mock<IGenericRepository<Position>>();
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.DeactivateQuestionOptionsAsync(It.IsAny<int>())).Returns(Task.CompletedTask);
        data.Setup(d => d.ReplaceQuestionOptionsAsync(
                It.IsAny<int>(),
                It.IsAny<IReadOnlyList<EvaluationQuestionOptions>>()))
            .Returns(Task.CompletedTask);
        data.Setup(d => d.GetActiveOptionsByQuestionIdAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<EvaluationQuestionOptions>());
        var email = new Mock<IEmailService>();
        var notifications = new Mock<INotificationService>();
        var competenceLines = new Mock<ICompetenceLineService>();
        var temporaryAccounts = new Mock<IGenericRepository<TemporaryAccount>>();
        var employees = new Mock<IGenericRepository<Employee>>();
        var loginAttempts = new Mock<IGenericRepository<LoginAttempt>>();

        var temporaryAccountService = new TemporaryAccountService(
            temporaryAccounts.Object,
            employees.Object,
            evaluations.Object,
            loginAttempts.Object,
            email.Object);

        var configuration = new ConfigurationBuilder().Build();

        var service = new EvaluationService(
            questionRepository.Object,
            evaluationTypes.Object,
            questions.Object,
            evaluations.Object,
            questionnaires.Object,
            trainings.Object,
            users.Object,
            email.Object,
            Options.Create(new ReminderSettings()),
            positions.Object,
            data.Object,
            temporaryAccountService,
            configuration,
            notifications.Object,
            competenceService: null,
            competenceLineService: competenceLines.Object);

        return new Harness(service, questionRepository, questions, data);
    }

    private sealed record Harness(
        EvaluationService Service,
        Mock<IEvaluationQuestionRepository> QuestionRepository,
        Mock<IGenericRepository<EvaluationQuestion>> Questions,
        Mock<IEvaluationDataService> Data);
}
