public class Wallet
{
    public int WalletId { get; set; }
    public decimal Balance { get; set; }
    
    // Foreign Key
    public string UserId { get; set; } = string.Empty;

    // Navigation Property
    public User User { get; set; } = null!;
}
