namespace EshoppingZoneAPI.Models
{
    public class OrderItem
    {
        public string OrderItemId { get; set; } = GenerateOrderItemId();
        public string OrderId { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty; // Now string
        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; } // ✅ Required for pricing

        public Order Order { get; set; } = null!;
        public Product Product { get; set; } = null!;

        private static string GenerateOrderItemId()
        {
            var random = new Random();
            return $"ITEM{random.Next(100000, 999999)}";
        }
    }
}
