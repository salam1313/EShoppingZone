namespace EshoppingZoneAPI.DTOs
{
    public class OrderResponseDTO
    {
        public string OrderId { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public List<OrderItemDTO> Items { get; set; } = new();
        public string? Message { get; set; }
    }

    public class OrderItemDTO
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    // No validation attributes needed for response DTOs
}
