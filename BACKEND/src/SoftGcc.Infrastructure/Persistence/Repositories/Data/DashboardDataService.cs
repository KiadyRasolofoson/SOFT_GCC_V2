using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.dashboard;
using SoftGcc.Application.Dtos.Dashboard;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Data
{
    public class DashboardDataService : IDashboardDataService
    {
        private readonly ApplicationDbContext _context;

        public DashboardDataService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetEmployeeCount()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COALESCE(COUNT(*), 0) FROM employee";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToInt32(result);
            }
        }

        public async Task<int> GetWishEvolutionTotal()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COALESCE(COUNT(*), 0) FROM wish_evolution_career";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToInt32(result);
            }
        }

        public async Task<double> GetAverageSkillPerEmployee()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT SUM(skill_number)/count(*)  FROM v_skills";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToDouble(result);
            }
        }

        public async Task<int> GetNumberAllAttestation()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(*) FROM Certificate_history";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToInt32(result);
            }
        }

        public async Task<double> GetCoverageRatios()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT ROUND(AVG(CoverageRatio), 2) AS Taux_de_couverture_moyen FROM v_coverage_ratios";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToDouble(result);
            }
        }

        public async Task<int> GetSkillRepertory()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(DISTINCT Skill_id) FROM Skill_position WHERE State > 0";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToInt32(result);
            }
        }

        public async Task<List<SkillRepertoryDetailDto>> GetSkillRepertoryDetailsAsync()
        {
            var results = new List<SkillRepertoryDetailDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"
                    SELECT s.Skill_id, s.Skill_name AS SkillName, COUNT(sp.Position_id) AS PositionCount
                    FROM Skill_position sp
                    JOIN Skill s ON s.Skill_id = sp.Skill_id
                    WHERE sp.State > 0
                    GROUP BY s.Skill_id, s.Skill_name
                    ORDER BY s.Skill_name";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new SkillRepertoryDetailDto
                        {
                            SkillId = reader.GetInt32(0),
                            SkillName = reader.GetString(1),
                            PositionCount = reader.GetInt32(2),
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<CoverageRatiosDetailsDto>> GetCoverageRatiosDetails()
        {
            var results = new List<CoverageRatiosDetailsDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT 
                                p.position_name, 
                                s.Skill_id, 
                                s.Skill_name, 
                                CONCAT(cr.Required_level, ' %') AS RequiredLevel,
                                CONCAT(FORMAT(ROUND(cr.AverageLevel, 2), 'N2'), ' %') AS AverageLevel
                            FROM v_coverage_ratios cr 
                            JOIN position p ON cr.Position_id = p.Position_id
                            JOIN skill s ON s.Skill_id = cr.Skill_id";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new CoverageRatiosDetailsDto
                        {
                            PositionName = reader.GetString(0),
                            SkillId = reader.GetInt32(1),
                            SkillName = reader.GetString(2),
                            RequiredLevel = reader.GetString(3),
                            AverageLevel = reader.GetString(4),
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<EmployeeNumberSexAndActivityDto>> GetSexAndActivityNumber()
        {
            var results = new List<EmployeeNumberSexAndActivityDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                // Ne pas utiliser v_sex_activity_number tel quel : Civilite_id NULL
                // produit Designation/Background/Color NULL → GetString plante.
                command.CommandText = @"
                    SELECT
                        1 AS Type,
                        CASE
                            WHEN Civilite_id = 1 THEN N'Homme'
                            WHEN Civilite_id = 2 THEN N'Femme'
                            ELSE N'Non renseigné'
                        END AS Designation,
                        CASE
                            WHEN Civilite_id = 1 THEN N'#CCE5FF'
                            WHEN Civilite_id = 2 THEN N'#F8D7DA'
                            ELSE N'#E2E8F0'
                        END AS Background_color,
                        CASE
                            WHEN Civilite_id = 1 THEN N'#004085'
                            WHEN Civilite_id = 2 THEN N'#721C24'
                            ELSE N'#475569'
                        END AS Color,
                        COUNT(*) AS Number
                    FROM employee
                    GROUP BY Civilite_id

                    UNION ALL

                    SELECT
                        2 AS Type,
                        StatusLabel,
                        StatusColor,
                        Color,
                        COUNT(*) AS Number
                    FROM (
                        SELECT
                            CASE
                                WHEN cp.Position_id IS NOT NULL THEN N'Actif'
                                ELSE N'Non actif'
                            END AS StatusLabel,
                            CASE
                                WHEN cp.Position_id IS NOT NULL THEN N'#D4EDDA'
                                ELSE N'#E2E3E5'
                            END AS StatusColor,
                            CASE
                                WHEN cp.Position_id IS NOT NULL THEN N'#155724'
                                ELSE N'#383D41'
                            END AS Color
                        FROM employee e
                        LEFT JOIN career_plan cp
                            ON e.Registration_number = cp.Registration_number
                           AND cp.Assignment_type_id = 1
                           AND cp.State > 0
                    ) AS sub
                    GROUP BY StatusLabel, StatusColor, Color";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new EmployeeNumberSexAndActivityDto
                        {
                            Label = GetNullableString(reader, 1) ?? "Non renseigné",
                            BackgroundColor = GetNullableString(reader, 2) ?? "#E2E8F0",
                            Color = GetNullableString(reader, 3) ?? "#475569",
                            Value = GetNullableInt32(reader, 4) ?? 0
                        });
                    }
                }
            }

            return results
                .OrderBy(r => r.Label == "Homme" ? 0 : r.Label == "Femme" ? 1 : r.Label == "Actif" ? 3 : r.Label == "Non actif" ? 4 : 2)
                .ToList();
        }

        public async Task<List<StateWishEvolutionDto>> GetStateValue()
        {
            var results = new List<StateWishEvolutionDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT * FROM v_state_wish_evolution";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new StateWishEvolutionDto
                        {
                            Label = reader.GetString(3),
                            Value = reader.GetInt32(4),
                            BackgroundColor = reader.GetString(2),
                            Color = reader.GetString(1)
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<EmployeeNumberSexAndActivityDto>> GetCertificationByState()
        {
            var results = new List<EmployeeNumberSexAndActivityDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT 
                                        CASE
                                            WHEN State = 1 THEN 'Exporté'
                                            WHEN State = 2 THEN 'Envoyé email'
                                        END AS Label,
                                        CASE
                                            WHEN State = 1 THEN '#D1ECF1'
                                            WHEN State = 2 THEN '#E2D9F3'
                                        END AS Background_color,
                                        CASE
                                            WHEN State = 1 THEN '#0C5460'
                                            WHEN State = 2 THEN '#3E1F92'
                                        END AS Color,
                                        count(*) AS value 
                                        from Certificate_history
                                        group by State";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new EmployeeNumberSexAndActivityDto
                        {
                            Label = reader.GetString(0),
                            Value = reader.GetInt32(3),
                            BackgroundColor = reader.GetString(1),
                            Color = reader.GetString(2)
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<CertificateHistoryDto>> GetDetailsCertificateGenerate()
        {
            var results = new List<CertificateHistoryDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT 
                                        ch.reference,
                                        ch.file_name,
                                        ct.Certificate_type_name,
                                        CASE
                                            WHEN ch.State = 1 THEN 'Exporté'
                                            WHEN ch.State = 2 THEN 'Envoyé email'
                                        END AS State_letter
                                        from Certificate_history ch
                                        join Certificate_type ct on ch.Certificate_type_id = ct.Certificate_type_id";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new CertificateHistoryDto
                        {
                            Reference = reader.GetString(0),
                            FileName = reader.GetString(1),
                            CertificateTypeName = reader.GetString(2),
                            StateLetter = reader.GetString(3)
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<DetailsWishEvolutionDto>> GetDetailsWishEvolution()
        {
            var results = new List<DetailsWishEvolutionDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT * FROM v_details_wish_evolution";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new DetailsWishEvolutionDto
                        {
                            EmployeeId = GetNullableInt32(reader, 0) ?? 0,
                            FirstName = GetNullableString(reader, 1),
                            Name = GetNullableString(reader, 2),
                            Motivation = GetNullableString(reader, 3),
                            WishPosition = GetNullableString(reader, 4),
                            PriorityLetter = GetNullableString(reader, 5),
                            StateLetter = GetNullableString(reader, 6),
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<EmployeeDetailsDto>> GetEmployeeDetails()
        {
            var results = new List<EmployeeDetailsDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                // Colonnes explicites + COALESCE : Civilite_id / Name / FirstName peuvent être NULL (sync T_SAL)
                command.CommandText = @"
                    SELECT
                        e.Employee_id,
                        CASE
                            WHEN e.Civilite_id = 1 THEN N'Homme'
                            WHEN e.Civilite_id = 2 THEN N'Femme'
                            ELSE N'Non renseigné'
                        END AS Sexe,
                        COALESCE(e.Registration_number, N'') AS Registration_number,
                        COALESCE(e.Name, N'') AS Name,
                        COALESCE(e.FirstName, N'') AS FirstName,
                        CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM career_plan cp
                                WHERE cp.Registration_number = e.Registration_number
                                  AND cp.Assignment_type_id = 1
                                  AND cp.State > 0
                            ) THEN N'Actif'
                            ELSE N'Non actif'
                        END AS isActive
                    FROM employee e
                    ORDER BY e.Employee_id";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new EmployeeDetailsDto
                        {
                            EmployeeId = ReadAsInt32(reader, 0),
                            Sex = ReadAsString(reader, 1) ?? "Non renseigné",
                            RegistrationNumber = ReadAsString(reader, 2),
                            Name = ReadAsString(reader, 3),
                            FirstName = ReadAsString(reader, 4),
                            IsActive = ReadAsString(reader, 5) ?? "Non actif"
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<PositionActiveDto>> GetActivePositionDetails()
        {
            var results = new List<PositionActiveDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT cp.Position_id, p.position_name, count(*) AS employee_number FROM career_plan cp join position p on p.Position_id = cp.Position_id " +
                    "WHERE cp.Assignment_type_id = 1 AND (cp.End_date IS NULL OR cp.End_date > GETDATE()) AND cp.State > 0 group by cp.Position_id, p.position_name";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new PositionActiveDto
                        {
                            PositionId = reader.GetInt32(0),
                            PositionName = reader.GetString(1),
                            EmployeeNumber = reader.GetInt32(2)
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<DetailsEmployeeAgeDistributionDto>> GetDetailsDistributionAge(string? ageDistribution)
        {
            var results = new List<DetailsEmployeeAgeDistributionDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT Employee_id, Registration_number, Name, FirstName, Age 
                                FROM v_details_employee_age_distribution 
                                WHERE age_distribution = @ageDistribution";

                command.CommandType = System.Data.CommandType.Text;

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@ageDistribution";
                parameter.Value = ageDistribution ?? (object)DBNull.Value;
                command.Parameters.Add(parameter);

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new DetailsEmployeeAgeDistributionDto
                        {
                            EmployeeId = GetNullableInt32(reader, 0) ?? 0,
                            RegistrationNumber = GetNullableString(reader, 1),
                            Name = GetNullableString(reader, 2),
                            FirstName = GetNullableString(reader, 3),
                            Age = GetNullableInt32(reader, 4) ?? 0
                        });
                    }
                }
            }

            return results;
        }

        public async Task<List<DetailsEmployeeExperienceDistributionDto>> GetDetailsExperienceRange(string? experienceDistribution)
        {
            var results = new List<DetailsEmployeeExperienceDistributionDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT *
                                FROM v_details_employee_experience_range
                                WHERE experience_range = @experienceDistribution";

                command.CommandType = System.Data.CommandType.Text;

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@experienceDistribution";
                parameter.Value = experienceDistribution ?? (object)DBNull.Value;
                command.Parameters.Add(parameter);

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new DetailsEmployeeExperienceDistributionDto
                        {
                            EmployeeId = GetNullableInt32(reader, 0) ?? 0,
                            RegistrationNumber = GetNullableString(reader, 1),
                            Name = GetNullableString(reader, 2),
                            FirstName = GetNullableString(reader, 3),
                            Experience = GetNullableString(reader, 4)
                        });
                    }
                }
            }

            return results;
        }

        public async Task<int> GetActivePosition()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(DISTINCT Position_id) AS ActivePositions FROM career_plan WHERE Assignment_type_id = 1 AND (End_date IS NULL OR End_date > GETDATE()) AND State > 0";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return ToInt32(result);
            }
        }

        public async Task<List<VNEmployeeSkillByDepartment>> GetEmployeeSkillByDepartment(int idDepartment, int state)
        {
            return await _context.VNEmployeeSkillByDepartment
                .FromSqlRaw("SELECT * FROM v_n_employee_skill_by_department WHERE Department_id = {0} AND state = {1}", idDepartment, state)
                .ToListAsync();
        }

        public async Task<List<VNEmployeeCareerByDepartment>> GetEmployeeCareerByDepartment(int idDepartment)
        {
            return await _context.VNEmployeeCareerByDepartment
                .FromSqlRaw("SELECT * FROM v_n_employee_career_by_department WHERE Department_id = {0}", idDepartment)
                .ToListAsync();
        }

        public async Task<List<VEmployeeAgeDistribution>> GetEmployeeAgeDistribution()
        {
            return await _context.VEmployeeAgeDistribution
                .FromSqlRaw("SELECT * FROM v_employee_age_distribution")
                .ToListAsync();
        }

        public async Task<List<VEmployeeExperienceDistribution>> GetEmployeeExperienceDistribution()
        {
            return await _context.VEmployeeExperienceDistribution
                .FromSqlRaw("SELECT * FROM v_employee_experience_distribution ORDER BY CASE Experience_range " +
                "WHEN 'Moins de 1 an' THEN 0" +
                " WHEN '1-3 ans' THEN 1" +
                "WHEN '4-6 ans' THEN 2 " +
                "WHEN '7-10 ans' THEN 3 " +
                "ELSE 4 " +
                "END")
                .ToListAsync();
        }

        private static string? GetNullableString(DbDataReader reader, int ordinal)
        {
            return ReadAsString(reader, ordinal);
        }

        private static int? GetNullableInt32(DbDataReader reader, int ordinal)
        {
            return ReadAsInt32(reader, ordinal);
        }

        /// <summary>
        /// Lecture tolérante aux NULL et aux types SQL non-string (évite SqlNullValueException).
        /// </summary>
        private static string? ReadAsString(DbDataReader reader, int ordinal)
        {
            if (reader.IsDBNull(ordinal))
            {
                return null;
            }

            var value = reader.GetValue(ordinal);
            return value is string s ? s : Convert.ToString(value);
        }

        private static int? ReadAsInt32(DbDataReader reader, int ordinal)
        {
            if (reader.IsDBNull(ordinal))
            {
                return null;
            }

            var value = reader.GetValue(ordinal);
            return value switch
            {
                int i => i,
                long l => checked((int)l),
                short s => s,
                byte b => b,
                decimal d => (int)d,
                _ => Convert.ToInt32(value)
            };
        }

        /// <summary>
        /// Convertit un résultat scalaire SQL en int, en tolérant NULL/DBNull (retourne 0).
        /// Évite « Object cannot be cast from DBNull to other types » quand une agrégation renvoie NULL.
        /// </summary>
        private static int ToInt32(object? value)
        {
            return value == null || value == DBNull.Value ? 0 : Convert.ToInt32(value);
        }

        /// <summary>
        /// Convertit un résultat scalaire SQL en double, en tolérant NULL/DBNull (retourne 0).
        /// </summary>
        private static double ToDouble(object? value)
        {
            return value == null || value == DBNull.Value ? 0 : Convert.ToDouble(value);
        }
    }
}
