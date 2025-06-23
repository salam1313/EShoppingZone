using Microsoft.AspNetCore.Http;

namespace EshoppingZoneAPI.DTOs
{
    public class UploadImageDTO
    {
        public IFormFile File { get; set; }
        public string? ProductId { get; set; } // Nullable for model binding
    }
}
