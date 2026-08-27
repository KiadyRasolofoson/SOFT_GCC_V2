using System.Text.Json;

namespace SoftGcc.Application.Services.Evaluations;

/// <summary>
/// Correction d'un QCM à plusieurs bonnes réponses : la réponse est juste
/// seulement si l'ensemble coché est exactement l'ensemble des bonnes options.
/// </summary>
public static class QcmAnswerScoring
{
    public const int QcmResponseTypeId = 2;

    public static IReadOnlyList<int> ParseSelectedOptionIds(string? responseValue)
    {
        if (string.IsNullOrWhiteSpace(responseValue))
        {
            return [];
        }

        var raw = responseValue.Trim();
        if (raw.StartsWith('['))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<JsonElement>>(raw) ?? [];
                return parsed
                    .Select(ReadJsonInt)
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();
            }
            catch (JsonException)
            {
                return [];
            }
        }

        return raw
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(part => int.TryParse(part, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();
    }

    public static bool IsExactMatch(IEnumerable<int> selectedOptionIds, IEnumerable<int> correctOptionIds)
    {
        var selected = Normalize(selectedOptionIds);
        var correct = Normalize(correctOptionIds);
        return correct.Count > 0 && selected.Count > 0 && selected.SequenceEqual(correct);
    }

    public static void ValidateOptions(IReadOnlyList<EvaluationQuestionOptionDraft> options)
    {
        if (options.Count < 2)
        {
            throw new SoftGcc.Domain.Exceptions.ValidationException(
                "Un QCM doit proposer au moins deux choix de réponse.");
        }

        if (options.Any(option => string.IsNullOrWhiteSpace(option.OptionText)))
        {
            throw new SoftGcc.Domain.Exceptions.ValidationException(
                "Chaque choix de QCM doit avoir un libellé.");
        }

        if (!options.Any(option => option.IsCorrect))
        {
            throw new SoftGcc.Domain.Exceptions.ValidationException(
                "Un QCM doit indiquer au moins une bonne réponse.");
        }
    }

    private static List<int> Normalize(IEnumerable<int> ids) =>
        ids.Where(id => id > 0).Distinct().OrderBy(id => id).ToList();

    private static int ReadJsonInt(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var number))
        {
            return number;
        }

        if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var parsed))
        {
            return parsed;
        }

        return 0;
    }
}

public readonly record struct EvaluationQuestionOptionDraft(string OptionText, bool IsCorrect);
