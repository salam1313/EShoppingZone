using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Services.Interfaces
{
    public interface IProductService
    {
        Task<List<Product>> GetAllProductsAsync(string? subcategoryId = null, Dictionary<string, string>? customAttributes = null, decimal? minPrice = null, decimal? maxPrice = null);
        Task<Product?> GetProductByIdAsync(string id);
        Task<Product> AddProductAsync(ProductDTO dto); // Accepts variants in ProductDTO
        Task<Product> AddProductForMerchantAsync(ProductDTO dto, string merchantId);
        Task<bool> UpdateProductAsync(string id, ProductUpdateDTO dto);
        Task<bool> UpdateProductQuantityAsync(string id, int quantity);
        Task<bool> DeleteProductAsync(string id); // Change from int to string
        Task<List<Product>> GetProductsByMerchantAsync(string merchantId);
    }
}
