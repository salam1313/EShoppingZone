using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Services.Interfaces
{    public interface ICartService
    {
        Task<List<CartItemResponseDTO>> AddToCartAsync(string userId, List<CartItemAdd> items);
        Task<List<CartItemResponseDTO>> GetUserCartAsync(string userId);
        Task<bool> RemoveFromCartAsync(string userId, string cartItemId);
        Task<List<CartItemResponseDTO>> UpdateCartItemsAsync(string userId, List<CartItemBulkUpdate> items);
        Task ClearCartAsync(string userId);
        Task<int> GetCartItemCountAsync(string userId);
    }
}
