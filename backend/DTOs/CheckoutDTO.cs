using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class CheckoutDTO
    {
        [Required(ErrorMessage = "Payment method is required.")]
        // TODO: Restrict to allowed values (e.g., "COD", "CARD") in controller or use a custom attribute
        public string PaymentMethod { get; set; } = "COD";

        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
        [RegularExpression(@"^[a-zA-Z\s'-]+$", ErrorMessage = "Full name can only contain letters, spaces, apostrophes, and hyphens.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address Line 1 is required.")]
        [StringLength(200, ErrorMessage = "Address Line 1 cannot exceed 200 characters.")]
        public string AddressLine1 { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "Address Line 2 cannot exceed 200 characters.")]
        public string? AddressLine2 { get; set; }

        [Required(ErrorMessage = "City is required.")]
        [StringLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "ZIP/Postal code is required.")]
        [StringLength(20, ErrorMessage = "ZIP/Postal code cannot exceed 20 characters.")]
        [RegularExpression(@"^[A-Za-z0-9\-\s]+$", ErrorMessage = "ZIP/Postal code can only contain letters, numbers, spaces, and hyphens.")]
        public string ZipCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Country is required.")]
        [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
        public string Country { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Invalid phone number format.")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
        public string Phone { get; set; } = string.Empty;
    }
}
