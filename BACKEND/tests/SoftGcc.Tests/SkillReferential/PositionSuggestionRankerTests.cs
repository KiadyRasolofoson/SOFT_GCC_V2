using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class PositionSuggestionRankerTests
{
    private static PositionRequirementRow Row(
        int positionId,
        string positionName,
        int skillId,
        int expectedRank,
        string kind = RequirementKind.Required) =>
        new(positionId, positionName, skillId, expectedRank, kind);

    [Fact]
    public void Rank_WithoutAcquiredSkills_ReturnsEmpty()
    {
        var suggestions = PositionSuggestionRanker.Rank(
            [Row(1, "Développeur Front-end", 1, 2)],
            new Dictionary<int, int>());

        Assert.Empty(suggestions);
    }

    [Fact]
    public void Rank_IgnoresPositionsMatchedOnlyByDesiredSkills()
    {
        var suggestions = PositionSuggestionRanker.Rank(
            [Row(1, "Data Scientist", 1, 2, RequirementKind.Desired)],
            new Dictionary<int, int> { [1] = 4 });

        Assert.Empty(suggestions);
    }

    [Fact]
    public void Rank_KeepsPositionsWhoseCriticalSkillsAreMostlyMet()
    {
        PositionRequirementRow[] requirements =
        [
            // Critiques 2/2 : retenu même si les compétences comportementales manquent.
            Row(1, "Développeur Front-end", 1, 3, RequirementKind.Critical),
            Row(1, "Développeur Front-end", 2, 3, RequirementKind.Critical),
            Row(1, "Développeur Front-end", 7, 2),
            Row(1, "Développeur Front-end", 8, 2),
            // Critiques 1/3 : écarté malgré une exigence requise satisfaite.
            Row(2, "Data Scientist", 1, 3, RequirementKind.Critical),
            Row(2, "Data Scientist", 3, 3, RequirementKind.Critical),
            Row(2, "Data Scientist", 4, 3, RequirementKind.Critical),
            Row(2, "Data Scientist", 2, 2)
        ];

        var suggestions = PositionSuggestionRanker.Rank(
            requirements,
            new Dictionary<int, int> { [1] = 4, [2] = 3 });

        Assert.Single(suggestions);
        Assert.Equal(1, suggestions[0].PositionId);
        Assert.Equal(2, suggestions[0].CriticalMetCount);
        Assert.Equal(2, suggestions[0].CriticalCount);
        Assert.Equal(1, suggestions[0].CriticalCoverage);
        Assert.Equal(0.5, suggestions[0].Coverage);
    }

    [Fact]
    public void Rank_WithoutCriticalRequirement_FallsBackOnGlobalCoverage()
    {
        PositionRequirementRow[] requirements =
        [
            // 1 exigence sur 2 satisfaite : sous le seuil, aucun critique pour trancher.
            Row(1, "Chargé de mission", 1, 2),
            Row(1, "Chargé de mission", 5, 3),
            // 2 exigences sur 2 satisfaites.
            Row(2, "Intégrateur Web", 1, 2),
            Row(2, "Intégrateur Web", 2, 2)
        ];

        var suggestions = PositionSuggestionRanker.Rank(
            requirements,
            new Dictionary<int, int> { [1] = 3, [2] = 2 });

        Assert.Single(suggestions);
        Assert.Equal(2, suggestions[0].PositionId);
    }

    [Fact]
    public void Rank_OrdersByCriticalCoverageThenByGlobalCoverage()
    {
        PositionRequirementRow[] requirements =
        [
            // Critiques 1/1, couverture globale 1/2.
            Row(1, "Intégrateur Web", 1, 2, RequirementKind.Critical),
            Row(1, "Intégrateur Web", 7, 2),
            // Critiques 1/1, couverture globale 2/2 : passe devant.
            Row(2, "Développeur Full-stack", 1, 2, RequirementKind.Critical),
            Row(2, "Développeur Full-stack", 2, 2),
            // Critiques 1/2 : sous le seuil.
            Row(3, "Architecte logiciel", 1, 2, RequirementKind.Critical),
            Row(3, "Architecte logiciel", 9, 4, RequirementKind.Critical)
        ];

        var suggestions = PositionSuggestionRanker.Rank(
            requirements,
            new Dictionary<int, int> { [1] = 2, [2] = 3 });

        Assert.Equal(new List<int> { 2, 1 }, suggestions.Select(item => item.PositionId).ToList());
    }

    [Fact]
    public void Rank_AppliesLimitAndExcludesCurrentPosition()
    {
        PositionRequirementRow[] requirements =
        [
            Row(1, "Poste actuel", 1, 2),
            Row(2, "Autre poste", 1, 2)
        ];

        var suggestions = PositionSuggestionRanker.Rank(
            requirements,
            new Dictionary<int, int> { [1] = 4 },
            limit: 5,
            excludePositionId: 1);

        Assert.Single(suggestions);
        Assert.Equal(2, suggestions[0].PositionId);
    }
}
