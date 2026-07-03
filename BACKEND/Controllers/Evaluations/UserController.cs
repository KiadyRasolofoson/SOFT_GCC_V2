using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Infrastructure.Data;

[Route("api/User")]
[ApiController]
public class UserController : ControllerBase
{
	private readonly UserService _employeeService;
	private readonly ApplicationDbContext _context;

	public UserController(UserService employeeService, ApplicationDbContext context)
	{
		_employeeService = employeeService;
		_context = context;
	}

	// Endpoint GET : api/User pour récupérer tous les employés avec leurs détails
	[HttpGet("details")]
	public async Task<ActionResult<IEnumerable<object>>> GetEmployeesWithDetails()
	{
		var employees = await _employeeService.GetAllEmployeesWithDetailsAsync();
		
		return Ok(employees);
	}
	[HttpGet("managers-directors")]
	public async Task<ActionResult<IEnumerable<object>>> GetAllManagerAndDirector()
	{
		var dm = await _employeeService.GetManagerAndDirector();
		return Ok(dm);
	}

	[HttpGet("{id}")]
	public async Task<IActionResult> GetEmployee(int id)
	{
		Console.WriteLine("avant la fonction getEmployeeAsync");
		var employee = await _employeeService.GetEmployeeAsync(id);
		Console.WriteLine("apres la fonction getEmployeeAsync");


		if (employee == null)
		{
			return NotFound("L'employé n'existe pas.");
		}

		Console.WriteLine($"id and name of selected salary {employee.EmployeeId}, {employee.FirstName}");
		return Ok(employee);


	}

	[HttpGet("paginated")]
	public async Task<IActionResult> GetPaginatedUsers(int pageNumber = 1, int pageSize = 10, string? search = null)
	{
		// Afficher les paramètres reçus pour le débogage
		Console.WriteLine($"Récupération des utilisateurs paginés: Page {pageNumber}, Taille {pageSize}, Recherche '{search}'");
		
		// Récupérer les utilisateurs en utilisant la méthode du service qui prend en compte la recherche
		var users = await _context.Users
			.Include(u => u.Role)
			.Where(u => string.IsNullOrEmpty(search) || 
				u.FirstName.Contains(search) || 
				u.LastName.Contains(search) || 
				(u.Username != null && u.Username.Contains(search)) ||
				(u.Email != null && u.Email.Contains(search)))
			.Skip((pageNumber - 1) * pageSize)
			.Take(pageSize)
			.ToListAsync();

		// Calculer le nombre total d'utilisateurs pour la pagination
		var totalItems = await _context.Users
			.Where(u => string.IsNullOrEmpty(search) || 
				u.FirstName.Contains(search) || 
				u.LastName.Contains(search) || 
				(u.Username != null && u.Username.Contains(search)) ||
				(u.Email != null && u.Email.Contains(search)))
			.CountAsync();
		
		var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

		return Ok(new
		{
			Users = users,
			TotalPages = totalPages,
			CurrentPage = pageNumber,
			PageSize = pageSize
		});
	}

	[HttpGet("vemployee-details-paginated")]
	public async Task<IActionResult> GetVEmployeeDetailsPaginated(
		int pageNumber = 1, 
		int pageSize = 10, 
		string? search = null,
		int? position = null,
		int? department = null,
		string? sortBy = null,
		string? sortDirection = null)
	{
		var (employees, totalPages) = await _employeeService.GetVEmployeeDetailsPaginatedAsync(
			pageNumber, 
			pageSize, 
			search,
			position,
			department,
			sortBy,
			sortDirection);

		return Ok(new
		{
			Employees = employees,
			TotalPages = totalPages,
			CurrentPage = pageNumber,
			PageSize = pageSize
		});
	}

	// Endpoint GET : api/User/roles pour récupérer tous les rôles
	[HttpGet("roles")]
	public async Task<ActionResult<IEnumerable<object>>> GetRoles()
	{
		var roles = await _context.Roles
			.Where(r => r.state == null || r.state == 1)
			.Select(r => new { roleId = r.Roleid, name = r.Title })
			.ToListAsync();
		
		return Ok(roles);
	}

	// Endpoint GET : api/User/{userId}/employee-mapping pour récupérer le mapping utilisateur-employé
	// [HttpGet("{userId}/employee-mapping")]
	// public async Task<IActionResult> GetUserEmployeeMapping(int userId)
	// {
	// 	try
	// 	{
	// 		// Récupérer l'utilisateur avec sa référence à l'employé
	// 		var user = await _context.Users
	// 			.Where(u => u.Id == userId)
	// 			.Select(u => new 
	// 			{
	// 				UserId = u.Id,
	// 				UserFirstName = u.FirstName,
	// 				UserLastName = u.LastName,
	// 				EmployeeId = u.EmployeeId
	// 			})
	// 			.FirstOrDefaultAsync();

	// 		if (user == null)
	// 		{
	// 			return NotFound($"Utilisateur avec ID {userId} introuvable.");
	// 		}

	// 		// Si EmployeeId est null, essayer de trouver un employé correspondant par nom/prénom
	// 		if (user.EmployeeId == null)
	// 		{
	// 			var employee = await _context.Employee
	// 				.Where(e => e.Name == user.UserLastName && e.FirstName == user.UserFirstName)
	// 				.Select(e => new
	// 				{
	// 					EmployeeId = e.EmployeeId,
	// 					RegistrationNumber = e.RegistrationNumber,
	// 					EmployeeName = e.Name,
	// 					EmployeeFirstName = e.FirstName,
	// 					DepartmentId = e.Department_id
	// 				})
	// 				.FirstOrDefaultAsync();

	// 			if (employee != null)
	// 			{
	// 				return Ok(new
	// 				{
	// 					UserId = user.UserId,
	// 					UserFirstName = user.UserFirstName,
	// 					UserLastName = user.UserLastName,
	// 					EmployeeId = employee.EmployeeId,
	// 					RegistrationNumber = employee.RegistrationNumber,
	// 					MappingType = "ByName", // Mapping par nom/prénom
	// 					IsDirectMapping = false
	// 				});
	// 			}
	// 			else
	// 			{
	// 				return Ok(new
	// 				{
	// 					UserId = user.UserId,
	// 					UserFirstName = user.UserFirstName,
	// 					UserLastName = user.UserLastName,
	// 					EmployeeId = (int?)null,
	// 					MappingType = "NotFound",
	// 					IsDirectMapping = false
	// 				});
	// 		}
	// 		else
	// 		{
	// 			// Si EmployeeId n'est pas null, récupérer les détails de l'employé
	// 			var employee = await _context.Employee
	// 				.Where(e => e.EmployeeId == user.EmployeeId)
	// 				.Select(e => new
	// 				{
	// 					EmployeeId = e.EmployeeId,
	// 					RegistrationNumber = e.RegistrationNumber,
	// 					EmployeeName = e.Name,
	// 					EmployeeFirstName = e.FirstName,
	// 					DepartmentId = e.Department_id
	// 				})
	// 				.FirstOrDefaultAsync();

	// 			return Ok(new
	// 			{
	// 				UserId = user.UserId,
	// 				UserFirstName = user.UserFirstName,
	// 				UserLastName = user.UserLastName,
	// 				EmployeeId = employee?.EmployeeId,
	// 				RegistrationNumber = employee?.RegistrationNumber,
	// 				EmployeeName = employee?.EmployeeName,
	// 				EmployeeFirstName = employee?.EmployeeFirstName,
	// 				DepartmentId = employee?.DepartmentId,
	// 				MappingType = "Direct", // Mapping direct via EmployeeId
	// 				IsDirectMapping = true
	// 			});
	// 		}
	// 	}
	// 	catch (Exception ex)
	// 	{
	// 		return StatusCode(500, $"Erreur lors de la récupération du mapping: {ex.Message}");
	// 	}
	// }

	// Endpoint GET : api/User/employee/{employeeId} pour récupérer l'utilisateur associé à un employé
	//[HttpGet("employee/{employeeId}")]
	//public async Task<IActionResult> GetEmployeeUser(int employeeId)
	//{
	//	try
	//	{
	//		// Récupérer l'employé
	//		var employee = await _context.Employee
	//			.Where(e => e.EmployeeId == employeeId)
	//			.Select(e => new
	//			{
	//				EmployeeId = e.EmployeeId,
	//				RegistrationNumber = e.RegistrationNumber,
	//				Name = e.Name,
	//				FirstName = e.FirstName,
	//				DepartmentId = e.Department_id
	//			})
	//			.FirstOrDefaultAsync();

	//		if (employee == null)
	//		{
	//			return NotFound($"Employé avec ID {employeeId} introuvable.");
	//		}

	//		// Chercher l'utilisateur lié à cet employé
			

	//		return Ok(new
	//		{
	//			Employee = employee,
	//			User = user,
	//			HasUserAccount = user != null
	//		});
	//	}
	//	catch (Exception ex)
	//	{
	//		return StatusCode(500, $"Erreur lors de la récupération des données: {ex.Message}");
	//	}
	//}

}
