using System;

namespace EshoppingZoneAPI.Models
{
    public class WalletTransaction
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty; // "credit" or "debit"
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
