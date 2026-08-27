using System.Text.Json;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Exceptions;
using Xunit;

namespace SoftGcc.Tests.Evaluations;

public class QcmAnswerScoringTests
{
    [Fact]
    public void ParseSelectedOptionIds_JsonArray_ReturnsDistinctIds()
    {
        Assert.Equal(new[] { 12, 15 }, QcmAnswerScoring.ParseSelectedOptionIds("[12,15]"));
        Assert.Equal(new[] { 15, 12 }, QcmAnswerScoring.ParseSelectedOptionIds("[15,12,15]"));
    }

    [Fact]
    public void ParseSelectedOptionIds_SingleIdAndCommaList_RemainCompatible()
    {
        Assert.Equal(new[] { 12 }, QcmAnswerScoring.ParseSelectedOptionIds("12"));
        Assert.Equal(new[] { 12, 15 }, QcmAnswerScoring.ParseSelectedOptionIds("12,15"));
    }

    [Fact]
    public void ParseSelectedOptionIds_EmptyValues_ReturnNothing()
    {
        Assert.Empty(QcmAnswerScoring.ParseSelectedOptionIds("[]"));
        Assert.Empty(QcmAnswerScoring.ParseSelectedOptionIds(""));
        Assert.Empty(QcmAnswerScoring.ParseSelectedOptionIds(null));
    }

    [Fact]
    public void IsExactMatch_SelectedEqualsCorrect_IsTrueRegardlessOfOrder()
    {
        Assert.True(QcmAnswerScoring.IsExactMatch([15, 12], [12, 15]));
    }

    [Fact]
    public void IsExactMatch_TooFewSelections_IsFalse()
    {
        Assert.False(QcmAnswerScoring.IsExactMatch([12], [12, 15]));
    }

    [Fact]
    public void PerformanceScore_CorrectAnswerCountsAsFive()
    {
        Assert.Equal(5, QcmAnswerScoring.PerformanceScore(true));
        Assert.Equal(0, QcmAnswerScoring.PerformanceScore(false));
    }

    [Fact]
    public void IsExactMatch_TooManySelections_IsFalse()
    {
        Assert.False(QcmAnswerScoring.IsExactMatch([12, 15, 16], [12, 15]));
    }

    [Fact]
    public void ValidateOptions_RequiresTwoChoicesOneCorrectAndNoEmptyLabel()
    {
        var tooFew = Assert.Throws<ValidationException>(() =>
            QcmAnswerScoring.ValidateOptions([new EvaluationQuestionOptionDraft("A", true)]));
        Assert.Contains("deux choix", tooFew.Message, StringComparison.OrdinalIgnoreCase);

        var emptyLabel = Assert.Throws<ValidationException>(() =>
            QcmAnswerScoring.ValidateOptions([
                new EvaluationQuestionOptionDraft("A", true),
                new EvaluationQuestionOptionDraft("  ", false)
            ]));
        Assert.Contains("libellé", emptyLabel.Message, StringComparison.OrdinalIgnoreCase);

        var noCorrect = Assert.Throws<ValidationException>(() =>
            QcmAnswerScoring.ValidateOptions([
                new EvaluationQuestionOptionDraft("A", false),
                new EvaluationQuestionOptionDraft("B", false)
            ]));
        Assert.Contains("bonne réponse", noCorrect.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PortalQuestionOptionDto_DoesNotExposeIsCorrect()
    {
        var names = typeof(PortalQuestionOptionDto).GetProperties().Select(property => property.Name);
        Assert.DoesNotContain("IsCorrect", names);

        var json = JsonSerializer.Serialize(new PortalQuestionOptionDto(12, 4, "Alpha"));
        Assert.DoesNotContain("isCorrect", json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("OptionText", json, StringComparison.OrdinalIgnoreCase);
    }
}
