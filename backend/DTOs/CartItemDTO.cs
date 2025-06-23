using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class CartItemDTO
    {
        [MinLength(1, ErrorMessage = "At least one cart item is required.")]
        public List<CartItemAdd> Items { get; set; } = new();
    }
    public class CartItemAdd
    {
        [Required(ErrorMessage = "Product ID is required.")]
        public string ProductId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, 1000000, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        public List<int>? VariantIds { get; set; }
    }
}
