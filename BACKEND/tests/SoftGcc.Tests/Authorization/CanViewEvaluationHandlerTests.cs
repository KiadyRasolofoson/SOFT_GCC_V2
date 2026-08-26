using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Authorization.Handlers;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Infrastructure.Persistence;
using Xunit;

namespace SoftGcc.Tests.Authorization
{
    /// <summary>
    /// Tests unitaires pour CanViewEvaluationHandler.
    /// Chaque handler est testé isolément avec un DbContext InMemory et un mock IManagerHierarchyService.
    /// </summary>
    public class CanViewEvaluationHandlerTests
    {
        /// <summary>
        /// Crée un DbContext InMemory avec les données de test nécessaires.
        /// </summary>
        private ApplicationDbContext CreateDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        /// <summary>
        /// Crée un ClaimsPrincipal avec le claim userId spécifié.
        /// </summary>
        private ClaimsPrincipal CreateUser(int userId, int roleId = 2)
        {
            var claims = new List<Claim>
            {
                new Claim("userId", userId.ToString()),
                new Claim("roleId", roleId.ToString())
            };
            return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        }

        /// <summary>
        /// Mock IManagerHierarchyService avec des comportements configurables.
        /// </summary>
        private Mock<IManagerHierarchyService> CreateHierarchyMock(
            int managerUserId, int managedEmployeeId,
            bool isRH = false, bool isDG = false)
        {
            var mock = new Mock<IManagerHierarchyService>();

            // GetEmployeeIdForUserAsync : résout userId → employeeId
            mock.Setup(m => m.GetEmployeeIdForUserAsync(It.IsAny<int>()))
                .ReturnsAsync((int uid) =>
                {
                    if (uid == 1) return 100; // employé 1
                    if (uid == 2) return 200; // manager
                    if (uid == 3) return 300; // RH
                    return null;
                });

            // IsManagerOfAsync
            mock.Setup(m => m.IsManagerOfAsync(managerUserId, managedEmployeeId))
                .ReturnsAsync(true);
            mock.Setup(m => m.IsManagerOfAsync(It.Is<int>(u => u != managerUserId), It.IsAny<int>()))
                .ReturnsAsync(false);

            // IsUserRHAsync
            mock.Setup(m => m.IsUserRHAsync(It.IsAny<int>())).ReturnsAsync(isRH);
            mock.Setup(m => m.IsUserRHAsync(3)).ReturnsAsync(true); // user 3 est RH

            // IsUserDGAsync
            mock.Setup(m => m.IsUserDGAsync(It.IsAny<int>())).ReturnsAsync(isDG);
            mock.Setup(m => m.IsUserDGAsync(4)).ReturnsAsync(true); // user 4 est DG

            return mock;
        }

        [Fact]
        public async Task EmployeeCanViewOwnEvaluation_ShouldSucceed()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100, // employé 1
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>
                {
                    new EvaluationSupervisors { EvaluationId = 1, SupervisorId = 2 } // superviseur = user 2
                }
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            var user = CreateUser(userId: 1); // employé 1 (userId=1 → employeeId=100)
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasSucceeded);
        }

        [Fact]
        public async Task DirectManagerCanViewSubordinateEvaluation_ShouldSucceed()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100, // subordonné
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            // Manager (userId=2 → employeeId=200) est manager de l'employé 100
            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            var user = CreateUser(userId: 2); // manager
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasSucceeded);
        }

        [Fact]
        public async Task ColleagueCannotViewPeerEvaluation_ShouldFail()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100, // appartient à l'employé 100
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            // userId=5 → employeeId=500 (collègue sans lien)
            mockHierarchy.Setup(m => m.GetEmployeeIdForUserAsync(5)).ReturnsAsync(500);

            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            var user = CreateUser(userId: 5); // collègue
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasFailed);
        }

        [Fact]
        public async Task RHCanViewAnyEvaluation_ShouldSucceed()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 999, // employé quelconque
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            // userId=3 → employeeId=300, isRH=true
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            var user = CreateUser(userId: 3); // RH
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasSucceeded);
        }

        [Fact]
        public async Task SupervisorCanViewAssignedEvaluation_ShouldSucceed()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 999,
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>
                {
                    new EvaluationSupervisors { EvaluationId = 1, SupervisorId = 7 } // user 7 est superviseur
                }
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            var user = CreateUser(userId: 7); // superviseur désigné
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasSucceeded);
        }

        [Fact]
        public async Task AnonymousUser_ShouldFail()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            var evaluation = new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100,
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            };
            context.Evaluations.Add(evaluation);
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);

            // Utilisateur sans claim userId
            var user = new ClaimsPrincipal(new ClaimsIdentity());
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            // Act
            await handler.HandleAsync(authContext);

            // Assert
            Assert.True(authContext.HasFailed);
        }

        [Fact]
        public async Task PortalJwtMatchingEmployeeAndEvaluation_ShouldSucceed()
        {
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            context.Evaluations.Add(new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100,
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            });
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);
            var user = CreatePortalUser(employeeId: 100, evaluationId: 1);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "1";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            await handler.HandleAsync(authContext);

            Assert.True(authContext.HasSucceeded);
        }

        [Fact]
        public async Task PortalJwtWrongEvaluation_ShouldFail()
        {
            var dbName = Guid.NewGuid().ToString();
            await using var context = CreateDbContext(dbName);

            context.Evaluations.Add(new Evaluation
            {
                EvaluationId = 1,
                EmployeeId = 100,
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            });
            context.Evaluations.Add(new Evaluation
            {
                EvaluationId = 2,
                EmployeeId = 200,
                EvaluationTypeId = 1,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(1),
                Supervisors = new List<EvaluationSupervisors>()
            });
            await context.SaveChangesAsync();

            var mockHierarchy = CreateHierarchyMock(managerUserId: 2, managedEmployeeId: 100);
            var handler = new CanViewEvaluationHandler(context, mockHierarchy.Object);
            var user = CreatePortalUser(employeeId: 100, evaluationId: 1);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.RouteValues["id"] = "2";

            var authContext = new AuthorizationHandlerContext(
                new[] { new CanViewEvaluationRequirement() }, user, httpContext);

            await handler.HandleAsync(authContext);

            Assert.True(authContext.HasFailed);
        }

        private static ClaimsPrincipal CreatePortalUser(int employeeId, int evaluationId)
        {
            var claims = new List<Claim>
            {
                new Claim("sub", employeeId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, employeeId.ToString()),
                new Claim("evaluationId", evaluationId.ToString())
            };
            return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        }
    }
}
