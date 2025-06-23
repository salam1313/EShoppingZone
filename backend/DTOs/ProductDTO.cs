using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class ProductDTO
    {
        [Required(ErrorMessage = "Product name is required.")]
        [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Price is required.")]
        [Range(0.01, 1000000, ErrorMessage = "Price must be greater than 0.")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Category is required.")]
        public string CategoryId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subcategory is required.")]
        public string SubcategoryId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Main image URL is required.")]
        [StringLength(500, ErrorMessage = "Main image URL cannot exceed 500 characters.")]
        public string MainImageUrl { get; set; } = string.Empty;

        public List<string>? ImageUrls { get; set; }

        public List<ProductVariantDTO> Variants { get; set; } = new();

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(0, 1000000, ErrorMessage = "Quantity cannot be negative.")]
        public int Quantity { get; set; }
    }

    public class ProductVariantDTO
    {
        [Required(ErrorMessage = "Variant quantity is required.")]
        [Range(0, 1000000, ErrorMessage = "Quantity cannot be negative.")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Variant price is required.")]
        [Range(0.01, 1000000, ErrorMessage = "Price must be greater than 0.")]
        public decimal Price { get; set; }

        public Dictionary<string, string>? Attributes { get; set; }
    }
}
