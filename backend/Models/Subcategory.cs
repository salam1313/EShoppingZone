namespace EshoppingZoneAPI.Models
{
    public class Subcategory
    {
        public string SubcategoryId { get; set; } = GenerateSubcategoryId();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CategoryId { get; set; } = string.Empty;
        public Category? Category { get; set; }

        // Add navigation property for products
        public ICollection<Product> Products { get; set; } = new List<Product>();

        // Add default available sizes and colors for filtering
        public List<string>? AvailableSizes { get; set; } // e.g. ["XS", "S", "M", "L", "XL"]
        public List<string>? AvailableColors { get; set; } // e.g. ["Red", "Blue", "Black"]

        private static string GenerateSubcategoryId()
        {
            var random = new Random();
            return $"SUB{random.Next(100000, 999999)}";
        }
    }
}
