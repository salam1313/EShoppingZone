using System.ComponentModel.DataAnnotations;

namespace EshoppingZoneAPI.DTOs
{
    public class AddFundsDTO
    {
        [Required(ErrorMessage = "Amount is required.")]
        [Range(0.01, 1000000, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }
    }
}
