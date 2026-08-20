using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RecreateDependentViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Étape 1 : Supprimer les vues existantes (peuvent déjà exister partiellement)
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_state_number;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_skills;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_other_formation;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_language;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_education;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_skill;");

            // Étape 2 : Recréer chaque vue (une par commande SQL)
            
            // v_employee_skill
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee_skill AS 
                SELECT 
                    es.Employee_skill_id, es.Domain_skill_id, ds.Domain_skill_name, 
                    es.Skill_id, s.Skill_name, es.Level, es.State, es.Employee_id,
                    es.Creation_date, es.Updated_date,
                    e.Registration_number, e.Name, e.FirstName, e.Birthday,
                    e.Department_name, e.Department_id, e.hiring_date
                FROM Employee_skill es
                JOIN Domain_skill ds ON es.Domain_skill_id = ds.Domain_skill_id
                JOIN Skill s ON es.Skill_id = s.Skill_id
                JOIN v_employee e ON e.Employee_id = es.Employee_id;
            ");

            // v_employee_education
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee_education AS 
                SELECT 
                    ed.Employee_education_id, ed.Study_path_id, sp.Study_path_name,
                    ed.Degree_id, d.Degree_name, ed.School_id, s.School_name,
                    ed.Start_date, ed.Ending_date, ed.State, ed.Employee_id,
                    e.Registration_number, e.Name, e.FirstName, e.Birthday,
                    e.Department_name, e.hiring_date,
                    ed.Creation_date, ed.Updated_date
                FROM Employee_education ed
                JOIN Study_path sp ON ed.Study_path_id = sp.Study_path_id
                JOIN Degree d ON ed.Degree_id = d.Degree_id
                JOIN School s ON ed.School_ID = s.School_id
                JOIN v_employee e ON e.Employee_id = ed.Employee_id;
            ");

            // v_employee_language
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee_language AS 
                SELECT 
                    el.Employee_language_id, el.Language_id, l.Language_name,
                    el.Level, el.State, el.Employee_id,
                    e.Registration_number, e.Name, e.FirstName, e.Birthday,
                    e.Department_name, e.hiring_date,
                    el.Creation_date, el.Updated_date
                FROM Employee_language el
                JOIN Language l ON el.Language_id = l.Language_id
                JOIN v_employee e ON el.Employee_id = e.Employee_id;
            ");

            // v_employee_other_formation (note: nommée v_employee_other_skill dans le code C#)
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee_other_formation AS 
                SELECT 
                    eof.Employee_other_formation_id, eof.Description, eof.Comment,
                    eof.Start_date, eof.End_date, eof.State,
                    eof.Creation_date, eof.Updated_date,
                    e.Registration_number, e.Name, e.FirstName, e.Birthday,
                    e.Department_name, e.hiring_date, e.Employee_id
                FROM Employee_other_formation eof
                JOIN v_employee e ON eof.Employee_id = e.Employee_id;
            ");

            // v_skills — vue agrégée
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

            // v_state_number
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
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_state_number;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_skills;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_other_formation;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_language;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_education;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_skill;");
        }
    }
}
