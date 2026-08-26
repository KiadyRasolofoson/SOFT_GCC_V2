using Moq;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class EvaluationCompetenceServiceTests
{
    [Fact]
    public async Task CalculateAndSaveCompetenceResultsAsync_WritesDistinctRanks_NotOverallScore()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var data = CreateDataMock(writes, new EvaluationFixture());

        var service = new EvaluationCompetenceService(data.Object);
        var ok = await service.CalculateAndSaveCompetenceResultsAsync(
            EvaluationFixture.EvaluationId,
            new Dictionary<int, int>
            {
                [EvaluationFixture.CompetenceA] = 2,
                [EvaluationFixture.CompetenceB] = 4
            });

        Assert.True(ok);

        var competenceWrites = writes
            .Where(w => w.Sql.Contains("Evaluation_Competence_Results", StringComparison.OrdinalIgnoreCase))
            .ToList();
        Assert.Equal(2, competenceWrites.Count);

        var scores = competenceWrites
            .Select(w => Convert.ToInt32(ExtractCompetenceScore(w)))
            .OrderBy(v => v)
            .ToList();
        Assert.Equal([2, 4], scores);

        Assert.DoesNotContain(
            writes,
            w => w.Args.Any(arg => arg is decimal decimalScore && decimalScore == EvaluationFixture.OverallScore));
        Assert.DoesNotContain(
            writes,
            w => w.Sql.Contains("OverallScore", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CalculateAndSaveCompetenceResultsAsync_WithoutRatings_DoesNotCopyOverallScore()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var data = CreateDataMock(writes, new EvaluationFixture());

        var service = new EvaluationCompetenceService(data.Object);
        await service.CalculateAndSaveCompetenceResultsAsync(EvaluationFixture.EvaluationId);

        Assert.DoesNotContain(
            writes,
            w => w.Sql.Contains("Evaluation_Competence_Results", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(
            writes,
            w => w.Args.Any(arg => arg is decimal decimalScore && decimalScore == EvaluationFixture.OverallScore));
    }

    [Fact]
    public async Task CalculateAndSaveCompetenceResultsAsync_InvalidRank_ThrowsAndDoesNotWrite()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var data = CreateDataMock(writes, new EvaluationFixture());
        var service = new EvaluationCompetenceService(data.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            service.CalculateAndSaveCompetenceResultsAsync(
                EvaluationFixture.EvaluationId,
                new Dictionary<int, int> { [EvaluationFixture.CompetenceA] = 5 }));

        Assert.Contains("1 à 4", ex.Message);
        Assert.Empty(writes);
    }

    [Fact]
    public async Task UpdateEmployeeSkillsAfterEvaluation_WritesAcquiredLevelPerSkill_NotPercent()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var fixture = new EvaluationFixture
        {
            ExistingCompetenceResults =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("Score", 2m),
                    ("Skill_version_id", DBNull.Value)),
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceB),
                    ("Score", 4m),
                    ("Skill_version_id", 9))
            ],
            SkillLinks =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("SkillPositionId", 11),
                    ("Skill_id", EvaluationFixture.SkillA),
                    ("Domain_skill_id", 50),
                    ("Skill_version_id", 8)),
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceB),
                    ("SkillPositionId", 12),
                    ("Skill_id", EvaluationFixture.SkillB),
                    ("Domain_skill_id", 50),
                    ("Skill_version_id", 9))
            ]
        };
        var data = CreateDataMock(writes, fixture);
        var service = new EvaluationCompetenceService(data.Object);

        await service.UpdateEmployeeSkillsAfterEvaluation(EvaluationFixture.EvaluationId);

        var skillWrites = writes
            .Where(w => w.Sql.Contains("Employee_skill", StringComparison.OrdinalIgnoreCase))
            .ToList();
        Assert.Equal(2, skillWrites.Count);
        Assert.All(skillWrites, w =>
        {
            Assert.DoesNotContain("* 20", w.Sql);
            Assert.DoesNotContain("Level = @p0", w.Sql);
            Assert.Contains("Acquired_level", w.Sql, StringComparison.OrdinalIgnoreCase);
            Assert.Contains(EmployeeSkillSource.Evaluation, w.Args.Select(a => a?.ToString()));
        });

        var acquired = skillWrites.Select(ExtractAcquiredLevel).OrderBy(v => v).ToList();
        Assert.Equal([2, 4], acquired);
    }

    [Fact]
    public async Task UpdateEmployeeSkillsAfterEvaluation_DoesNotWritePercentOnEmployeeSkill()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var data = CreateDataMock(writes, new EvaluationFixture
        {
            ExistingCompetenceResults =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("Score", 3m),
                    ("Skill_version_id", DBNull.Value))
            ],
            SkillLinks =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("SkillPositionId", 11),
                    ("Skill_id", EvaluationFixture.SkillA),
                    ("Domain_skill_id", 50),
                    ("Skill_version_id", 8))
            ]
        });
        var service = new EvaluationCompetenceService(data.Object);

        await service.UpdateEmployeeSkillsAfterEvaluation(EvaluationFixture.EvaluationId);

        Assert.Contains(writes, w => w.Sql.Contains("Employee_skill", StringComparison.OrdinalIgnoreCase));
        Assert.All(writes, w =>
        {
            Assert.DoesNotContain("* 20", w.Sql);
            Assert.DoesNotContain("Level = @p0", w.Sql);
        });
        Assert.DoesNotContain(
            writes,
            w => w.Args.Any(arg => arg is int percent && percent == 60)
                 && w.Sql.Contains("Level", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task UpdateEmployeeSkillsAfterEvaluation_MissingSkillPosition_DoesNotThrowOrWriteEmployeeSkill()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var data = CreateDataMock(writes, new EvaluationFixture
        {
            ExistingCompetenceResults =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("Score", 2m),
                    ("Skill_version_id", DBNull.Value))
            ],
            SkillLinks =
            [
                Row(
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("SkillPositionId", DBNull.Value),
                    ("Skill_id", DBNull.Value),
                    ("Domain_skill_id", DBNull.Value),
                    ("Skill_version_id", DBNull.Value))
            ]
        });
        var service = new EvaluationCompetenceService(data.Object);

        var exception = await Record.ExceptionAsync(() =>
            service.UpdateEmployeeSkillsAfterEvaluation(EvaluationFixture.EvaluationId));

        Assert.Null(exception);
        Assert.DoesNotContain(
            writes,
            w => w.Sql.Contains("Employee_skill", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void SourceDoesNotContainLegacyPercentMultiplier()
    {
        var copied = Path.Combine(AppContext.BaseDirectory, "Fixtures", "EvaluationCompetenceService.cs");
        var fromBin = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SoftGcc.Application", "Services", "Evaluations", "EvaluationCompetenceService.cs"));
        var path = File.Exists(copied) ? copied : fromBin;
        var source = File.ReadAllText(path);
        Assert.DoesNotContain("* 20", source);
        Assert.DoesNotContain("Level = @p0", source);
        Assert.DoesNotContain("overallScore *", source);
    }

    [Fact]
    public async Task GetEvaluationCompetenceResultsAsync_RankIsAcquiredLevel_OverallScoreIsNot()
    {
        var writes = new List<(string Sql, object[] Args)>();
        var fixture = new EvaluationFixture
        {
            ExistingCompetenceResults =
            [
                Row(
                    ("ResultId", 1),
                    ("EvaluationId", EvaluationFixture.EvaluationId),
                    ("EmployeeId", EvaluationFixture.EmployeeId),
                    ("CompetenceLineId", EvaluationFixture.CompetenceA),
                    ("Score", 3m)),
                Row(
                    ("ResultId", 2),
                    ("EvaluationId", EvaluationFixture.EvaluationId),
                    ("EmployeeId", EvaluationFixture.EmployeeId),
                    ("CompetenceLineId", EvaluationFixture.CompetenceB),
                    ("Score", EvaluationFixture.OverallScore))
            ]
        };
        var service = new EvaluationCompetenceService(CreateDataMock(writes, fixture).Object);

        var results = await service.GetEvaluationCompetenceResultsAsync(EvaluationFixture.EvaluationId);

        var mastery = Assert.Single(results, r => r.CompetenceId == EvaluationFixture.CompetenceA);
        Assert.Equal(3m, mastery.Score);
        Assert.Equal(3, mastery.AcquiredLevel);
        Assert.Equal("Maîtrise", mastery.AcquiredLevelLabel);
        Assert.DoesNotContain("/ 5", mastery.AcquiredLevelLabel);

        var campaignLeak = Assert.Single(results, r => r.CompetenceId == EvaluationFixture.CompetenceB);
        Assert.Equal(EvaluationFixture.OverallScore, campaignLeak.Score);
        Assert.Null(campaignLeak.AcquiredLevel);
        Assert.Null(campaignLeak.AcquiredLevelLabel);

        Assert.Equal(3, CompetencyScale.RankFromStoredScore(3m));
        Assert.Null(CompetencyScale.RankFromStoredScore(EvaluationFixture.OverallScore));
    }

    private static Mock<IEvaluationDataService> CreateDataMock(
        List<(string Sql, object[] Args)> writes,
        EvaluationFixture fixture)
    {
        var data = new Mock<IEvaluationDataService>(MockBehavior.Loose);
        data.Setup(d => d.GetEvaluationWithUserAsync(EvaluationFixture.EvaluationId))
            .ReturnsAsync(new Evaluation
            {
                EvaluationId = EvaluationFixture.EvaluationId,
                EmployeeId = EvaluationFixture.EmployeeId,
                OverallScore = EvaluationFixture.OverallScore
            });

        data.Setup(d => d.ExecuteReaderAsync(It.IsAny<string>(), It.IsAny<object[]>()))
            .Returns((string sql, object[] _) => Task.FromResult(fixture.Reader(sql)));

        data.Setup(d => d.ExecuteNonQueryAsync(It.IsAny<string>(), It.IsAny<object[]>()))
            .Returns((string sql, object[] args) =>
            {
                writes.Add((sql, args));
                return Task.FromResult(1);
            });

        return data;
    }

    private static object ExtractCompetenceScore((string Sql, object[] Args) write)
    {
        if (write.Sql.Contains("INSERT", StringComparison.OrdinalIgnoreCase))
        {
            return write.Args[3];
        }

        return write.Args[0];
    }

    private static int ExtractAcquiredLevel((string Sql, object[] Args) write)
    {
        if (write.Sql.Contains("INSERT", StringComparison.OrdinalIgnoreCase))
        {
            return Convert.ToInt32(write.Args[2]);
        }

        return Convert.ToInt32(write.Args[0]);
    }

    private static Dictionary<string, object> Row(params (string Key, object Value)[] pairs)
    {
        var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in pairs)
        {
            row[key] = value;
        }

        return row;
    }

    private sealed class EvaluationFixture
    {
        public const int EvaluationId = 42;
        public const int EmployeeId = 7;
        public const int CompetenceA = 101;
        public const int CompetenceB = 202;
        public const int SkillA = 1001;
        public const int SkillB = 1002;
        public const decimal OverallScore = 4.2m;

        public List<Dictionary<string, object>> ExistingCompetenceResults { get; init; } = [];
        public List<Dictionary<string, object>> SkillLinks { get; init; } =
        [
            Row(
                ("CompetenceLineId", CompetenceA),
                ("SkillPositionId", DBNull.Value),
                ("Skill_id", DBNull.Value),
                ("Domain_skill_id", DBNull.Value),
                ("Skill_version_id", DBNull.Value)),
            Row(
                ("CompetenceLineId", CompetenceB),
                ("SkillPositionId", DBNull.Value),
                ("Skill_id", DBNull.Value),
                ("Domain_skill_id", DBNull.Value),
                ("Skill_version_id", DBNull.Value))
        ];

        public List<Dictionary<string, object>> Reader(string sql)
        {
            if (sql.Contains("Evaluation_Selected_Questions", StringComparison.OrdinalIgnoreCase))
            {
                return
                [
                    Row(
                        ("SelectedQuestionId", 1),
                        ("EvaluationId", EvaluationId),
                        ("QuestionId", 11),
                        ("CompetenceLineId", CompetenceA)),
                    Row(
                        ("SelectedQuestionId", 2),
                        ("EvaluationId", EvaluationId),
                        ("QuestionId", 12),
                        ("CompetenceLineId", CompetenceB))
                ];
            }

            if (sql.Contains("Evaluation_Competence_Results", StringComparison.OrdinalIgnoreCase))
            {
                return ExistingCompetenceResults.Select(Clone).ToList();
            }

            if (sql.Contains("Competence_Lines", StringComparison.OrdinalIgnoreCase))
            {
                return SkillLinks.Select(Clone).ToList();
            }

            if (sql.Contains("Employee_skill", StringComparison.OrdinalIgnoreCase))
            {
                return [];
            }

            return [];
        }

        private static Dictionary<string, object> Clone(Dictionary<string, object> row)
            => new(row, StringComparer.OrdinalIgnoreCase);
    }
}
