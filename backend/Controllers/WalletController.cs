using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EshoppingZoneAPI.Services.Interfaces;
using EshoppingZoneAPI.DTOs;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Controllers
{
    [Route("api/wallet")]
    [ApiController]
    // [Authorize(Roles = "User")] // Temporarily comment this out
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly AppDbContext _context;

        public WalletController(IWalletService walletService, AppDbContext context)
        {
            _walletService = walletService;
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            try
            {
                var userId = GetUserId();
                var wallet = await _walletService.GetWalletByUserIdAsync(userId);
                var balance = wallet?.Balance ?? 0m;
                return Ok(new { Balance = balance });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Balance = 0m, error = ex.Message });
            }
        }

        [HttpPost("add-funds")]
        public async Task<IActionResult> AddFunds([FromBody] AddFundsDTO addFundsDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            try
            {
                if (addFundsDto.Amount <= 0)
                    return BadRequest("Amount must be greater than 0");

                var userId = GetUserId();
                var result = await _walletService.AddFundsAsync(userId, addFundsDto.Amount);
                if (!result.Success)
                    return BadRequest(new { message = result.Message });
                return Ok(new { message = result.Message, newBalance = result.Balance });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        [HttpPost("pay")]
        public async Task<IActionResult> Pay([FromBody] PayWithWalletDTO payDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            try
            {
                var userId = GetUserId();
                var wallet = await _walletService.GetWalletByUserIdAsync(userId);
                if (wallet == null || wallet.Balance < payDto.Amount)
                {
                    return BadRequest(new { message = "Not enough funds in wallet" });
                }
                wallet.Balance -= payDto.Amount;
                // Add wallet transaction for payment
                _context.WalletTransactions.Add(new WalletTransaction
                {
                    UserId = userId,
                    Amount = payDto.Amount,
                    Type = "debit",
                    Description = "Payment from wallet",
                    Date = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Ok(new { message = "Payment successful", newBalance = wallet.Balance });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetRecentTransactions()
        {
            try
            {
                var userId = GetUserId();
                var transactions = await _context.WalletTransactions
                    .Where(t => t.UserId == userId)
                    .OrderByDescending(t => t.Date)
                    .Take(20)
                    .Select(t => new WalletTransactionDTO
                    {
                        Amount = t.Amount,
                        Type = t.Type,
                        Description = t.Description,
                        Date = t.Date
                    })
                    .ToListAsync();
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred", error = ex.Message });
            }
        }
    }

    public class AddFundsDTO
    {
        public decimal Amount { get; set; }
    }

    public class PayWithWalletDTO
    {
        public decimal Amount { get; set; }
    }

    public class WalletTransactionDTO
    {
        public decimal Amount { get; set; }
        public string Type { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime Date { get; set; }
    }
}
