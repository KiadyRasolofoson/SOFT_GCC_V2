using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixVEmployeeLeftJoin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Étape 1 : Supprimer les vues dépendantes de v_employee
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_state_number;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_skill;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_education;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_language;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_skills;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_other_skill;");

            // Étape 2 : Supprimer v_employee (ancienne version avec INNER JOIN)
            // Puis recréer avec LEFT JOIN (chaque CREATE VIEW doit être seul dans sa commande)
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee;");
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee AS
                SELECT 
                    e.Employee_id, 
                    e.Registration_number, 
                    e.Name, 
                    e.FirstName, 
                    e.Birthday, 
                    d.Department_id, 
                    d.Department_name, 
                    d.photo AS department_photo,
                    e.hiring_date,
                    e.civilite_id,
                    c.civilite_name,
                    e.manager_id,
                    (SELECT name FROM employee WHERE employee_id = e.manager_id) AS Manager_name,
                    (SELECT FirstName FROM employee WHERE employee_id = e.manager_id) AS Manager_firstName,
                    e.photo AS employee_photo,
                    email
                FROM 
                    Employee e 
                LEFT JOIN Department d ON d.Department_id = e.department_id
                LEFT JOIN Civilite c ON c.civilite_id = e.civilite_id;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restaurer l'ancienne vue avec INNER JOIN
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_state_number;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_skill;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_education;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_language;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_skills;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee_other_formation;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS v_employee;");
            migrationBuilder.Sql(@"
                CREATE VIEW v_employee AS
                SELECT 
                    e.Employee_id, 
                    e.Registration_number, 
                    e.Name, 
                    e.FirstName, 
                    e.Birthday, 
                    d.Department_id, 
                    d.Department_name, 
                    d.photo AS department_photo,
                    e.hiring_date,
                    e.civilite_id,
                    c.civilite_name,
                    e.manager_id,
                    (SELECT name FROM employee WHERE employee_id = e.manager_id) AS Manager_name,
                    (SELECT FirstName FROM employee WHERE employee_id = e.manager_id) AS Manager_firstName,
                    e.photo AS employee_photo,
                    email
                FROM 
                    Employee e 
                JOIN Department d ON d.Department_id = e.department_id
                JOIN Civilite c ON c.civilite_id = e.civilite_id;
            ");
        }
    }
}
