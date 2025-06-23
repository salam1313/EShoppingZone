using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace EshoppingZoneAPI.Models
{
    public class ProductVariant
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Product")]
        public string ProductId { get; set; } = string.Empty;
        public Product Product { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }

        // Dynamic attributes for the variant (color, size, RAM, etc.)
        public string? AttributesJson { get; set; }

        [NotMapped]
        public Dictionary<string, string>? Attributes
        {
            get => string.IsNullOrEmpty(AttributesJson)
                ? new Dictionary<string, string>()
                : JsonSerializer.Deserialize<Dictionary<string, string>>(AttributesJson);
            set => AttributesJson = JsonSerializer.Serialize(value);
        }
    }
}
