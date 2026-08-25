using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Exceptions;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class SkillPublishValidatorTests
{
    private static readonly (int Rank, string? BehavioralDefinition)[] CompleteDescriptors =
    [
        (1, "Observe et reproduit avec aide."),
        (2, "Applique en situation réelle avec supervision."),
        (3, "Produit de façon autonome."),
        (4, "Référent, forme et arbitre.")
    ];

    [Fact]
    public void EnsureCanPublish_WhenComplete_DoesNotThrow()
    {
        SkillPublishValidator.EnsureCanPublish(
            "S'exprimer clairement à l'oral en réunion.",
            "Communication orale",
            CompleteDescriptors,
            nameTakenByOtherActive: false);
    }

    [Fact]
    public void EnsureCanPublish_WhenMissingDescriptors_Throws()
    {
        var ex = Assert.Throws<ValidationException>(() =>
            SkillPublishValidator.EnsureCanPublish(
                "Définition métier.",
                "Communication orale",
                [(1, "A"), (2, "B"), (3, "C")],
                false));

        Assert.Contains("4 descripteurs", ex.Message);
    }

    [Fact]
    public void EnsureCanPublish_WhenPlaceholderDefinition_Throws()
    {
        Assert.Throws<ValidationException>(() =>
            SkillPublishValidator.EnsureCanPublish(
                "À compléter",
                "Communication orale",
                CompleteDescriptors,
                false));
    }

    [Fact]
    public void EnsureCanPublish_WhenActiveNameTaken_ThrowsConflict()
    {
        Assert.Throws<ConflictException>(() =>
            SkillPublishValidator.EnsureCanPublish(
                "Définition métier.",
                "Communication orale",
                CompleteDescriptors,
                nameTakenByOtherActive: true));
    }

    [Fact]
    public void EnsureCanPublish_WhenEmptyBehavioralDefinition_Throws()
    {
        Assert.Throws<ValidationException>(() =>
            SkillPublishValidator.EnsureCanPublish(
                "Définition métier.",
                "Communication orale",
                [(1, "A"), (2, "B"), (3, "C"), (4, " ")],
                false));
    }
}
