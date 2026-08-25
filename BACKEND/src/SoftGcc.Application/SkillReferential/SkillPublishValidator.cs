using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.SkillReferential;

public static class SkillPublishValidator
{
    public const string PlaceholderDefinition = "À compléter";

    public static void EnsureCanPublish(
        string? definition,
        string? name,
        IReadOnlyCollection<(int Rank, string? BehavioralDefinition)> descriptors,
        bool nameTakenByOtherActive)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException("Le nom est obligatoire pour publier.");
        }

        if (string.IsNullOrWhiteSpace(definition)
            || string.Equals(definition.Trim(), PlaceholderDefinition, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("La définition métier est obligatoire pour publier.");
        }

        if (nameTakenByOtherActive)
        {
            throw new ConflictException("Une compétence active porte déjà ce nom.");
        }

        var ranks = descriptors
            .Select(item => item.Rank)
            .Distinct()
            .OrderBy(rank => rank)
            .ToArray();

        if (ranks.Length != 4 || !ranks.SequenceEqual(CompetencyScale.Ranks))
        {
            throw new ValidationException("Les 4 descripteurs de niveaux (1 à 4) sont requis pour publier.");
        }

        foreach (var descriptor in descriptors)
        {
            if (string.IsNullOrWhiteSpace(descriptor.BehavioralDefinition))
            {
                throw new ValidationException(
                    $"La définition comportementale du niveau {descriptor.Rank} est obligatoire.");
            }
        }
    }
}
