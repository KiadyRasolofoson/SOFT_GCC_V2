-- ====================================================
-- 12_ALIGN_COMPETENCE_LINES_SKILL_POSITION.sql
-- A1.3 — Aligner Competence_Lines sur Skill_position (matrice).
--
-- Règle : « Une compétence de poste notée = une ligne de la matrice. »
-- Chaque ligne de questionnaire doit référencer une ligne ACTIVE de Skill_position.
--
-- Idempotent : ré-exécutable sans danger.
-- À exécuter une fois sur la base existante (Soft_GCC), en plus du schéma corrigé
-- de 01_TABLES_EVALUATIONS.sql pour les installations neuves.
-- ====================================================
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.Competence_Lines', N'U') IS NULL
BEGIN
    PRINT 'Competence_Lines absente — rien à faire.';
END
ELSE
BEGIN
    -- 1) Backfill : les lignes legacy (SkillPositionId NULL) sont rattachées à la matrice
    --    en retrouvant le couple (Position_id, nom de compétence) dans Skill_position/Skill.
    --    NB : en SQL dynamique — SQL Server valide les noms de colonnes des DML au moment de la
    --    compilation du batch, même dans une branche IF fausse (Msg 207 si les colonnes legacy
    --    ont déjà été supprimées). Le SQL dynamique ne référence les colonnes que si elles existent.
    IF COL_LENGTH(N'dbo.Competence_Lines', N'PositionId') IS NOT NULL
       AND COL_LENGTH(N'dbo.Competence_Lines', N'CompetenceName') IS NOT NULL
    BEGIN
        DECLARE @backfillSql nvarchar(max) = N'
            UPDATE cl
            SET cl.SkillPositionId = sp.Skill_position_id
            FROM dbo.Competence_Lines cl
            JOIN dbo.Position p        ON p.Position_id = cl.PositionId
            JOIN dbo.Skill_position sp ON sp.Position_id = p.Position_id AND sp.State > 0
            JOIN dbo.Skill s           ON s.Skill_id = sp.Skill_id
            WHERE cl.SkillPositionId IS NULL
              AND s.Skill_name = cl.CompetenceName;';
        EXEC(@backfillSql);
        PRINT 'Backfill SkillPositionId (PositionId+CompetenceName) : ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' ligne(s).';
    END
    ELSE
        PRINT 'Colonnes legacy absentes — backfill ignoré.';

    -- 2) Désactiver les lignes qui restent sans lien matrice (non évaluables).
    UPDATE cl
    SET cl.state = 0
    FROM dbo.Competence_Lines cl
    WHERE cl.SkillPositionId IS NULL;

    PRINT 'Lignes désactivées (SkillPositionId NULL) : ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + '.';

    -- 3) Re-brancher : une ligne pointant vers une matrice ARCHIVÉE est rattachée à la ligne
    --    ACTIVE de la même (position, compétence) si elle existe, et réactivée (state=1).
    --    Cela répare les lignes désactivées par une passe précédente quand la matrice a été
    --    reconstruite (nouveau Skill_position actif pour le même couple poste/compétence).
    UPDATE cl
    SET cl.SkillPositionId = active.Skill_position_id,
        cl.state = 1
    FROM dbo.Competence_Lines cl
    JOIN dbo.Skill_position archived
         ON archived.Skill_position_id = cl.SkillPositionId
        AND archived.State <= 0
    JOIN dbo.Skill_position active
         ON active.Position_id = archived.Position_id
        AND active.Skill_id = archived.Skill_id
        AND active.State > 0;

    PRINT 'Lignes rebranchées sur la matrice active : ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + '.';

    -- 4) Désactiver les lignes qui référencent encore une matrice absente ou archivée
    --    (après la tentative de rebranchement de l'étape 3).
    UPDATE cl
    SET cl.state = 0
    FROM dbo.Competence_Lines cl
    LEFT JOIN dbo.Skill_position sp ON sp.Skill_position_id = cl.SkillPositionId
    WHERE cl.SkillPositionId IS NOT NULL
      AND cl.state = 1
      AND (sp.Skill_position_id IS NULL OR sp.State <= 0);

    PRINT 'Lignes désactivées (matrice absente/archivée) : ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + '.';

    -- 5) SkillPositionId NOT NULL — seulement si aucune ligne NULL ne subsiste.
    --    On retire d'abord index/FK dépendants (Msg 5074/4922 sinon), puis on les recrée en 6).
    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Competence_Lines')
          AND name = 'SkillPositionId' AND is_nullable = 1)
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Competence_Lines WHERE SkillPositionId IS NULL)
        BEGIN
            IF EXISTS (SELECT 1 FROM sys.indexes
                       WHERE name = 'IX_CompetenceLines_SkillPositionId'
                         AND object_id = OBJECT_ID(N'dbo.Competence_Lines'))
            BEGIN
                DROP INDEX IX_CompetenceLines_SkillPositionId ON dbo.Competence_Lines;
                PRINT 'Index IX_CompetenceLines_SkillPositionId retiré (recréé en 6).';
            END

            IF EXISTS (SELECT 1 FROM sys.foreign_keys
                       WHERE name = 'FK_CompetenceLines_SkillPosition'
                         AND parent_object_id = OBJECT_ID(N'dbo.Competence_Lines'))
            BEGIN
                ALTER TABLE dbo.Competence_Lines DROP CONSTRAINT FK_CompetenceLines_SkillPosition;
                PRINT 'FK_CompetenceLines_SkillPosition retirée (recréée en 6).';
            END

            ALTER TABLE dbo.Competence_Lines ALTER COLUMN SkillPositionId INT NOT NULL;
            PRINT 'SkillPositionId passé en NOT NULL.';
        END
        ELSE
            PRINT 'Avertissement : SkillPositionId reste nullable (lignes NULL désactivées conservées).';
    END

    -- 6) Intégrité référentielle : FK + index sur SkillPositionId (recréés si absents).
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_CompetenceLines_SkillPosition'
          AND parent_object_id = OBJECT_ID(N'dbo.Competence_Lines'))
    BEGIN
        ALTER TABLE dbo.Competence_Lines ADD CONSTRAINT FK_CompetenceLines_SkillPosition
            FOREIGN KEY (SkillPositionId) REFERENCES dbo.Skill_position(Skill_position_id);
        PRINT 'FK_CompetenceLines_SkillPosition ajoutée.';
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_CompetenceLines_SkillPositionId'
          AND object_id = OBJECT_ID(N'dbo.Competence_Lines'))
    BEGIN
        CREATE INDEX IX_CompetenceLines_SkillPositionId ON dbo.Competence_Lines(SkillPositionId);
        PRINT 'Index IX_CompetenceLines_SkillPositionId ajouté.';
    END

    -- 7) Supprimer les colonnes obsolètes (PositionId, CompetenceName) si présentes.
    IF COL_LENGTH(N'dbo.Competence_Lines', N'PositionId') IS NOT NULL
    BEGIN
        DECLARE @fkPosition nvarchar(128);
        SELECT @fkPosition = fk.name
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.columns c
            ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.Competence_Lines')
          AND c.name = N'PositionId';

        IF @fkPosition IS NOT NULL
        BEGIN
            -- La concaténation littéral + QUOTENAME(...) n'est pas acceptée directement dans
            -- EXEC(...) : on construit la commande dans une variable, puis on l'exécute.
            DECLARE @dropFkSql nvarchar(400) = N'ALTER TABLE dbo.Competence_Lines DROP CONSTRAINT ' + QUOTENAME(@fkPosition);
            EXEC(@dropFkSql);
            PRINT 'Ancienne FK PositionId supprimée : ' + @fkPosition;
        END

        -- DROP COLUMN en dynamique (même garde que le backfill : pas de compilation du batch).
        DECLARE @dropPositionSql nvarchar(200) = N'ALTER TABLE dbo.Competence_Lines DROP COLUMN PositionId;';
        EXEC(@dropPositionSql);
        PRINT 'Colonne PositionId supprimée.';
    END

    IF COL_LENGTH(N'dbo.Competence_Lines', N'CompetenceName') IS NOT NULL
    BEGIN
        DECLARE @dropCompetenceNameSql nvarchar(200) = N'ALTER TABLE dbo.Competence_Lines DROP COLUMN CompetenceName;';
        EXEC(@dropCompetenceNameSql);
        PRINT 'Colonne CompetenceName supprimée.';
    END

    PRINT 'Alignement Competence_Lines ↔ Skill_position terminé.';
END
