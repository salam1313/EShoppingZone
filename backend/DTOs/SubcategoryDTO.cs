using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class SubcategoryDTO
    {
        [Required(ErrorMessage = "Subcategory name is required.")]
        [StringLength(100, ErrorMessage = "Subcategory name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }
    }
}