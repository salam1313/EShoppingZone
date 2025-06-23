using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Services.Interfaces
{
    public interface IWalletService
    {
        Task<Wallet> GetWalletByUserIdAsync(string userId);
        Task<WalletOperationResult> AddFundsAsync(string userId, decimal amount);
    }
}
