using System;

namespace EshoppingZoneAPI.DTOs
{
    public class WalletTransactionDTO
    {
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty; // "credit" or "debit"
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
