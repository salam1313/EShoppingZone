using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Services.Interfaces;

namespace EshoppingZoneAPI.Controllers
{
    [Route("api/cart")]
    [ApiController]
    [Authorize(Roles = "User")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserCart()
        {
            var cart = await _cartService.GetUserCartAsync(GetUserId());
            return Ok(cart);
        }        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] CartItemDTO cartItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            try
            {
                var results = await _cartService.AddToCartAsync(GetUserId(), cartItemDto.Items);
                return Ok(new { items = results });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateCartItems([FromBody] CartItemUpdateDTO cartItemUpdateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            try
            {
                var updated = await _cartService.UpdateCartItemsAsync(GetUserId(), cartItemUpdateDto.Items);
                if (updated == null) return NotFound(new { message = "Cart items not found" });
                return Ok(updated);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(string cartItemId)
        {
            var removed = await _cartService.RemoveFromCartAsync(GetUserId(), cartItemId);
            if (!removed) return NotFound(new { message = "Cart item not found" });
            return Ok(new { message = "Item removed from cart" });
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            await _cartService.ClearCartAsync(GetUserId());
            return Ok(new { message = "Cart cleared" });
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetCartItemCount()
        {
            var count = await _cartService.GetCartItemCountAsync(GetUserId());
            return Ok(new { count });
        }
    }
}
