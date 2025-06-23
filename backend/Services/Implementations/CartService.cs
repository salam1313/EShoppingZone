using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using EshoppingZoneAPI.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EshoppingZoneAPI.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly IRepository<CartItem> _cartRepo;
        private readonly IRepository<Product> _productRepo;
        private readonly IRepository<ProductVariant> _variantRepo;

        public CartService(
            IRepository<CartItem> cartRepo, 
            IRepository<Product> productRepo,
            IRepository<ProductVariant> variantRepo)
        {
            _cartRepo = cartRepo;
            _productRepo = productRepo;
            _variantRepo = variantRepo;
        }        public async Task<List<CartItemResponseDTO>> AddToCartAsync(string userId, List<CartItemAdd> items)
        {
            var results = new List<CartItemResponseDTO>();

            foreach (var item in items)
            {
                if (item.Quantity <= 0)
                    throw new Exception($"Quantity must be greater than zero for product {item.ProductId}");
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                if (product == null)
                    throw new Exception($"Product {item.ProductId} not found");
                // Check if product has variants
                var hasVariants = await _variantRepo.FindAsync(v => v.ProductId == item.ProductId);
                if (hasVariants.Any())
                {
                    // Product has variants, so variant ID is required
                    if (item.VariantIds == null || !item.VariantIds.Any())
                        throw new Exception($"Product {item.ProductId} has variants. Please select specific variants.");

                    foreach (var variantId in item.VariantIds)
                    {
                        var variant = await _variantRepo.GetByIdAsync(variantId);
                        if (variant == null || variant.ProductId != item.ProductId)
                            throw new Exception($"Invalid variant {variantId} for product {item.ProductId}");

                        if (variant.Quantity < item.Quantity)
                            throw new Exception($"Not enough stock available for variant {variantId}");
                    }
                }
                else
                {
                    // Product doesn't have variants, so direct product ID is used
                    if (item.VariantIds != null && item.VariantIds.Any())
                        throw new Exception($"Product {item.ProductId} does not have variants. Please add to cart without variant selection.");
                    if (product.Quantity < item.Quantity)
                        throw new Exception($"Not enough stock available for product {item.ProductId}");
                }

                // --- NEW LOGIC: Check for existing cart item ---
                CartItem? existingCartItem = null;
                if (hasVariants.Any())
                {
                    var variantId = item.VariantIds?.FirstOrDefault();
                    existingCartItem = (await _cartRepo.FindAsync(c => c.UserId == userId && c.ProductId == item.ProductId && c.ProductVariantId == variantId)).FirstOrDefault();
                }
                else
                {
                    existingCartItem = (await _cartRepo.FindAsync(c => c.UserId == userId && c.ProductId == item.ProductId && c.ProductVariantId == null)).FirstOrDefault();
                }

                if (existingCartItem != null)
                {
                    // Increment quantity
                    existingCartItem.Quantity += item.Quantity;
                    _cartRepo.Update(existingCartItem);
                    results.Add(await CreateCartItemResponse(existingCartItem));
                }
                else
                {
                    var cartItem = new CartItem
                    {
                        UserId = userId,
                        ProductId = item.ProductId,
                        ProductVariantId = item.VariantIds?.FirstOrDefault(),  // Store primary variant ID
                        Quantity = item.Quantity
                    };
                    await _cartRepo.AddAsync(cartItem);
                    results.Add(await CreateCartItemResponse(cartItem));
                }
            }

            await _cartRepo.SaveChangesAsync();
            return results;
        }

        public async Task<List<CartItemResponseDTO>> GetUserCartAsync(string userId)
        {
            var cartItems = await _cartRepo.FindAsync(c => c.UserId == userId);
            var responses = new List<CartItemResponseDTO>();

            foreach (var item in cartItems)
            {
                responses.Add(await CreateCartItemResponse(item));
            }

            return responses;
        }        public async Task<List<CartItemResponseDTO>> UpdateCartItemsAsync(string userId, List<CartItemBulkUpdate> items)
        {
            var results = new List<CartItemResponseDTO>();
            var updatedItems = new List<CartItem>();

            foreach (var item in items)
            {
                var cartItem = await _cartRepo.GetByIdAsync(item.CartItemId);
                if (cartItem == null || cartItem.UserId != userId)
                    throw new Exception($"Cart item {item.CartItemId} not found or access denied");

                if (item.Quantity <= 0)
                {
                    _cartRepo.Delete(cartItem);
                    continue;
                }

                // If variant ID is changing, validate the new variant
                if (item.NewVariantId.HasValue && item.NewVariantId != cartItem.ProductVariantId)
                {
                    var variant = await _variantRepo.GetByIdAsync(item.NewVariantId.Value);
                    if (variant == null || variant.ProductId != cartItem.ProductId)
                        throw new Exception($"Invalid variant {item.NewVariantId} for product {cartItem.ProductId}");

                    if (variant.Quantity < item.Quantity)
                        throw new Exception($"Not enough stock available for variant {item.NewVariantId}");                cartItem.ProductVariantId = item.NewVariantId;
                }
                else
                {
                    // Just updating quantity, validate against current variant or product
                    if (cartItem.ProductVariantId.HasValue)
                    {
                        var variant = await _variantRepo.GetByIdAsync(cartItem.ProductVariantId.Value);
                        if (variant?.Quantity < item.Quantity)
                            throw new Exception($"Not enough stock available for variant {cartItem.ProductVariantId}");
                    }
                    else
                    {
                        var product = await _productRepo.GetByIdAsync(cartItem.ProductId);
                        if (product?.Quantity < item.Quantity)
                            throw new Exception($"Not enough stock available for product {cartItem.ProductId}");
                    }
                }

                cartItem.Quantity = item.Quantity;
                _cartRepo.Update(cartItem);
                updatedItems.Add(cartItem);
            }

            await _cartRepo.SaveChangesAsync();

            foreach (var item in updatedItems)
            {
                results.Add(await CreateCartItemResponse(item));
            }

            return results;
        }

        public async Task<bool> RemoveFromCartAsync(string userId, string cartItemId)
        {
            var cartItem = await _cartRepo.GetByIdAsync(cartItemId);
            if (cartItem == null || cartItem.UserId != userId)
                return false;

            _cartRepo.Delete(cartItem);
            await _cartRepo.SaveChangesAsync();
            return true;
        }

        public async Task ClearCartAsync(string userId)
        {
            var cartItems = await _cartRepo.FindAsync(c => c.UserId == userId);
            foreach (var item in cartItems)
            {
                _cartRepo.Delete(item);
            }
            await _cartRepo.SaveChangesAsync();
        }

        public async Task<int> GetCartItemCountAsync(string userId)
        {
            var cartItems = await _cartRepo.FindAsync(c => c.UserId == userId);
            return cartItems.Sum(i => i.Quantity);
        }

        private async Task<CartItemResponseDTO> CreateCartItemResponse(CartItem cartItem)
        {
            var product = await _productRepo.GetByIdAsync(cartItem.ProductId);
            var variant = cartItem.ProductVariantId.HasValue 
                ? await _variantRepo.GetByIdAsync(cartItem.ProductVariantId.Value)
                : null;            return new CartItemResponseDTO
            {
                CartItemId = cartItem.CartItemId,
                ProductId = cartItem.ProductId,
                ProductName = product?.Name ?? "Unknown Product",
                ProductImage = product?.MainImageUrl,
                VariantId = cartItem.ProductVariantId,
                Quantity = cartItem.Quantity,
                UnitPrice = variant?.Price ?? product?.Price ?? 0,
                CurrentStock = variant?.Quantity ?? product?.Quantity ?? 0
            };
        }
    }
}
