using AutoMapper;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using EshoppingZoneAPI.Services.Interfaces;

namespace EshoppingZoneAPI.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly IRepository<Product> _productRepository;
        private readonly IRepository<Category> _categoryRepository;
        private readonly IRepository<ProductVariant> _variantRepository;
        private readonly IMapper _mapper;

        public ProductService(IRepository<Product> productRepository, IRepository<Category> categoryRepository, IRepository<ProductVariant> variantRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _variantRepository = variantRepository;
            _mapper = mapper;
        }

public async Task<List<Product>> GetAllProductsAsync(
    string? subcategoryId = null,
    Dictionary<string, string>? customAttributes = null,
    decimal? minPrice = null,
    decimal? maxPrice = null)
{
    // Get all products and load their variants
    var products = await _productRepository.GetAllAsync();
    Console.WriteLine($"Total products before filtering: {products.Count}");
    
    if (subcategoryId != null)
    {
        products = products.Where(p => p.SubcategoryId == subcategoryId).ToList();
        Console.WriteLine($"Products after subcategory filter: {products.Count}");
    }

    foreach (var product in products)
    {
        product.Variants = await _variantRepository.FindAsync(v => v.ProductId == product.ProductId);
        Console.WriteLine($"Product {product.ProductId} has {product.Variants.Count()} variants");
    }

    var filteredProducts = new List<Product>();

    foreach (var product in products)
    {
        bool includeProduct = false;
        var variants = product.Variants?.ToList() ?? new List<ProductVariant>();
        Console.WriteLine($"\nProcessing product {product.ProductId} with {variants.Count} variants");
        Console.WriteLine($"Price filter criteria: minPrice={minPrice}, maxPrice={maxPrice}");
        
        // Check if the base product (without variants) matches the price criteria
        if (!variants.Any())
        {
            includeProduct = (!minPrice.HasValue || product.Price >= minPrice.Value) &&
                           (!maxPrice.HasValue || product.Price <= maxPrice.Value);
            Console.WriteLine($"Base product price: {product.Price}, includeProduct: {includeProduct}");
        }
        else 
        {
            // Filter variants first by price if specified
            if (minPrice.HasValue || maxPrice.HasValue)
            {
                var originalCount = variants.Count;
                variants = variants.Where(v =>
                    (!minPrice.HasValue || v.Price >= minPrice.Value) &&
                    (!maxPrice.HasValue || v.Price <= maxPrice.Value)
                ).ToList();
                Console.WriteLine($"Variants after price filter: {variants.Count} (from {originalCount})");
                Console.WriteLine($"Variant prices: {string.Join(", ", variants.Select(v => v.Price))}");
            }            // Then by custom attributes ONLY if they are specified and not empty
            if (customAttributes != null && customAttributes.Any())
            {
                var originalCount = variants.Count;
                Console.WriteLine($"Filtering with custom attributes: {string.Join(", ", customAttributes.Select(kv => $"{kv.Key}={kv.Value}"))}");
                variants = variants.Where(v =>
                    v.Attributes != null &&
                    customAttributes.All(attr =>
                        v.Attributes.TryGetValue(attr.Key, out var val) &&
                        val == attr.Value)
                ).ToList();
                Console.WriteLine($"Variants after attribute filter: {variants.Count} (from {originalCount})");
            }
            else
            {
                Console.WriteLine("No custom attributes specified or empty dictionary, skipping attribute filtering");
            }

            // Include product if any variants match the criteria
            includeProduct = variants.Any();
            Console.WriteLine($"Final decision - includeProduct: {includeProduct}");
        }

        if (includeProduct)
        {
            // Only include the filtered variants
            product.Variants = variants;
            filteredProducts.Add(product);
            Console.WriteLine($"Added product {product.ProductId} to results with {variants.Count} matching variants");
        }
    }

    Console.WriteLine($"\nFinal filtered products count: {filteredProducts.Count}");
    return filteredProducts;
}

        public async Task<Product?> GetProductByIdAsync(string id)
        {
            // Eager load variants
            var product = (await _productRepository.FindAsync(p => p.ProductId == id)).FirstOrDefault();
            if (product == null)
                return null;
            // Manually load variants if not loaded
            if (product.Variants == null || !product.Variants.Any())
            {
                product.Variants = await _variantRepository.FindAsync(v => v.ProductId == id);
            }
            return product;
        }

        public async Task<Product> AddProductAsync(ProductDTO dto)
        {
            // Create main product (parent)
            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                SubcategoryId = dto.SubcategoryId,
                MainImageUrl = dto.MainImageUrl,
                ImageUrls = dto.ImageUrls,
                Quantity = dto.Quantity // Use merchant-specified quantity
            };
            await _productRepository.AddAsync(product);
            await _productRepository.SaveChangesAsync();

            // Add variants (each with their own attributes)
            if (dto.Variants != null && dto.Variants.Count > 0)
            {
                foreach (var variant in dto.Variants)
                {
                    var variantEntity = new ProductVariant
                    {
                        ProductId = product.ProductId,
                        Quantity = variant.Quantity,
                        Price = variant.Price,
                        Attributes = variant.Attributes
                    };
                    await _variantRepository.AddAsync(variantEntity);
                }
                await _variantRepository.SaveChangesAsync();
            }
            return product;
        }        public async Task<bool> UpdateProductAsync(string id, ProductUpdateDTO dto)
        {
            var existingProduct = await _productRepository.FindAsync(p => p.ProductId == id);
            var product = existingProduct.FirstOrDefault();
            if (product == null) return false;

            // Update only the fields that are provided (not null)
            if (!string.IsNullOrEmpty(dto.Name))
                product.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Description))
                product.Description = dto.Description;
            if (dto.Price.HasValue)
                product.Price = dto.Price.Value;
            if (dto.Quantity.HasValue)
                product.Quantity = dto.Quantity.Value;
            if (!string.IsNullOrEmpty(dto.CategoryId))
                product.CategoryId = dto.CategoryId;
            if (!string.IsNullOrEmpty(dto.SubcategoryId))
                product.SubcategoryId = dto.SubcategoryId;
            if (!string.IsNullOrEmpty(dto.MainImageUrl))
                product.MainImageUrl = dto.MainImageUrl;
            if (dto.ImageUrls != null)
                product.ImageUrls = dto.ImageUrls;

            _productRepository.Update(product);
            await _productRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateProductQuantityAsync(string id, int quantity)
        {
            var existingProduct = await _productRepository.FindAsync(p => p.ProductId == id);
            var product = existingProduct.FirstOrDefault();
            if (product == null) return false;

            product.Quantity = quantity;
            _productRepository.Update(product);
            await _productRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProductAsync(string id)
        {
            var existingProduct = (await _productRepository.FindAsync(p => p.ProductId == id)).FirstOrDefault();
            if (existingProduct == null) return false;

            _productRepository.Delete(existingProduct);
            await _productRepository.SaveChangesAsync();
            return true;
        }

        public async Task<List<Product>> GetProductsByMerchantAsync(string merchantId)
        {
            return await _productRepository.FindAsync(p => p.MerchantId == merchantId);
        }

        public async Task<Product> AddProductForMerchantAsync(ProductDTO dto, string merchantId)
        {
            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                SubcategoryId = dto.SubcategoryId,
                MainImageUrl = dto.MainImageUrl,
                ImageUrls = dto.ImageUrls,
                Quantity = dto.Quantity, // Use merchant-specified quantity
                MerchantId = merchantId
            };
            await _productRepository.AddAsync(product);
            await _productRepository.SaveChangesAsync();

            if (dto.Variants != null && dto.Variants.Count > 0)
            {
                foreach (var variant in dto.Variants)
                {
                    var variantEntity = new ProductVariant
                    {
                        ProductId = product.ProductId,
                        Quantity = variant.Quantity,
                        Price = variant.Price,
                        Attributes = variant.Attributes
                    };
                    await _variantRepository.AddAsync(variantEntity);
                }
                await _variantRepository.SaveChangesAsync();
            }
            return product;
        }
    }
}
