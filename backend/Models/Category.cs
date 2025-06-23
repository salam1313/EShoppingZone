using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System;

namespace EshoppingZoneAPI.Models
{
    public class Category
    {
        [Key]
        public string CategoryId { get; set; } = GenerateCategoryId();

        [Required]
        public string Name { get; set; } = string.Empty;

        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<Subcategory> Subcategories { get; set; } = new List<Subcategory>();

        private static string GenerateCategoryId()
        {
            var random = new Random();
            return $"CAT{random.Next(100000, 999999)}";
        }
    }
}
