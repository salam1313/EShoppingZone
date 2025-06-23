namespace EshoppingZoneAPI.DTOs
{
    public class WalletOperationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal Balance { get; set; }
    }
}

// No validation attributes needed for result DTOs
