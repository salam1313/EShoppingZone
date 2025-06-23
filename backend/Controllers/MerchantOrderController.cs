using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.DTOs;
using System.Security.Claims;

namespace EshoppingZoneAPI.Controllers
{
    [ApiController]
    [Route("api/m/order")]
    [Authorize]
    public class MerchantOrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantOrderController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MerchantOrderDTO>>> GetMyOrders()
        {
            try
            {
                var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(merchantId))
                {
                    return Unauthorized("Merchant ID not found");
                }                // Get all orders that contain ONLY products from this merchant
                var orders = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.OrderItems!)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.OrderItems!.Count > 0 && o.OrderItems!.All(oi => oi.Product!.MerchantId == merchantId))
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                var merchantOrders = orders.Select(order => new MerchantOrderDTO
                {
                    OrderId = order.OrderId,
                    UserId = order.UserId,
                    UserName = order.User?.Name ?? "Unknown",
                    OrderDate = order.OrderDate,
                    PaymentMethod = order.PaymentMethod,
                    TotalAmount = order.OrderItems?.Where(oi => oi.Product?.MerchantId == merchantId).Sum(oi => oi.UnitPrice * oi.Quantity) ?? 0,
                    Status = order.Status,
                    FullName = order.FullName,
                    AddressLine1 = order.AddressLine1,
                    AddressLine2 = order.AddressLine2,
                    City = order.City,
                    State = order.State,
                    ZipCode = order.ZipCode,
                    Country = order.Country,
                    Phone = order.Phone,
                    OrderItems = order.OrderItems?
                        .Where(oi => oi.Product?.MerchantId == merchantId)
                        .Select(oi => new MerchantOrderItemDTO
                        {
                            ProductId = oi.ProductId,
                            ProductName = oi.Product?.Name ?? "Unknown Product",
                            ProductVariantId = null, // Not available in current OrderItem model
                            Quantity = oi.Quantity,
                            Price = oi.UnitPrice,
                            TotalPrice = oi.UnitPrice * oi.Quantity,
                            VariantDetails = null // Not available in current OrderItem model
                        }).ToList() ?? new List<MerchantOrderItemDTO>()
                }).ToList();

                return Ok(merchantOrders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching orders", error = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateOrderStatus([FromBody] MerchantOrderDTO merchantOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            try
            {
                var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(merchantId))
                {
                    return Unauthorized("Merchant ID not found");
                }

                // Validate status
                var validStatuses = new[] { "Pending", "Ready to Dispatch", "In Transit", "Delivered", "Cancelled" };
                if (!validStatuses.Contains(merchantOrderDto.Status))
                {
                    return BadRequest("Invalid status value");
                }

                var order = await _context.Orders
                    .Include(o => o.OrderItems!)
                        .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == merchantOrderDto.OrderId);

                if (order == null)
                {
                    return NotFound("Order not found");
                }
                // Check if merchant owns at least one product in this order
                var hasPermission = order.OrderItems?.Any(oi => oi.Product?.MerchantId == merchantId) ?? false;
                if (!hasPermission)
                {
                    return Forbid("You don't have permission to update this order");
                }

                // Prevent status change if already Cancelled
                if (order.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Order status is already 'Cancelled' and cannot be changed." });
                }

                order.Status = merchantOrderDto.Status;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Order status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating order status", error = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<ActionResult<OrdersSummaryDTO>> GetOrdersSummary()
        {
            try
            {
                var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(merchantId))
                {
                    return Unauthorized("Merchant ID not found");
                }

                var orders = await _context.Orders
                    .Include(o => o.OrderItems!)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.OrderItems!.Any(oi => oi.Product!.MerchantId == merchantId))
                    .ToListAsync();

                var summary = new OrdersSummaryDTO
                {
                    TotalOrders = orders.Count,
                    PendingOrders = orders.Count(o => o.Status == "Pending"),
                    ReadyToDispatchOrders = orders.Count(o => o.Status == "Ready to Dispatch"),
                    InTransitOrders = orders.Count(o => o.Status == "In Transit"),
                    DeliveredOrders = orders.Count(o => o.Status == "Delivered"),
                    CancelledOrders = orders.Count(o => o.Status == "Cancelled"),
                    TotalRevenue = orders.Sum(o => o.OrderItems?
                        .Where(oi => oi.Product?.MerchantId == merchantId)
                        .Sum(oi => oi.UnitPrice * oi.Quantity) ?? 0)
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching orders summary", error = ex.Message });
            }
        }

        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<MerchantOrderDTO>>> GetRecentOrders()
        {
            try
            {
                var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(merchantId))
                {
                    return Unauthorized("Merchant ID not found");
                }

                var recentOrders = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.OrderItems!)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.OrderItems!.Any(oi => oi.Product!.MerchantId == merchantId))
                    .OrderByDescending(o => o.OrderDate)
                    .Take(5)
                    .ToListAsync();

                var merchantOrders = recentOrders.Select(order => new MerchantOrderDTO
                {
                    OrderId = order.OrderId,
                    UserId = order.UserId,
                    UserName = order.User?.Name ?? "Unknown",
                    OrderDate = order.OrderDate,
                    PaymentMethod = order.PaymentMethod,
                    TotalAmount = order.OrderItems?.Where(oi => oi.Product?.MerchantId == merchantId).Sum(oi => oi.UnitPrice * oi.Quantity) ?? 0,
                    Status = order.Status,
                    FullName = order.FullName,
                    AddressLine1 = order.AddressLine1,
                    AddressLine2 = order.AddressLine2,
                    City = order.City,
                    State = order.State,
                    ZipCode = order.ZipCode,
                    Country = order.Country,
                    Phone = order.Phone,
                    OrderItems = order.OrderItems?
                        .Where(oi => oi.Product?.MerchantId == merchantId)
                        .Select(oi => new MerchantOrderItemDTO
                        {
                            ProductId = oi.ProductId,
                            ProductName = oi.Product?.Name ?? "Unknown Product",
                            ProductVariantId = null, // Not available in current OrderItem model
                            Quantity = oi.Quantity,
                            Price = oi.UnitPrice,
                            TotalPrice = oi.UnitPrice * oi.Quantity,
                            VariantDetails = null // Not available in current OrderItem model
                        }).ToList() ?? new List<MerchantOrderItemDTO>()
                }).ToList();

                return Ok(merchantOrders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching recent orders", error = ex.Message });
            }
        }

        // Prevent merchants from accessing wallet endpoints
        [NonAction]
        public IActionResult Wallet()
        {
            return Forbid("Merchants are not allowed to access wallet functionality.");
        }
    }
}
