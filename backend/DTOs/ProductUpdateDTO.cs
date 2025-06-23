using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class ProductUpdateDTO
    {
        [StringLength(100, ErrorMessage = "Product name cannot exceed 100 characters.")]
        public string? Name { get; set; }

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        [Range(0.01, 1000000, ErrorMessage = "Price must be greater than 0.")]
        public decimal? Price { get; set; }

        [Range(0, 1000000, ErrorMessage = "Quantity cannot be negative.")]
        public int? Quantity { get; set; }

        public string? CategoryId { get; set; }
        public string? SubcategoryId { get; set; }

        [StringLength(500, ErrorMessage = "Main image URL cannot exceed 500 characters.")]
        public string? MainImageUrl { get; set; }

        public List<string>? ImageUrls { get; set; }
        public List<ProductVariantDTO>? Variants { get; set; }
    }

    public class UpdateQuantityDTO
    {
        public int Quantity { get; set; }
    }
}
