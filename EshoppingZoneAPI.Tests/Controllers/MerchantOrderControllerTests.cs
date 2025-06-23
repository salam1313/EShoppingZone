using Xunit;
using Microsoft.AspNetCore.Mvc;
using Moq;
using EshoppingZoneAPI.Controllers;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace EshoppingZoneAPI.Tests.Controllers
{
    public class MerchantOrderControllerTests
    {
        private MerchantOrderController GetControllerWithContext(AppDbContext dbContext, string merchantId)
        {
            var controller = new MerchantOrderController(dbContext);
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, merchantId)
            }, "mock"));
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
            return controller;
        }

        [Fact]
        public async Task UpdateOrderStatus_ReturnsBadRequest_IfOrderAlreadyCancelled()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb1").Options;
            using var dbContext = new AppDbContext(options);
            var merchantId = "merchant1";
            var order = new Order { OrderId = "order1", Status = "Cancelled", OrderItems = new List<OrderItem> { new OrderItem { Product = new Product { MerchantId = merchantId } } } };
            dbContext.Orders.Add(order);
            dbContext.SaveChanges();
            var controller = GetControllerWithContext(dbContext, merchantId);
            var dto = new MerchantOrderDTO { OrderId = "order1", Status = "Pending" };

            // Act
            var result = await controller.UpdateOrderStatus(dto);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("already 'Cancelled'", badRequest.Value.ToString());
        }

        [Fact]
        public async Task UpdateOrderStatus_ReturnsForbid_IfMerchantDoesNotOwnOrder()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb2").Options;
            using var dbContext = new AppDbContext(options);
            var merchantId = "merchant1";
            var order = new Order { OrderId = "order2", Status = "Pending", OrderItems = new List<OrderItem> { new OrderItem { Product = new Product { MerchantId = "otherMerchant" } } } };
            dbContext.Orders.Add(order);
            dbContext.SaveChanges();
            var controller = GetControllerWithContext(dbContext, merchantId);
            var dto = new MerchantOrderDTO { OrderId = "order2", Status = "Delivered" };

            // Act
            var result = await controller.UpdateOrderStatus(dto);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UpdateOrderStatus_ReturnsBadRequest_IfStatusIsInvalid()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb3").Options;
            using var dbContext = new AppDbContext(options);
            var merchantId = "merchant1";
            var order = new Order { OrderId = "order3", Status = "Pending", OrderItems = new List<OrderItem> { new OrderItem { Product = new Product { MerchantId = merchantId } } } };
            dbContext.Orders.Add(order);
            dbContext.SaveChanges();
            var controller = GetControllerWithContext(dbContext, merchantId);
            var dto = new MerchantOrderDTO { OrderId = "order3", Status = "NotARealStatus" };

            // Act
            var result = await controller.UpdateOrderStatus(dto);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("invalid", badRequest.Value.ToString(), System.StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task UpdateOrderStatus_Succeeds_IfMerchantOwnsOrderAndStatusIsValid()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb4").Options;
            using var dbContext = new AppDbContext(options);
            var merchantId = "merchant1";
            var order = new Order { OrderId = "order4", Status = "Pending", OrderItems = new List<OrderItem> { new OrderItem { Product = new Product { MerchantId = merchantId } } } };
            dbContext.Orders.Add(order);
            dbContext.SaveChanges();
            var controller = GetControllerWithContext(dbContext, merchantId);
            var dto = new MerchantOrderDTO { OrderId = "order4", Status = "Delivered" };

            // Act
            var result = await controller.UpdateOrderStatus(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Contains("updated", okResult.Value.ToString(), System.StringComparison.OrdinalIgnoreCase);
        }
    }
}
