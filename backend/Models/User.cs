public class User
{
    public string UserId { get; set; } = GenerateUserId();
    public string Name { get; set; } = string.Empty; // Changed from Username to Name
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    // public decimal? Balance { get; set; } = 0; // Commented out temporarily

    // Navigation
    public Wallet? Wallet { get; set; }

    private static string GenerateUserId()
    {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var id = new char[9];
        for (int i = 0; i < 9; i++)
            id[i] = chars[random.Next(chars.Length)];
        return new string(id);
    }
}
