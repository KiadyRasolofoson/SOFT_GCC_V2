using SoftGcc.Application.SkillReferential.Dtos;

namespace SoftGcc.Application.Positions.Dtos;

/// <summary>
/// Détail d'un poste enrichi de sa matrice emploi-compétences.
/// La matrice est lue depuis la table <c>Skill_position</c> (source unique,
/// <see cref="PositionSkillItemDto"/>) : aucune table dédiée n'est créée.
/// Ce contrat est consommé par le module d'évaluation (personne B) pour
/// obtenir les niveaux attendus 1-4, la criticité et le poids par compétence.
/// </summary>
public sealed class PositionDetailDto
{
    public int PositionId { get; set; }

    public string? PositionName { get; set; }

    public int? DepartmentId { get; set; }

    /// <summary>Libellé du département (résolu depuis <c>Department</c>).</summary>
    public string? DepartmentName { get; set; }

    public int? ProfessionalCategoryId { get; set; }

    public int? LegalClassId { get; set; }

    /// <summary>Matrice du poste : compétences requises, niveau attendu 1-4, criticité, poids.</summary>
    public List<PositionSkillItemDto> Skills { get; set; } = [];
}
