using SoftGcc.Application.Common;

using Xunit;

namespace SoftGcc.Tests.Common
{
    /// <summary>
    /// Tests unitaires de la normalisation des paramètres de pagination : c'est le garde-fou
    /// qui empêche un client de réclamer une page démesurée.
    /// </summary>
    public class PageRequestTests
    {
        [Fact]
        public void Create_ValidValues_KeepsThemUnchanged()
        {
            // Arrange
            const int pageNumber = 3;
            const int pageSize = 25;

            // Act
            var page = PageRequest.Create(pageNumber, pageSize);

            // Assert
            Assert.Equal(pageNumber, page.PageNumber);
            Assert.Equal(pageSize, page.PageSize);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public void Create_PageNumberBelowOne_FallsBackToFirstPage(int pageNumber)
        {
            // Arrange
            const int pageSize = 10;

            // Act
            var page = PageRequest.Create(pageNumber, pageSize);

            // Assert
            Assert.Equal(1, page.PageNumber);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Create_PageSizeBelowOne_FallsBackToDefaultPageSize(int pageSize)
        {
            // Arrange
            const int pageNumber = 1;

            // Act
            var page = PageRequest.Create(pageNumber, pageSize);

            // Assert
            Assert.Equal(PageRequest.DefaultPageSize, page.PageSize);
        }

        [Fact]
        public void Create_PageSizeAboveMaximum_ClampsToMaximum()
        {
            // Arrange
            const int oversizedPageSize = 5_000;

            // Act
            var page = PageRequest.Create(pageNumber: 1, oversizedPageSize);

            // Assert
            Assert.Equal(PageRequest.MaxPageSize, page.PageSize);
        }

        [Fact]
        public void Create_NullItems_ProducesEmptyPageInsteadOfNullCollection()
        {
            // Arrange
            var page = PageRequest.Create(pageNumber: 1, pageSize: 10);

            // Act
            var result = PagedResult<string>.Create(items: null, page, totalPages: 0);

            // Assert
            Assert.NotNull(result.Items);
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalItems);
        }
    }
}
