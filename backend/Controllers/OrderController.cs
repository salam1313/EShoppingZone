using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EshoppingZoneAPI.Controllers
{
    [Route("api/order")]
    [ApiController]
    [Authorize(Roles = "User")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDTO dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new { message = "Validation failed", errors });
            }
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var order = await _orderService.PlaceOrderAsync(userId, dto);
            if (string.IsNullOrEmpty(order.OrderId))
            {
                return BadRequest(new { message = order.Message ?? "Order could not be placed.", code =
                    order.Message?.Contains("wallet", System.StringComparison.OrdinalIgnoreCase) == true ? "WALLET_ERROR" :
                    order.Message?.Contains("cart", System.StringComparison.OrdinalIgnoreCase) == true ? "CART_ERROR" :
                    order.Message?.Contains("stock", System.StringComparison.OrdinalIgnoreCase) == true ? "STOCK_ERROR" :
                    order.Message?.Contains("Product not found", System.StringComparison.OrdinalIgnoreCase) == true ? "PRODUCT_ERROR" :
                    "ORDER_ERROR"
                });
            }
            return Ok(new { message = "Order placed successfully", order });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetOrderHistory()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var orders = await _orderService.GetOrderHistoryAsync(userId);
            return Ok(orders);
        }

        [HttpPost("cancel/{orderId}")]
        public async Task<IActionResult> CancelOrder(string orderId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _orderService.CancelOrderAsync(userId, orderId);
            
            if (!result)
            {
                return BadRequest(new { message = "Order cannot be cancelled. It may not exist, belong to you, or is already in transit/delivered/cancelled." });
            }
            
            return Ok(new { message = "Order cancelled successfully" });
        }
    }
}
