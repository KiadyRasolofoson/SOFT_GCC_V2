using Moq;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Services.career_plan;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using Xunit;

namespace SoftGcc.Tests.CareerPlans;

public class CareerPlanServiceTests
{
    private static CareerPlanService CreateService(
        Mock<ICareerPlanDataService>? data = null,
        Mock<IEchelonService>? echelon = null,
        Mock<ILegalClassService>? legalClass = null,
        Mock<IIndicationService>? indication = null,
        Mock<IAssignmentTypeService>? assignmentType = null,
        Mock<IHistoryService>? history = null)
    {
        return new CareerPlanService(
            new Mock<IGenericRepository<CareerPlan>>().Object,
            data?.Object ?? new Mock<ICareerPlanDataService>().Object,
            echelon?.Object ?? new Mock<IEchelonService>().Object,
            legalClass?.Object ?? new Mock<ILegalClassService>().Object,
            indication?.Object ?? new Mock<IIndicationService>().Object,
            assignmentType?.Object ?? new Mock<IAssignmentTypeService>().Object,
            history?.Object ?? new Mock<IHistoryService>().Object);
    }

    [Fact]
    public async Task Validate_WhenDecisionDateAfterAssignment_ThrowsValidationException()
    {
        var service = CreateService();
        var plan = new CareerPlan
        {
            AssignmentTypeId = 1,
            DecisionDate = new DateTime(2026, 2, 1),
            AssignmentDate = new DateTime(2026, 1, 15)
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.ValidateAsync(plan));
        Assert.Contains("date de décision", ex.Message);
    }

    [Fact]
    public async Task Validate_WhenEchelonDoesNotMatchIndice_ThrowsValidationException()
    {
        var echelon = new Mock<IEchelonService>();
        echelon.Setup(e => e.GetById(7)).ReturnsAsync(new Echelon { EchelonId = 7, IndicationId = 20 });

        var service = CreateService(echelon: echelon);
        var plan = new CareerPlan
        {
            AssignmentTypeId = 1,
            EchelonId = 7,
            IndicationId = 21
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.ValidateAsync(plan));
        Assert.Contains("ne correspond pas à l'indice", ex.Message);
    }

    [Fact]
    public async Task Validate_WhenEchelonMatchesIndice_Passes()
    {
        var echelon = new Mock<IEchelonService>();
        echelon.Setup(e => e.GetById(7)).ReturnsAsync(new Echelon { EchelonId = 7, IndicationId = 21 });

        var service = CreateService(echelon: echelon);
        var plan = new CareerPlan
        {
            AssignmentTypeId = 1,
            EchelonId = 7,
            IndicationId = 21
        };

        await service.ValidateAsync(plan); // ne doit pas lever
    }

    [Fact]
    public async Task Validate_WhenSalaryBelowClassMinimum_ThrowsValidationException()
    {
        var legalClass = new Mock<ILegalClassService>();
        legalClass.Setup(l => l.GetById(3)).ReturnsAsync(new LegalClass { LegalClassId = 3, MinSalary = 2000m });

        var service = CreateService(legalClass: legalClass);
        var plan = new CareerPlan
        {
            AssignmentTypeId = 1,
            LegalClassId = 3,
            BaseSalary = 1500
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.ValidateAsync(plan));
        Assert.Contains("inférieur au minimum", ex.Message);
    }

    [Fact]
    public async Task Validate_WhenAdvancementIndiceNotStrictlyGreater_ThrowsValidationException()
    {
        var data = new Mock<ICareerPlanDataService>();
        data.Setup(d => d.GetLastCareerPlanByEmployee("EMP1")).ReturnsAsync(new CareerPlan
        {
            CareerPlanId = 1,
            RegistrationNumber = "EMP1",
            State = 1,
            IndicationId = 10
        });

        var indication = new Mock<IIndicationService>();
        indication.Setup(i => i.GetById(10)).ReturnsAsync(new Indication { IndicationId = 10, IndicationValue = 2500m });
        indication.Setup(i => i.GetById(11)).ReturnsAsync(new Indication { IndicationId = 11, IndicationValue = 2500m });

        var service = CreateService(data: data, indication: indication);
        var plan = new CareerPlan
        {
            AssignmentTypeId = 3, // Avancement
            RegistrationNumber = "EMP1",
            IndicationId = 11
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.ValidateAsync(plan));
        Assert.Contains("strictement supérieur", ex.Message);
    }

    [Fact]
    public async Task Validate_WhenAdvancementIndiceGreater_Passes()
    {
        var data = new Mock<ICareerPlanDataService>();
        data.Setup(d => d.GetLastCareerPlanByEmployee("EMP1")).ReturnsAsync(new CareerPlan
        {
            CareerPlanId = 1,
            RegistrationNumber = "EMP1",
            State = 1,
            IndicationId = 10
        });

        var indication = new Mock<IIndicationService>();
        indication.Setup(i => i.GetById(10)).ReturnsAsync(new Indication { IndicationId = 10, IndicationValue = 2500m });
        indication.Setup(i => i.GetById(11)).ReturnsAsync(new Indication { IndicationId = 11, IndicationValue = 2600m });

        var service = CreateService(data: data, indication: indication);
        var plan = new CareerPlan
        {
            AssignmentTypeId = 3,
            RegistrationNumber = "EMP1",
            IndicationId = 11
        };

        await service.ValidateAsync(plan); // ne doit pas lever
    }

    [Fact]
    public async Task Validate_WhenLastPlanIsThePlanBeingUpdated_SkipsProgressionRule()
    {
        var data = new Mock<ICareerPlanDataService>();
        data.Setup(d => d.GetLastCareerPlanByEmployee("EMP1")).ReturnsAsync(new CareerPlan
        {
            CareerPlanId = 5,
            RegistrationNumber = "EMP1",
            State = 1,
            IndicationId = 10
        });

        var service = CreateService(data: data);
        var plan = new CareerPlan
        {
            CareerPlanId = 5, // même plan (mise à jour)
            AssignmentTypeId = 3,
            RegistrationNumber = "EMP1",
            IndicationId = 10
        };

        await service.ValidateAsync(plan); // ne doit pas lever (aucun appel GetById d'indication)
    }

    [Fact]
    public async Task CloseActivePlans_DelegatesToDataService()
    {
        var data = new Mock<ICareerPlanDataService>();
        var ending = new DateTime(2026, 8, 27);
        data.Setup(d => d.CloseActivePlansAsync("EMP1", ending)).ReturnsAsync(2);

        var service = CreateService(data: data);
        var affected = await service.CloseActivePlansAsync("EMP1", ending);

        Assert.Equal(2, affected);
        data.Verify(d => d.CloseActivePlansAsync("EMP1", ending), Times.Once);
    }

    [Fact]
    public async Task Create_WhenPlanNull_ThrowsValidationException()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(null!));
    }

    [Fact]
    public async Task Create_WhenAssignmentTypeMissing_ThrowsNotFoundException()
    {
        var assignmentType = new Mock<IAssignmentTypeService>();
        assignmentType.Setup(a => a.GetById(9)).ReturnsAsync((AssignmentType)null!);

        var service = CreateService(assignmentType: assignmentType);
        var plan = new CareerPlan { AssignmentTypeId = 9, RegistrationNumber = "EMP1" };

        await Assert.ThrowsAsync<NotFoundException>(() => service.CreateAsync(plan));
    }

    [Fact]
    public async Task Create_WhenValid_ClosesPlansAddsAndLogs()
    {
        var data = new Mock<ICareerPlanDataService>();
        var assignmentType = new Mock<IAssignmentTypeService>();
        assignmentType.Setup(a => a.GetById(1)).ReturnsAsync(new AssignmentType { AssignmentTypeId = 1, AssignmentTypeName = "Nomination" });
        var history = new Mock<IHistoryService>();
        var repository = new Mock<IGenericRepository<CareerPlan>>();

        var service = new CareerPlanService(
            repository.Object,
            data.Object,
            new Mock<IEchelonService>().Object,
            new Mock<ILegalClassService>().Object,
            new Mock<IIndicationService>().Object,
            assignmentType.Object,
            history.Object);

        var assignmentDate = new DateTime(2026, 8, 27);
        var plan = new CareerPlan { AssignmentTypeId = 1, RegistrationNumber = "EMP1", AssignmentDate = assignmentDate };

        var created = await service.CreateAsync(plan, "127.0.0.1");

        Assert.Equal("EMP1", created.RegistrationNumber);
        data.Verify(d => d.CloseActivePlansAsync("EMP1", assignmentDate), Times.Once);
        repository.Verify(r => r.Add(plan), Times.Once);
        history.Verify(h => h.Add(It.IsAny<ActivityLog>()), Times.Once);
    }

    [Fact]
    public async Task Update_WhenValid_UpdatesAndLogs()
    {
        var assignmentType = new Mock<IAssignmentTypeService>();
        assignmentType.Setup(a => a.GetById(1)).ReturnsAsync(new AssignmentType { AssignmentTypeId = 1, AssignmentTypeName = "Nomination" });
        var history = new Mock<IHistoryService>();
        var repository = new Mock<IGenericRepository<CareerPlan>>();

        var service = new CareerPlanService(
            repository.Object,
            new Mock<ICareerPlanDataService>().Object,
            new Mock<IEchelonService>().Object,
            new Mock<ILegalClassService>().Object,
            new Mock<IIndicationService>().Object,
            assignmentType.Object,
            history.Object);

        var plan = new CareerPlan { CareerPlanId = 5, AssignmentTypeId = 1, RegistrationNumber = "EMP1" };

        await service.UpdateAsync(plan, "127.0.0.1");

        repository.Verify(r => r.Update(plan), Times.Once);
        history.Verify(h => h.Add(It.IsAny<ActivityLog>()), Times.Once);
    }
}
