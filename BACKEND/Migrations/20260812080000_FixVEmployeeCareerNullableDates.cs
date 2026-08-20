using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace soft_carriere_competence.Migrations
{
    /// <inheritdoc />
    public partial class FixVEmployeeCareerNullableDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_career;");

            migrationBuilder.Sql(@"
CREATE OR ALTER VIEW v_career_plan_employee_number AS
SELECT 
	e.Registration_number, 
	e.Name, 
	e.FirstName, 
	CASE WHEN 1=1 THEN e.Birthday ELSE NULL END AS Birthday, 
	CASE WHEN 1=1 THEN e.hiring_date ELSE NULL END AS hiring_date, 
	e.civilite_id,
	e.civilite_name,
	e.email,
	COALESCE(COUNT(c.Career_plan_id), 0) AS career_plan_number 
FROM v_employee e
INNER JOIN career_plan c ON c.Registration_number = e.Registration_number AND c.state > 0
GROUP BY 
  e.Registration_number, 
  e.Name, 
  e.FirstName, 
  e.Birthday, 
  e.hiring_date,
  e.civilite_name,
  e.civilite_id,
  e.email;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_employee_career AS
SELECT 
	ep.Registration_number, 
	CASE WHEN 1=1 THEN cpen.civilite_id ELSE NULL END AS civilite_id,
	cpen.civilite_name,
	cpen.Name,
	cpen.FirstName,
	CASE WHEN 1=1 THEN cpen.Birthday ELSE NULL END AS Birthday,
	CASE WHEN 1=1 THEN cpen.hiring_date ELSE NULL END AS hiring_date,
    CASE WHEN 1=1 THEN ep.Assignment_type_id ELSE CAST(NULL AS INT) END AS Assignment_type_id, 
    ep.Decision_number,
    ep.Assignment_date,
    ep.decision_date, 
    ep.Description,
    ep.Department_id,
    ep.Department_name,
    ep.Position_id,
    ep.Position_name,
    ep.Base_salary,
    ep.Net_salary,
	cpen.career_plan_number,
	ep.Establishment_id,
	ep.Ending_contract,
	cpen.email
FROM v_employee_get_last_position ep
JOIN v_career_plan_employee_number cpen
ON ep.Registration_number = cpen.Registration_number;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_career;");

            migrationBuilder.Sql(@"
CREATE OR ALTER VIEW v_career_plan_employee_number AS
SELECT 
	e.Registration_number, 
	e.Name, 
	e.FirstName, 
	e.Birthday, 
	e.hiring_date, 
	e.civilite_id,
	e.civilite_name,
	e.email,
	COALESCE(count(*), 0) as career_plan_number 
FROM v_employee e
LEFT join career_plan c 
ON c.Registration_number = e.Registration_number 
WHERE c.state > 0
GROUP BY 
  e.Registration_number, 
  e.Name, 
  e.FirstName, 
  e.Birthday, 
  e.hiring_date,
  e.civilite_name,
  e.civilite_id,
  e.email;
");

            migrationBuilder.Sql(@"
CREATE VIEW v_employee_career AS
SELECT 
	ep.Registration_number, 
	cpen.civilite_id,
	cpen.civilite_name,
	cpen.Name,
	cpen.FirstName,
	cpen.Birthday,
	cpen.hiring_date,
    ep.Assignment_type_id, 
    ep.Decision_number,
    ep.Assignment_date,
    ep.decision_date, 
    ep.Description,
    ep.Department_id,
    ep.Department_name,
    ep.Position_id,
    ep.Position_name,
    ep.Base_salary,
    ep.Net_salary,
	cpen.career_plan_number,
	ep.Establishment_id,
	ep.Ending_contract,
	cpen.email
FROM v_employee_get_last_position ep
JOIN v_career_plan_employee_number cpen
ON ep.Registration_number = cpen.Registration_number;
");
        }
    }
}
