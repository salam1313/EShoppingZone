using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using EshoppingZoneAPI.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EshoppingZoneAPI.Services.Implementations
{
    public class WalletService : IWalletService
    {
        private readonly IRepository<Wallet> _walletRepo;
        private readonly IRepository<User> _userRepo;
        private readonly AppDbContext _dbContext;

        public WalletService(IRepository<Wallet> walletRepo, IRepository<User> userRepo, AppDbContext dbContext)
        {
            _walletRepo = walletRepo;
            _userRepo = userRepo;
            _dbContext = dbContext;
        }

        public async Task<Wallet> GetWalletByUserIdAsync(string userId)
        {
            var wallet = await _walletRepo.FindAsync(w => w.UserId == userId);
            return wallet.FirstOrDefault()!;
        }

        public async Task<WalletOperationResult> AddFundsAsync(string userId, decimal amount)
        {
            if (amount <= 0)
            {
                return new WalletOperationResult
                {
                    Success = false,
                    Message = "Amount must be greater than zero.",
                    Balance = 0
                };
            }
            var wallet = await GetWalletByUserIdAsync(userId);
            if (wallet == null)
            {
                wallet = new Wallet
                {
                    UserId = userId,
                    Balance = amount
                };
                await _walletRepo.AddAsync(wallet);
            }
            else
            {
                wallet.Balance += amount;
            }
            // Add wallet transaction
            _dbContext.WalletTransactions.Add(new WalletTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = "credit",
                Description = "Added to wallet",
                Date = DateTime.UtcNow
            });
            await _walletRepo.SaveChangesAsync();
            return new WalletOperationResult
            {
                Success = true,
                Message = "Funds added successfully.",
                Balance = wallet.Balance
            };
        }
    }
}
