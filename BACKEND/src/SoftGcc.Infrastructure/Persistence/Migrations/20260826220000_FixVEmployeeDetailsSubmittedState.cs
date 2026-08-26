using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftGcc.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// La liste de notation lisait VEmployeeDetails (state = 10, planifié).
    /// Après soumission du portail le dossier passe à 20 et disparaissait de la liste.
    /// </summary>
    [Migration("20260826220000_FixVEmployeeDetailsSubmittedState")]
    public partial class FixVEmployeeDetailsSubmittedState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.VEmployeeDetails;");
            migrationBuilder.Sql("""
                CREATE VIEW dbo.VEmployeeDetails AS
                SELECT
                    e.Employee_id AS EmployeeId,
                    e.FirstName AS FirstName,
                    e.Name AS LastName,
                    ISNULL(ep.Position_name, N'Non défini') AS Position,
                    ISNULL(ep.Position_id, 0) AS PositionId,
                    CAST(NULL AS nvarchar(255)) AS Role,
                    d.Department_name AS Department,
                    ev.Evaluations_id AS EvaluationId,
                    ev.start_date AS EvaluationDate,
                    ev.overallScore AS OverallScore,
                    ev.comments AS EvaluationComments,
                    ev.isServiceApproved AS IsServiceApproved,
                    ev.isDgApproved AS IsDgApproved,
                    et.designation AS EvaluationType,
                    ev.strengths AS strengths,
                    ev.weaknesses AS weaknesses,
                    ev.state AS state
                FROM Employee e
                LEFT JOIN Department d ON e.Department_id = d.Department_id
                LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
                INNER JOIN Evaluations ev
                    ON e.Employee_id = ev.employeeId
                    AND ev.state = 20
                    AND ev.Evaluations_id = (
                        SELECT MAX(ev2.Evaluations_id)
                        FROM Evaluations ev2
                        WHERE ev2.employeeId = e.Employee_id AND ev2.state = 20
                    )
                LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS dbo.VEmployeeDetails;");
            migrationBuilder.Sql("""
                CREATE VIEW dbo.VEmployeeDetails AS
                SELECT
                    e.Employee_id AS EmployeeId,
                    e.FirstName AS FirstName,
                    e.Name AS LastName,
                    ISNULL(ep.Position_name, N'Non défini') AS Position,
                    ISNULL(ep.Position_id, 0) AS PositionId,
                    NULL AS Role,
                    d.Department_name AS Department,
                    ev.Evaluations_id AS EvaluationId,
                    ev.start_date AS EvaluationDate,
                    ev.overallScore AS OverallScore,
                    ev.comments AS EvaluationComments,
                    ev.isServiceApproved AS IsServiceApproved,
                    ev.isDgApproved AS IsDgApproved,
                    et.designation AS EvaluationType,
                    ev.strengths AS strengths,
                    ev.weaknesses AS weaknesses,
                    ev.state AS state
                FROM Employee e
                LEFT JOIN Department d ON e.Department_id = d.Department_id
                LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
                LEFT JOIN Evaluations ev ON e.Employee_id = ev.employeeId
                LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id
                WHERE ev.state = 10;
                """);
        }
    }
}
