using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Une question d'évaluation appartient désormais à une compétence du référentiel
    /// (Skill → Skill_family → Domain_skill) et non plus à un poste.
    /// positionId reste présent mais devient un filtre facultatif (nullable).
    /// </summary>
    [Migration("20260826230000_AddSkillToEvaluationQuestions")]
    public partial class AddSkillToEvaluationQuestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.Evaluation_questions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Evaluation_questions', N'SkillId') IS NULL
BEGIN
    ALTER TABLE dbo.Evaluation_questions ADD SkillId INT NULL;
END
");

            // Backfill : la compétence est déduite de la ligne de questionnaire existante
            // (Competence_Lines → Skill_position → Skill). Les questions sans ligne de
            // compétence restent à NULL : l'utilisateur devra choisir une compétence au
            // prochain enregistrement.
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.Evaluation_questions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Competence_Lines', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Skill_position', N'U') IS NOT NULL
BEGIN
    UPDATE eq
    SET eq.SkillId = sp.Skill_id
    FROM dbo.Evaluation_questions eq
    JOIN dbo.Competence_Lines cl ON cl.CompetenceLineId = eq.CompetenceLineId
    JOIN dbo.Skill_position sp   ON sp.Skill_position_id = cl.SkillPositionId
    WHERE eq.SkillId IS NULL;
END
");

            // positionId : NOT NULL → NULL. SQL Server refuse ALTER COLUMN tant qu'une
            // contrainte de clé étrangère porte sur la colonne ; la FK de
            // 01_TABLES_EVALUATIONS.sql est anonyme, on la retrouve par colonne.
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.Evaluation_questions', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Evaluation_questions')
          AND name = N'positionId' AND is_nullable = 0)
BEGIN
    DECLARE @fkPosition nvarchar(128);
    SELECT @fkPosition = fk.name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.columns c
        ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE fk.parent_object_id = OBJECT_ID(N'dbo.Evaluation_questions')
      AND c.name = N'positionId';

    IF @fkPosition IS NOT NULL
    BEGIN
        DECLARE @dropFkSql nvarchar(400) =
            N'ALTER TABLE dbo.Evaluation_questions DROP CONSTRAINT ' + QUOTENAME(@fkPosition);
        EXEC(@dropFkSql);
    END

    DECLARE @dropIndexName nvarchar(128);
    SELECT @dropIndexName = i.name
    FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.Evaluation_questions')
      AND c.name = N'positionId'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;

    IF @dropIndexName IS NOT NULL
    BEGIN
        DECLARE @dropIndexSql nvarchar(400) =
            N'DROP INDEX ' + QUOTENAME(@dropIndexName) + N' ON dbo.Evaluation_questions';
        EXEC(@dropIndexSql);
    END

    ALTER TABLE dbo.Evaluation_questions ALTER COLUMN positionId INT NULL;

    ALTER TABLE dbo.Evaluation_questions ADD CONSTRAINT FK_Evaluation_questions_Position
        FOREIGN KEY (positionId) REFERENCES dbo.Position(Position_id);
END
");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.Evaluation_questions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Evaluation_questions', N'SkillId') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = N'FK_Evaluation_questions_Skill'
          AND parent_object_id = OBJECT_ID(N'dbo.Evaluation_questions'))
    BEGIN
        ALTER TABLE dbo.Evaluation_questions ADD CONSTRAINT FK_Evaluation_questions_Skill
            FOREIGN KEY (SkillId) REFERENCES dbo.Skill(Skill_id);
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_Evaluation_questions_SkillId'
          AND object_id = OBJECT_ID(N'dbo.Evaluation_questions'))
    BEGIN
        CREATE INDEX IX_Evaluation_questions_SkillId ON dbo.Evaluation_questions(SkillId);
    END
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Evaluation_questions_SkillId'
      AND object_id = OBJECT_ID(N'dbo.Evaluation_questions'))
    DROP INDEX IX_Evaluation_questions_SkillId ON dbo.Evaluation_questions;

IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Evaluation_questions_Skill'
      AND parent_object_id = OBJECT_ID(N'dbo.Evaluation_questions'))
    ALTER TABLE dbo.Evaluation_questions DROP CONSTRAINT FK_Evaluation_questions_Skill;

IF COL_LENGTH(N'dbo.Evaluation_questions', N'SkillId') IS NOT NULL
    ALTER TABLE dbo.Evaluation_questions DROP COLUMN SkillId;
");
        }
    }
}
