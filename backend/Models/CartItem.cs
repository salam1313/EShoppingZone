using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EshoppingZoneAPI.Models
{
    public class CartItem
    {
        [Key]
        public string CartItemId { get; set; } = GenerateCartItemId();

        [ForeignKey("User")]
        public string UserId { get; set; } = string.Empty;
        public User? User { get; set; }

        [ForeignKey("Product")]
        public string ProductId { get; set; } = string.Empty;
        public Product? Product { get; set; }

        // Add relationship to ProductVariant
        [ForeignKey("ProductVariant")]
        public int? ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }
        
        public int Quantity { get; set; }

        private static string GenerateCartItemId()
        {
            return $"CART{new Random().Next(100000, 999999)}";
        }
    }
}
