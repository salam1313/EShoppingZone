using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EshoppingZoneAPI.Models
{
    public class Order
    {
        [Key]
        public string OrderId { get; set; } = GenerateOrderId();

        [ForeignKey("User")]
        public string UserId { get; set; } = string.Empty;
        public User? User { get; set; }

        public DateTime OrderDate { get; set; }

        public string PaymentMethod { get; set; } = "COD"; // Default
        public decimal TotalAmount { get; set; }

        public string Status { get; set; } = "Pending";

        public ICollection<OrderItem>? OrderItems { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string AddressLine1 { get; set; } = string.Empty;
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        private static string GenerateOrderId()
        {
            var random = new Random();
            return $"ORD{random.Next(100000, 999999)}";
        }
    }
}
