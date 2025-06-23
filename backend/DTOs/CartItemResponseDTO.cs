using System.Text.Json.Serialization;

namespace EshoppingZoneAPI.DTOs
{    public class CartItemResponseDTO
    {
        public string CartItemId { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; }        public decimal UnitPrice { get; set; }
        public decimal TotalPrice => UnitPrice * Quantity;
        public int CurrentStock { get; set; }

        // No validation attributes needed for response DTOs
    }
}
