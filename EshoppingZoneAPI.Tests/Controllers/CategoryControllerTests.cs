using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using EshoppingZoneAPI.Controllers;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using System.Collections.Generic;

namespace EshoppingZoneAPI.Tests.Controllers
{
    [TestFixture]
    public class CategoryControllerTests
    {
        private CategoryController _controller;
        private Mock<IRepository<Category>> _categoryRepoMock;
        private AppDbContext _dbContext;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;
            _dbContext = new AppDbContext(options);
            _categoryRepoMock = new Mock<IRepository<Category>>();
            _controller = new CategoryController(_dbContext, _categoryRepoMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Test]
        public async Task AddCategory_ValidModel_ReturnsOk()
        {
            var dto = new CategoryDTO { Name = "Electronics" };
            _categoryRepoMock.Setup(r => r.AddAsync(It.IsAny<Category>())).Returns(Task.CompletedTask);
            _categoryRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _controller.AddCategory(dto);

            Assert.IsInstanceOf<OkObjectResult>(result);
        }

        [Test]
        public async Task AddCategory_InvalidModel_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Name", "Required");
            var dto = new CategoryDTO { Name = "" };

            var result = await _controller.AddCategory(dto);

            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        public async Task GetAll_ReturnsAllCategories()
        {
            _dbContext.Categories.Add(new Category { Name = "Books" });
            _dbContext.Categories.Add(new Category { Name = "Clothes" });
            _dbContext.SaveChanges();

            var result = await _controller.GetAll();

            Assert.IsInstanceOf<OkObjectResult>(result);
            var okResult = result as OkObjectResult;
            Assert.IsNotNull(okResult);
        }

        [Test]
        public async Task GetCategory_NotFound_ReturnsNotFound()
        {
            var result = await _controller.GetCategory("nonexistent");
            Assert.IsInstanceOf<NotFoundObjectResult>(result);
        }
    }
}
