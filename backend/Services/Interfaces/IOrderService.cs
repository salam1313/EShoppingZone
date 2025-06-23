using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDTO> PlaceOrderAsync(string userId, CheckoutDTO dto);
        Task<List<OrderHistoryDTO>> GetOrderHistoryAsync(string userId);
        Task<bool> CancelOrderAsync(string userId, string orderId);
    }
}
