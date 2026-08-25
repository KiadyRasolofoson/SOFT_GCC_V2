using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillReferential : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Mapping legacy % → rank 1–4 : <25→1, <50→2, <75→3, sinon 4.
            // Required_level (0–100) utilise le même mapping ; NULL/0 → 2 (Application).
            migrationBuilder.Sql(@"
IF COL_LENGTH('Domain_skill', 'Code') IS NULL
    ALTER TABLE Domain_skill ADD Code NVARCHAR(64) NULL;
IF COL_LENGTH('Domain_skill', 'Description') IS NULL
    ALTER TABLE Domain_skill ADD Description NVARCHAR(MAX) NULL;
IF COL_LENGTH('Domain_skill', 'Sort_order') IS NULL
    ALTER TABLE Domain_skill ADD Sort_order INT NOT NULL CONSTRAINT DF_Domain_skill_Sort DEFAULT 0;
IF COL_LENGTH('Domain_skill', 'State') IS NULL
    ALTER TABLE Domain_skill ADD State NVARCHAR(32) NOT NULL CONSTRAINT DF_Domain_skill_State DEFAULT N'Active';
");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'Skill_family', N'U') IS NULL
BEGIN
    CREATE TABLE Skill_family (
        Family_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Domain_skill_id INT NOT NULL,
        Code NVARCHAR(64) NOT NULL,
        Name NVARCHAR(256) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Sort_order INT NOT NULL CONSTRAINT DF_Skill_family_Sort DEFAULT 0,
        State NVARCHAR(32) NOT NULL CONSTRAINT DF_Skill_family_State DEFAULT N'Active',
        CONSTRAINT FK_Skill_family_Domain FOREIGN KEY (Domain_skill_id) REFERENCES Domain_skill(Domain_skill_id)
    );
    CREATE UNIQUE INDEX UX_Skill_family_Code ON Skill_family(Code);
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('Skill', 'Code') IS NULL
    ALTER TABLE Skill ADD Code NVARCHAR(64) NULL;
IF COL_LENGTH('Skill', 'Definition') IS NULL
    ALTER TABLE Skill ADD Definition NVARCHAR(MAX) NULL;
IF COL_LENGTH('Skill', 'Category') IS NULL
    ALTER TABLE Skill ADD Category NVARCHAR(32) NULL;
IF COL_LENGTH('Skill', 'Family_id') IS NULL
    ALTER TABLE Skill ADD Family_id INT NULL;
IF COL_LENGTH('Skill', 'Current_version') IS NULL
    ALTER TABLE Skill ADD Current_version INT NOT NULL CONSTRAINT DF_Skill_CurrentVersion DEFAULT 1;
IF COL_LENGTH('Skill', 'State') IS NULL
    ALTER TABLE Skill ADD State NVARCHAR(32) NOT NULL CONSTRAINT DF_Skill_State DEFAULT N'Draft';
IF COL_LENGTH('Skill', 'Created_at') IS NULL
    ALTER TABLE Skill ADD Created_at DATETIME2 NULL;
IF COL_LENGTH('Skill', 'Updated_at') IS NULL
    ALTER TABLE Skill ADD Updated_at DATETIME2 NULL;
IF COL_LENGTH('Skill', 'Created_by_user_id') IS NULL
    ALTER TABLE Skill ADD Created_by_user_id INT NULL;
IF COL_LENGTH('Skill', 'Published_at') IS NULL
    ALTER TABLE Skill ADD Published_at DATETIME2 NULL;
");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'Skill_version', N'U') IS NULL
BEGIN
    CREATE TABLE Skill_version (
        Skill_version_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Skill_id INT NOT NULL,
        Version INT NOT NULL,
        Name NVARCHAR(256) NOT NULL,
        Definition NVARCHAR(MAX) NOT NULL,
        Category NVARCHAR(32) NOT NULL,
        Valid_from DATETIME2 NOT NULL,
        Valid_to DATETIME2 NULL,
        Published_at DATETIME2 NOT NULL,
        Published_by_user_id INT NULL,
        CONSTRAINT FK_Skill_version_Skill FOREIGN KEY (Skill_id) REFERENCES Skill(Skill_id)
    );
    CREATE UNIQUE INDEX UX_Skill_version_Skill_Version ON Skill_version(Skill_id, Version);
END

IF OBJECT_ID(N'Skill_level_descriptor', N'U') IS NULL
BEGIN
    CREATE TABLE Skill_level_descriptor (
        Descriptor_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Skill_id INT NOT NULL,
        Version INT NOT NULL,
        Rank INT NOT NULL,
        Label NVARCHAR(64) NOT NULL,
        Behavioral_definition NVARCHAR(MAX) NOT NULL,
        CONSTRAINT FK_Skill_level_descriptor_Skill FOREIGN KEY (Skill_id) REFERENCES Skill(Skill_id),
        CONSTRAINT CK_Skill_level_descriptor_Rank CHECK (Rank BETWEEN 1 AND 4)
    );
    CREATE UNIQUE INDEX UX_Skill_level_descriptor ON Skill_level_descriptor(Skill_id, Version, Rank);
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('Skill_position', 'Expected_level') IS NULL
    ALTER TABLE Skill_position ADD Expected_level INT NULL;
IF COL_LENGTH('Skill_position', 'Requirement_kind') IS NULL
    ALTER TABLE Skill_position ADD Requirement_kind NVARCHAR(32) NULL;
IF COL_LENGTH('Skill_position', 'Weight') IS NULL
    ALTER TABLE Skill_position ADD Weight DECIMAL(9,4) NOT NULL CONSTRAINT DF_Skill_position_Weight DEFAULT 1;
IF COL_LENGTH('Skill_position', 'Required_level') IS NULL
    ALTER TABLE Skill_position ADD Required_level FLOAT NULL;
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('Employee_skill', 'Acquired_level') IS NULL
    ALTER TABLE Employee_skill ADD Acquired_level INT NULL;
IF COL_LENGTH('Employee_skill', 'Skill_version_id') IS NULL
    ALTER TABLE Employee_skill ADD Skill_version_id INT NULL;
IF COL_LENGTH('Employee_skill', 'Source') IS NULL
    ALTER TABLE Employee_skill ADD Source NVARCHAR(32) NULL;
IF COL_LENGTH('Evaluation_Competence_Results', 'Skill_version_id') IS NULL
    ALTER TABLE Evaluation_Competence_Results ADD Skill_version_id INT NULL;
");

            migrationBuilder.Sql(@"
UPDATE Domain_skill
SET Code = CASE WHEN Code IS NULL OR LTRIM(RTRIM(Code)) = N'' THEN N'DOMAIN-' + RIGHT(N'00000' + CAST(Domain_skill_id AS NVARCHAR(12)), 5) ELSE Code END,
    State = CASE WHEN State IS NULL OR LTRIM(RTRIM(State)) = N'' THEN N'Active' ELSE State END;

IF NOT EXISTS (SELECT 1 FROM Domain_skill WHERE Code = N'UNC')
BEGIN
    INSERT INTO Domain_skill (Domain_skill_name, Code, Description, Sort_order, State)
    VALUES (N'Non classé', N'UNC', N'Famille d''accueil des compétences migrées.', 999, N'Active');
END

IF NOT EXISTS (SELECT 1 FROM Skill_family WHERE Code = N'UNC-FAM')
BEGIN
    INSERT INTO Skill_family (Domain_skill_id, Code, Name, Description, Sort_order, State)
    SELECT Domain_skill_id, N'UNC-FAM', N'Non classé', N'Compétences à classer par RH.', 999, N'Active'
    FROM Domain_skill WHERE Code = N'UNC';
END

DECLARE @UnclassifiedFamilyId INT = (SELECT TOP 1 Family_id FROM Skill_family WHERE Code = N'UNC-FAM');

UPDATE Skill
SET Skill_name = CASE
        WHEN Skill_name IS NULL OR LTRIM(RTRIM(Skill_name)) = N'' THEN N'Compétence ' + CAST(Skill_id AS NVARCHAR(12))
        ELSE LEFT(Skill_name, 256)
    END,
    Code = CASE WHEN Code IS NULL OR LTRIM(RTRIM(Code)) = N'' THEN N'SKILL-' + RIGHT(N'00000' + CAST(Skill_id AS NVARCHAR(12)), 5) ELSE Code END,
    Definition = CASE WHEN Definition IS NULL OR LTRIM(RTRIM(Definition)) = N'' THEN N'À compléter' ELSE Definition END,
    Category = CASE WHEN Category IS NULL OR LTRIM(RTRIM(Category)) = N'' THEN N'Transversal' ELSE Category END,
    Family_id = ISNULL(Family_id, @UnclassifiedFamilyId),
    Current_version = ISNULL(Current_version, 1),
    State = CASE WHEN State IS NULL OR LTRIM(RTRIM(State)) = N'' THEN N'Draft' ELSE State END,
    Created_at = ISNULL(Created_at, SYSUTCDATETIME()),
    Updated_at = ISNULL(Updated_at, SYSUTCDATETIME());
");

            migrationBuilder.Sql(@"
UPDATE Employee_skill
SET Acquired_level = CASE
        WHEN Acquired_level BETWEEN 1 AND 4 THEN Acquired_level
        WHEN Level < 25 THEN 1
        WHEN Level < 50 THEN 2
        WHEN Level < 75 THEN 3
        ELSE 4
    END,
    Source = ISNULL(NULLIF(LTRIM(RTRIM(Source)), N''), N'Import');

UPDATE Skill_position
SET Expected_level = CASE
        WHEN Expected_level BETWEEN 1 AND 4 THEN Expected_level
        WHEN Required_level IS NULL OR Required_level <= 0 THEN 2
        WHEN Required_level < 25 THEN 1
        WHEN Required_level < 50 THEN 2
        WHEN Required_level < 75 THEN 3
        ELSE 4
    END,
    Requirement_kind = ISNULL(NULLIF(LTRIM(RTRIM(Requirement_kind)), N''), N'Required'),
    Weight = CASE WHEN Weight IS NULL OR Weight <= 0 THEN 1 ELSE Weight END;
");

            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Skill') AND name = N'Skill_name' AND max_length = -1
)
BEGIN
    ALTER TABLE Skill ALTER COLUMN Skill_name NVARCHAR(256) NULL;
END
");

            migrationBuilder.Sql(@"
UPDATE Skill SET Family_id = (SELECT TOP 1 Family_id FROM Skill_family WHERE Code = N'UNC-FAM') WHERE Family_id IS NULL;
ALTER TABLE Skill ALTER COLUMN Code NVARCHAR(64) NOT NULL;
ALTER TABLE Skill ALTER COLUMN Definition NVARCHAR(MAX) NOT NULL;
ALTER TABLE Skill ALTER COLUMN Category NVARCHAR(32) NOT NULL;
ALTER TABLE Skill ALTER COLUMN Family_id INT NOT NULL;
ALTER TABLE Skill ALTER COLUMN State NVARCHAR(32) NOT NULL;
ALTER TABLE Domain_skill ALTER COLUMN Code NVARCHAR(64) NOT NULL;
ALTER TABLE Domain_skill ALTER COLUMN State NVARCHAR(32) NOT NULL;
ALTER TABLE Skill_position ALTER COLUMN Expected_level INT NOT NULL;
ALTER TABLE Skill_position ALTER COLUMN Requirement_kind NVARCHAR(32) NOT NULL;
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Skill_Family')
    ALTER TABLE Skill ADD CONSTRAINT FK_Skill_Family FOREIGN KEY (Family_id) REFERENCES Skill_family(Family_id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Employee_skill_Skill_version')
    ALTER TABLE Employee_skill ADD CONSTRAINT FK_Employee_skill_Skill_version FOREIGN KEY (Skill_version_id) REFERENCES Skill_version(Skill_version_id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_EvalCompResults_Skill_version')
    ALTER TABLE Evaluation_Competence_Results ADD CONSTRAINT FK_EvalCompResults_Skill_version FOREIGN KEY (Skill_version_id) REFERENCES Skill_version(Skill_version_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Skill_Code' AND object_id = OBJECT_ID(N'Skill'))
    CREATE UNIQUE INDEX UX_Skill_Code ON Skill(Code);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Skill_Name_Active' AND object_id = OBJECT_ID(N'Skill'))
    CREATE UNIQUE INDEX UX_Skill_Name_Active ON Skill(Skill_name) WHERE State = N'Active';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Domain_skill_Code' AND object_id = OBJECT_ID(N'Domain_skill'))
    CREATE UNIQUE INDEX UX_Domain_skill_Code ON Domain_skill(Code);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Skill_position_Active' AND object_id = OBJECT_ID(N'Skill_position'))
    CREATE UNIQUE INDEX UX_Skill_position_Active ON Skill_position(Position_id, Skill_id) WHERE State > 0;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Skill_position_Expected')
    ALTER TABLE Skill_position ADD CONSTRAINT CK_Skill_position_Expected CHECK (Expected_level BETWEEN 1 AND 4);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Employee_skill_Acquired')
    ALTER TABLE Employee_skill ADD CONSTRAINT CK_Employee_skill_Acquired CHECK (Acquired_level IS NULL OR Acquired_level BETWEEN 1 AND 4);
");

            migrationBuilder.Sql(@"
IF OBJECT_ID(N'v_coverage_ratios', N'V') IS NOT NULL DROP VIEW v_coverage_ratios;
IF OBJECT_ID(N'v_employee_skills_level', N'V') IS NOT NULL DROP VIEW v_employee_skills_level;
IF OBJECT_ID(N'v_state_number', N'V') IS NOT NULL DROP VIEW v_state_number;
IF OBJECT_ID(N'v_skills', N'V') IS NOT NULL DROP VIEW v_skills;
IF OBJECT_ID(N'v_employee_skill', N'V') IS NOT NULL DROP VIEW v_employee_skill;
IF OBJECT_ID(N'v_skill_position', N'V') IS NOT NULL DROP VIEW v_skill_position;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_employee_skill AS
SELECT
    es.Employee_skill_id, es.Domain_skill_id, ds.Domain_skill_name,
    es.Skill_id, s.Skill_name, es.Level, es.Acquired_level, es.Skill_version_id, es.Source,
    es.State, es.Employee_id, es.Creation_date, es.Updated_date,
    e.Registration_number, e.Name, e.FirstName, e.Birthday,
    e.Department_name, e.Department_id, e.hiring_date
FROM Employee_skill es
JOIN Domain_skill ds ON es.Domain_skill_id = ds.Domain_skill_id
JOIN Skill s ON es.Skill_id = s.Skill_id
JOIN v_employee e ON e.Employee_id = es.Employee_id;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_skill_position AS
SELECT
    cp.Skill_position_id,
    cp.Position_id,
    p.position_name,
    cp.Skill_id,
    s.Skill_name,
    cp.Expected_level,
    cp.Requirement_kind,
    cp.Weight,
    cp.State,
    cp.Creation_date,
    cp.Updated_date
FROM Skill_position cp
INNER JOIN Position p ON p.Position_id = cp.Position_id
INNER JOIN Skill s ON s.Skill_id = cp.Skill_id;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_employee_skills_level AS
SELECT
    ca.Position_id,
    rs.Skill_id,
    rs.Expected_level,
    AVG(CAST(es.Acquired_level AS FLOAT)) AS AverageLevel,
    CAST(SUM(CASE WHEN es.Acquired_level >= rs.Expected_level THEN 1 ELSE 0 END) AS FLOAT)
        / NULLIF(COUNT(ca.Employee_id), 0) * 100 AS CoverageRatio
FROM Skill_position rs
LEFT JOIN v_current_assignments ca ON rs.Position_id = ca.Position_id
LEFT JOIN Employee_skill es ON es.Employee_id = ca.Employee_id AND es.Skill_id = rs.Skill_id
WHERE rs.State > 0 AND rs.Requirement_kind IN (N'Critical', N'Required')
GROUP BY ca.Position_id, rs.Skill_id, rs.Expected_level;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_coverage_ratios AS
SELECT
    Position_id,
    Skill_id,
    Expected_level,
    ISNULL(AverageLevel, 0) AS AverageLevel,
    ISNULL(CoverageRatio, 0) AS CoverageRatio
FROM v_employee_skills_level;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_skills AS
SELECT
    e.Employee_id, e.Registration_number, e.Name, e.FirstName,
    e.Department_name, e.Birthday, e.Hiring_date, e.employee_photo,
    COALESCE(ofn.other_formation_number, 0) AS other_formation_number,
    COALESCE(ee.education_number, 0) AS education_number,
    COALESCE(es.skill_number, 0) AS skill_number,
    COALESCE(el.language_number, 0) AS language_number,
    CASE
        WHEN COALESCE(ofn.updated_date, '1970-01-01') >= COALESCE(ee.updated_date, '1970-01-01')
         AND COALESCE(ofn.updated_date, '1970-01-01') >= COALESCE(es.updated_date, '1970-01-01')
         AND COALESCE(ofn.updated_date, '1970-01-01') >= COALESCE(el.updated_date, '1970-01-01') THEN ofn.updated_date
        WHEN COALESCE(ee.updated_date, '1970-01-01') >= COALESCE(ofn.updated_date, '1970-01-01')
         AND COALESCE(ee.updated_date, '1970-01-01') >= COALESCE(es.updated_date, '1970-01-01')
         AND COALESCE(ee.updated_date, '1970-01-01') >= COALESCE(el.updated_date, '1970-01-01') THEN ee.updated_date
        WHEN COALESCE(es.updated_date, '1970-01-01') >= COALESCE(ofn.updated_date, '1970-01-01')
         AND COALESCE(es.updated_date, '1970-01-01') >= COALESCE(ee.updated_date, '1970-01-01')
         AND COALESCE(es.updated_date, '1970-01-01') >= COALESCE(el.updated_date, '1970-01-01') THEN es.updated_date
        ELSE COALESCE(el.updated_date, '1970-01-01')
    END AS Updated_date
FROM v_employee e
LEFT JOIN v_employee_other_formation_number ofn ON ofn.employee_id = e.employee_id
LEFT JOIN v_employee_education_number ee ON ee.Employee_id = e.Employee_id
LEFT JOIN v_employee_skill_number es ON es.employee_id = e.Employee_id
LEFT JOIN v_employee_language_number el ON el.employee_id = e.Employee_id;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_state_number AS
SELECT
    employee_id, state, COUNT(*) AS number,
    CASE
        WHEN state = 1 THEN 'Non validé'
        WHEN state = 5 THEN 'Validé par evaluation'
    END AS State_letter
FROM v_employee_skill
GROUP BY state, employee_id;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'v_coverage_ratios', N'V') IS NOT NULL DROP VIEW v_coverage_ratios;
IF OBJECT_ID(N'v_employee_skills_level', N'V') IS NOT NULL DROP VIEW v_employee_skills_level;
IF OBJECT_ID(N'v_state_number', N'V') IS NOT NULL DROP VIEW v_state_number;
IF OBJECT_ID(N'v_skills', N'V') IS NOT NULL DROP VIEW v_skills;
IF OBJECT_ID(N'v_employee_skill', N'V') IS NOT NULL DROP VIEW v_employee_skill;
IF OBJECT_ID(N'v_skill_position', N'V') IS NOT NULL DROP VIEW v_skill_position;
");
        }
    }
}
