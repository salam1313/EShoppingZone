using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Services.Interfaces;

namespace EshoppingZoneAPI.Controllers
{
    [Route("api/product")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        // ✅ Allow only Merchants to add products
        [HttpPost]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddProduct([FromBody] ProductDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var merchantId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(merchantId))
                return Unauthorized("Merchant ID not found");
            // Attach merchantId to DTO (add property if needed)
            var result = await _productService.AddProductForMerchantAsync(dto, merchantId);
            return Ok(result);
        }

        // Add product WITH variants
        [HttpPost("with-variants")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddProductWithVariants([FromBody] ProductDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            if (dto.Variants == null || dto.Variants.Count == 0)
                return BadRequest(new { errors = new[] { "At least one product variant is required." } });
            // Ignore product-level quantity/price, use only variants
            dto.Quantity = 0;
            var merchantId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(merchantId))
                return Unauthorized("Merchant ID not found");
            var result = await _productService.AddProductForMerchantAsync(dto, merchantId);
            return Ok(result);
        }

        // Add product WITHOUT variants
        [HttpPost("without-variants")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddProductWithoutVariants([FromBody] ProductDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            // Remove variants if present
            dto.Variants = new List<ProductVariantDTO>();
            var merchantId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(merchantId))
                return Unauthorized("Merchant ID not found");
            var result = await _productService.AddProductForMerchantAsync(dto, merchantId);
            return Ok(result);
        }

        // ✅ All users can view products
        [HttpGet]
        [AllowAnonymous]        public async Task<IActionResult> GetAllProducts(
            [FromQuery(Name = "minPrice")] decimal? minPrice,
            [FromQuery(Name = "maxPrice")] decimal? maxPrice,
            [FromQuery(Name = "customAttributes")] Dictionary<string, string>? customAttributes)
        {
            // Debug log to see what attributes we're receiving
            if (customAttributes != null)
            {
                Console.WriteLine($"Received custom attributes: {string.Join(", ", customAttributes.Select(kv => $"{kv.Key}={kv.Value}"))}");
            }
            else
            {
                Console.WriteLine("No custom attributes received");
            }
            
            var products = await _productService.GetAllProductsAsync(null, customAttributes, minPrice, maxPrice);
            return Ok(products);
        }        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProduct(string id)
        {
            var product = (await _productService.GetProductByIdAsync(id));
            if (product == null)
                return NotFound();
            return Ok(product);
        }

        // ✅ Allow merchants to update product details including quantity
        [HttpPut("{id}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductUpdateDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var result = await _productService.UpdateProductAsync(id, dto);
            if (!result)
                return NotFound(new { message = "Product not found" });
            return Ok(new { message = "Product updated successfully" });
        }

        // ✅ Allow merchants to update just the quantity (simpler endpoint)
        [HttpPatch("{id}/quantity")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> UpdateProductQuantity(string id, [FromBody] UpdateQuantityDTO dto)
        {
            var result = await _productService.UpdateProductQuantityAsync(id, dto.Quantity);
            if (!result)
                return NotFound(new { message = "Product not found" });
            return Ok(new { message = "Product quantity updated successfully" });
        }

        // ✅ Allow merchants to get their own products
        [HttpGet("my-products")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> GetMyProducts()
        {
            var merchantId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(merchantId))
                return Unauthorized("Merchant ID not found");

            var products = await _productService.GetProductsByMerchantAsync(merchantId);
            return Ok(products);
        }

        // ✅ Allow merchants to delete their own products
        [HttpDelete("{id}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> DeleteProduct(string id)
        {
            var merchantId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(merchantId))
                return Unauthorized("Merchant ID not found");

            // Only allow deletion if product belongs to merchant
            var products = await _productService.GetProductsByMerchantAsync(merchantId);
            if (!products.Any(p => p.ProductId == id))
                return Forbid("You do not have permission to delete this product.");

            var result = await _productService.DeleteProductAsync(id);
            if (!result)
                return NotFound(new { message = "Product not found" });
            return Ok(new { message = "Product deleted successfully" });
        }

        // ✅ Allow image upload for products (merchants only)
        [HttpPost("upload-image")]
        [Authorize(Roles = "Merchant")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage([FromForm] UploadImageDTO dto)
        {
            var file = dto.File;
            var productId = dto.ProductId;
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });
            if (string.IsNullOrWhiteSpace(productId))
                return BadRequest(new { message = "ProductId is required for image upload." });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products", productId);
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the relative URL for frontend use
            var url = $"/uploads/products/{productId}/{fileName}";
            return Ok(new { url });
        }
    }
}
