using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;
using System.Collections.Generic;

namespace EshoppingZoneAPI.Models
{
    public class Product
    {
        [Key]
        public string ProductId { get; set; } = GenerateProductId();

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public decimal Price { get; set; }        [Required]
        public int Quantity { get; set; }

        [ForeignKey("Category")]
        public string CategoryId { get; set; } = string.Empty;
        public Category? Category { get; set; }        [ForeignKey("Merchant")]
        public string MerchantId { get; set; } = string.Empty;
        public User? Merchant { get; set; }

        // Add SubcategoryId for product-subcategory relation
        public string? SubcategoryId { get; set; }

        public string? MainImageUrl { get; set; } // Mandatory main image
        public List<string>? ImageUrls { get; set; } // Optional additional images

        public string? ParentProductId { get; set; } // For variants, points to main product
        // Remove legacy Color and Size fields (now handled in Attributes for variants)
        // public string? Color { get; set; }
        // public string? Size { get; set; }

        // Remove AttributesJson and Attributes from Product
        // Add Variants navigation property
        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

        private static string GenerateProductId()
        {
            var random = new Random();
            return $"PRO{random.Next(100000, 999999)}";
        }
    }
}
