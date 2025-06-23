using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class CartItemUpdateDTO
    {
        [MinLength(1, ErrorMessage = "At least one cart item update is required.")]
        public List<CartItemBulkUpdate> Items { get; set; } = new();
    }
    public class CartItemBulkUpdate
    {
        [Required(ErrorMessage = "Cart item ID is required.")]
        public string CartItemId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, 1000000, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        public int? NewVariantId { get; set; }
    }
}
