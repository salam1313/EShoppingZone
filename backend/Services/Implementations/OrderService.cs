// OrderService.cs
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using EshoppingZoneAPI.Services.Interfaces;
using System;
using System.IO;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;

namespace EshoppingZoneAPI.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly IRepository<Order> _orderRepo;
        private readonly IRepository<CartItem> _cartRepo;
        private readonly IRepository<Product> _productRepo;
        private readonly IRepository<OrderItem> _orderItemRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<Wallet> _walletRepo;
        private readonly IRepository<ProductVariant> _variantRepo;
        private readonly AppDbContext _dbContext;

        public OrderService(
            IRepository<Order> orderRepo,
            IRepository<CartItem> cartRepo,
            IRepository<Product> productRepo,
            IRepository<OrderItem> orderItemRepo,
            IRepository<User> userRepo,
            IRepository<Wallet> walletRepo,
            IRepository<ProductVariant> variantRepo,
            AppDbContext dbContext
        )
        {
            _orderRepo = orderRepo;
            _cartRepo = cartRepo;
            _productRepo = productRepo;
            _orderItemRepo = orderItemRepo;
            _userRepo = userRepo;
            _walletRepo = walletRepo;
            _variantRepo = variantRepo;
            _dbContext = dbContext;
        }

        public async Task<OrderResponseDTO> PlaceOrderAsync(string userId, CheckoutDTO dto)
        {
            var cartItems = await _cartRepo.FindAsync(c => c.UserId == userId);
            if (cartItems.Count == 0)
                return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = "Cart is empty." };

            decimal total = 0;
            var orderItems = new List<OrderItemDTO>();

            foreach (var item in cartItems)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                if (product == null)
                    return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = $"Product not found: {item.ProductId}" };
                if (product.Quantity < item.Quantity)
                    return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = $"You are booking more than available quantity for product: {product.Name}. Available: {product.Quantity}, Requested: {item.Quantity}" };

                // Check and decrement variant stock if applicable
                if (item.ProductVariantId.HasValue)
                {
                    var variant = await _variantRepo.GetByIdAsync(item.ProductVariantId.Value);
                    if (variant == null)
                        return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = $"Product variant not found: {item.ProductVariantId}" };
                    if (variant.Quantity < item.Quantity)
                        return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = $"You are booking more than available quantity for variant. Available: {variant.Quantity}, Requested: {item.Quantity}" };
                    variant.Quantity -= item.Quantity;
                    _variantRepo.Update(variant);
                    await _variantRepo.SaveChangesAsync();
                }

                total += product.Price * item.Quantity;
                orderItems.Add(new OrderItemDTO
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });
            }

            // Wallet Payment Deduction
            if (dto.PaymentMethod == "wallet")
            {
                var wallet = (await _walletRepo.FindAsync(w => w.UserId == userId)).FirstOrDefault();
                if (wallet == null)
                    return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = "Wallet not found." };
                if (wallet.Balance < total)
                    return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = "Insufficient wallet balance." };

                wallet.Balance -= total;
                await _walletRepo.SaveChangesAsync();
            }

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                TotalAmount = total,
                PaymentMethod = dto.PaymentMethod,
                FullName = dto.FullName,
                AddressLine1 = dto.AddressLine1,
                AddressLine2 = dto.AddressLine2,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                Country = dto.Country,
                Phone = dto.Phone
            };

            await _orderRepo.AddAsync(order);
            await _orderRepo.SaveChangesAsync();            foreach (var item in cartItems)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                // Double-check before decrementing to avoid negative stock
                if (product == null || product.Quantity < item.Quantity)
                    return new OrderResponseDTO { OrderId = "", TotalAmount = 0, PaymentMethod = dto.PaymentMethod, OrderDate = DateTime.Now, Items = new(), Message = $"You are booking more than available quantity for product. Available: {product?.Quantity ?? 0}, Requested: {item.Quantity}" };
                
                product.Quantity -= item.Quantity;
                await _productRepo.SaveChangesAsync();

                var orderItem = new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                };

                await _orderItemRepo.AddAsync(orderItem);
            }

            await _orderItemRepo.SaveChangesAsync();            await _cartRepo.DeleteRangeAsync(cartItems);
            await _cartRepo.SaveChangesAsync();

            var user = await _userRepo.GetByIdAsync(userId);
            try
            {
                if (user?.Email != null)
                {
                    await SendEmailAsync(user.Email, order.OrderId, total);
                }
            }
            catch { /* Ignore email errors for user experience */ }

            return new OrderResponseDTO
            {
                OrderId = order.OrderId,
                TotalAmount = order.TotalAmount,
                PaymentMethod = order.PaymentMethod,
                OrderDate = order.OrderDate,
                Items = orderItems,
                Message = "Order placed successfully."
            };
        }

        public async Task SendEmailAsync(string toEmail, string orderId, decimal total)
        {
            if (string.IsNullOrWhiteSpace(toEmail) || !toEmail.Contains("@"))
                throw new Exception("User does not have a valid email address.");

            var email = new MimeMessage();
            var smtpEmail = Environment.GetEnvironmentVariable("SMTP_EMAIL");
            var smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
            var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
            var smtpPortStr = Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
            int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 587;

            email.From.Add(MailboxAddress.Parse(smtpEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "Order Confirmation";
            email.Body = new TextPart(MimeKit.Text.TextFormat.Text)
            {
                Text = $"Your order #{orderId} of ₹{total} has been placed successfully!"
            };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(smtpEmail, smtpPassword);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }

        public async Task<List<OrderHistoryDTO>> GetOrderHistoryAsync(string userId)
        {
            // Eagerly load OrderItems and Product for each order
            var orders = await _dbContext.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems!)
                    .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            var result = new List<OrderHistoryDTO>();
            foreach (var order in orders)
            {
                var items = new List<OrderItemDTO>();
                if (order.OrderItems != null)
                {
                    foreach (var item in order.OrderItems)
                    {
                        items.Add(new OrderItemDTO
                        {
                            ProductId = item.ProductId,
                            ProductName = item.Product?.Name ?? "",
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice
                        });
                    }
                }
                result.Add(new OrderHistoryDTO
                {
                    OrderId = order.OrderId,
                    OrderDate = order.OrderDate,
                    TotalAmount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    Status = order.Status, // Use real status
                    FullName = order.FullName,
                    AddressLine1 = order.AddressLine1,
                    AddressLine2 = order.AddressLine2,
                    City = order.City,
                    State = order.State,
                    ZipCode = order.ZipCode,
                    Country = order.Country,
                    Phone = order.Phone,
                    Items = items
                });
            }
            return result;
        }

        public async Task<bool> CancelOrderAsync(string userId, string orderId)
        {
            var order = await _dbContext.Orders
                .Include(o => o.OrderItems!)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null)
                return false;

            // Prevent cancellation if order is in transit, delivered, or already cancelled
            if (order.Status == "In Transit" || order.Status == "Delivered" || order.Status == "Cancelled")
                return false;

            // Update order status to cancelled
            order.Status = "Cancelled";
            _orderRepo.Update(order);

            // Restore inventory for each order item
            if (order.OrderItems != null)
            {
                foreach (var orderItem in order.OrderItems)
                {
                    var product = await _productRepo.GetByIdAsync(orderItem.ProductId);
                    if (product != null)
                    {
                        product.Quantity += orderItem.Quantity;
                        _productRepo.Update(product);
                    }
                }
            }

            // Process wallet refund if payment was made via wallet
            if (order.PaymentMethod == "wallet")
            {
                var wallet = (await _walletRepo.FindAsync(w => w.UserId == userId)).FirstOrDefault();
                if (wallet != null)
                {
                    wallet.Balance += order.TotalAmount;
                    _walletRepo.Update(wallet);
                    // Add wallet transaction for refund
                    _dbContext.WalletTransactions.Add(new WalletTransaction
                    {
                        UserId = userId,
                        Amount = order.TotalAmount,
                        Type = "credit",
                        Description = $"Refund for cancelled order #{order.OrderId}",
                        Date = DateTime.UtcNow
                    });
                }
                // Ensure wallet transaction is saved
                await _dbContext.SaveChangesAsync();
            }

            await _orderRepo.SaveChangesAsync();
            await _productRepo.SaveChangesAsync();
            if (order.PaymentMethod == "wallet")
            {
                await _walletRepo.SaveChangesAsync();
            }

            return true;
        }
    }   
}
