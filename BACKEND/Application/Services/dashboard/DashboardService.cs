using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.Dashboard;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.dashboard;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.dashboard
{
	public class DashboardService
	{
		private readonly ApplicationDbContext _context;

		public DashboardService(ApplicationDbContext context)
		{
			_context = context;
		}

		// Recuperer le nombre total d'un employe
		public async Task<int> GetEmployeeCount()
		{
			using (var command = _context.Database.GetDbConnection().CreateCommand())
			{
				command.CommandText = "SELECT COALESCE(COUNT(*), 0) FROM employee";
				command.CommandType = System.Data.CommandType.Text;

				_context.Database.OpenConnection();

				var result = await command.ExecuteScalarAsync();
				return Convert.ToInt32(result);
			}
		}

		// Recuperer le nombre total des demandes souhaits
		public async Task<int> GetWishEvolutionTotal()
		{
			using (var command = _context.Database.GetDbConnection().CreateCommand())
			{
				command.CommandText = "SELECT COALESCE(COUNT(*), 0) FROM wish_evolution_career";
				command.CommandType = System.Data.CommandType.Text;

				_context.Database.OpenConnection();

				var result = await command.ExecuteScalarAsync();
				return Convert.ToInt32(result);
			}
		}

        // Compétences moyenne par employé
        public async Task<double> GetAverageSkillPerEmployee()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT SUM(skill_number)/count(*)  FROM v_skills";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToDouble(result);
            }
        }

        // Total attestations generées
        public async Task<int> GetNumberAllAttestation()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(*) FROM Certificate_history";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
        }

        // Taux moyen des competences pour tous les postes
        public async Task<double> GetCoverageRatios()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT ROUND(AVG(CoverageRatio), 2) AS Taux_de_couverture_moyen FROM v_coverage_ratios";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToDouble(result);
            }
        }

        // Nombre total de compétences affectées à au moins un poste dans l'organisation.
        public async Task<int> GetSkillRepertory()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(DISTINCT Skill_id) FROM Skill_position WHERE State > 0";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
        }

        // Détails repertorié d'une compétence
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

        // Détails taux de couverture moyen
        public async Task<List<CoverageRatiosDetailsDto>> GetCoverageRatiosDetails()
        {
            var results = new List<CoverageRatiosDetailsDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT 
                                p.position_name, 
                                s.Skill_id, 
                                s.Skill_name, 
	                            CONCAT(
                                    cr.Required_level,
                                    ' %'
                                ) AS RequiredLevel,
                                CONCAT(
                                    FORMAT(ROUND(cr.AverageLevel, 2), 'N2'),
                                    ' %'
                                ) AS AverageLevel
                            FROM v_coverage_ratios cr 
                            JOIN position p ON cr.Position_id = p.Position_id
                            JOIN skill s ON s.Skill_id = cr.Skill_id
                            ";

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

        // Nombre de sexe et d'activité des employés
        public async Task<List<EmployeeNumberSexAndActivityDto>> GetSexAndActivityNumber()
        {
            var results = new List<EmployeeNumberSexAndActivityDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT * FROM v_sex_activity_number ORDER BY Type";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new EmployeeNumberSexAndActivityDto
                        {
                            Label = reader.GetString(1),
                            Value = reader.GetInt32(4),
                            BackgroundColor = reader.GetString(2),
                            Color = reader.GetString(3)
                        });
                    }
                }
            }

            return results;
        }

        // Nombre par état de validation
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

        // Attestation par type de generation
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

        // Details attestation generé
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

        // Détails souhait d'évolution carrière
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
                            EmployeeId = reader.GetInt32(0),
                            FirstName = reader.GetString(1),
                            Name = reader.GetString(2),
                            Motivation = reader.GetString(3),
                            WishPosition = reader.GetString(4),
                            PriorityLetter = reader.GetString(5),
                            StateLetter = reader.GetString(6),
                        });
                    }
                }
            }

            return results;
        }

        // Avoir les détails d'un employé
        public async Task<List<EmployeeDetailsDto>> GetEmployeeDetails()
        {
            var results = new List<EmployeeDetailsDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT * FROM v_details_employee";

                command.CommandType = System.Data.CommandType.Text;

                await _context.Database.OpenConnectionAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new EmployeeDetailsDto
                        {
                            EmployeeId = reader.GetInt32(0),
                            Sex = reader.GetString(1),
                            RegistrationNumber = reader.GetString(2),
                            Name = reader.GetString(3),
                            FirstName = reader.GetString(4),
                            IsActive = reader.GetString(5)
                        });
                    }
                }
            }

            return results;
        }

        // Détail des postes actifs
        public async Task<List<PositionActiveDto>> GetActivePositionDetails()
        {
            var results = new List<PositionActiveDto>();

            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"SELECT cp.Position_id, p.position_name, count(*) AS employee_number FROM career_plan cp join position p on p.Position_id = cp.Position_id "+
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


        // Détail distribution d'age
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
                            EmployeeId = reader.GetInt32(0),
                            RegistrationNumber = reader.GetString(1),
                            Name = reader.GetString(2),
                            FirstName = reader.GetString(3),
                            Age = reader.GetInt32(4)
                        });
                    }
                }
            }

            return results;
        }

        // Détail distribution d'experience
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
                            EmployeeId = reader.GetInt32(0),
                            RegistrationNumber = reader.GetString(1),
                            Name = reader.GetString(2),
                            FirstName = reader.GetString(3),
                            Experience = reader.GetString(4)
                        });
                    }
                }
            }

            return results;
        }

        // Nombre de postes actifs
        public async Task<int> GetActivePosition()
        {
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT COUNT(DISTINCT Position_id) AS ActivePositions FROM career_plan WHERE Assignment_type_id = 1 AND (End_date IS NULL OR End_date > GETDATE()) AND State > 0";
                command.CommandType = System.Data.CommandType.Text;

                _context.Database.OpenConnection();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
        }

        // Competences des employees par departments
        public async Task<List<VNEmployeeSkillByDepartment>> GetEmployeeSkillByDepartment(int idDepartment, int state)
		{
			return await _context.VNEmployeeSkillByDepartment
				.FromSqlRaw("SELECT * FROM v_n_employee_skill_by_department WHERE Department_id = {0} AND state = {1}", idDepartment, state)
				.ToListAsync();
		}

		// Poste de carriere des employees par departments
		public async Task<List<VNEmployeeCareerByDepartment>> GetEmployeeCareerByDepartment(int idDepartment)
		{
			return await _context.VNEmployeeCareerByDepartment
				.FromSqlRaw("SELECT * FROM v_n_employee_career_by_department WHERE Department_id = {0}", idDepartment)
				.ToListAsync();
		}

        // Nombre d'employés par tranche d'age
        public async Task<List<VEmployeeAgeDistribution>> GetEmployeeAgeDistribution()
        {
            return await _context.VEmployeeAgeDistribution
                .FromSqlRaw("SELECT * FROM v_employee_age_distribution")
                .ToListAsync();
        }

        // Nombre d'employés par tranche d'experience
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
    }
}
