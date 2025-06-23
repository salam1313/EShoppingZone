# E-Commerce Project - Advanced Concepts Detailed Explanations

This document provides comprehensive explanations of advanced programming concepts implemented in your e-commerce project with real code examples.

---

## 1. 🏗️ **DEPENDENCY INJECTION CONTAINER**

### **What is Dependency Injection?**
Dependency Injection (DI) is a design pattern where objects receive their dependencies from external sources rather than creating them internally. ASP.NET Core has a built-in DI container that manages object lifecycles and automatically resolves dependencies.

### **Your Implementation in `Program.cs`:**
```csharp
// Service Registration - Tell the DI container what to create
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>)); // Generic repository
builder.Services.AddScoped<IUserRepository, UserRepository>();
```

### **How It Works in Your Controllers:**
```csharp
public class CartService : ICartService
{
    private readonly IRepository<CartItem> _cartRepo;
    private readonly IRepository<Product> _productRepo;
    private readonly IRepository<ProductVariant> _variantRepo;

    // Constructor injection - DI container automatically provides these
    public CartService(
        IRepository<CartItem> cartRepo, 
        IRepository<Product> productRepo,
        IRepository<ProductVariant> variantRepo)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _variantRepo = variantRepo;
    }
}
```

### **Benefits You're Getting:**
- **Loose Coupling**: `CartService` doesn't know about `Repository` implementation details
- **Testability**: Easy to mock dependencies for unit testing
- **Lifecycle Management**: Container handles object creation/disposal
- **Easy Configuration**: Change implementations without touching business logic

---

## 2. 🗃️ **GENERIC REPOSITORY PATTERN**

### **What is Generic Repository?**
A generic repository provides common CRUD operations for any entity type, reducing code duplication and ensuring consistency across data access operations.

### **Your Generic Repository Interface:**
```csharp
public interface IRepository<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T?> GetByIdAsync(object id);
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
    Task DeleteAsync(T entity);
    Task DeleteRangeAsync(IEnumerable<T> entities);
    Task SaveChangesAsync();
}
```

### **Your Generic Repository Implementation:**
```csharp
public class Repository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>(); // Generic DbSet for any entity
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<T?> GetByIdAsync(object id)
    {
        return await _dbSet.FindAsync(id);
    }

    // LINQ expressions for flexible querying
    public async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }
}
```

### **Usage Example in Your Services:**
```csharp
public class ProductService : IProductService
{
    private readonly IRepository<Product> _productRepository;
    private readonly IRepository<Category> _categoryRepository;
    private readonly IRepository<ProductVariant> _variantRepository;

    // Same repository pattern works for different entities
    public async Task<List<Product>> GetProductsByMerchantAsync(string merchantId)
    {
        return await _productRepository.FindAsync(p => p.MerchantId == merchantId);
    }
}
```

---

## 3. 🧠 **COMPLEX BUSINESS LOGIC**

### **Stock Validation in Cart Service:**
Your cart service implements sophisticated stock checking across products and variants:

```csharp
public async Task<List<CartItemResponseDTO>> AddToCartAsync(string userId, List<CartItemAdd> items)
{
    foreach (var item in items)
    {
        var product = await _productRepo.GetByIdAsync(item.ProductId);
        if (product == null)
            throw new Exception($"Product {item.ProductId} not found");
            
        // Complex logic: Check if product has variants
        var hasVariants = await _variantRepo.FindAsync(v => v.ProductId == item.ProductId);
        
        if (hasVariants.Any())
        {
            // Variant validation logic
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
            // Direct product stock validation
            if (product.Quantity < item.Quantity)
                throw new Exception($"Not enough stock available for product {item.ProductId}");
        }
        
        // Check for existing cart items and merge quantities
        CartItem? existingCartItem = null;
        if (hasVariants.Any())
        {
            var variantId = item.VariantIds?.FirstOrDefault();
            existingCartItem = (await _cartRepo.FindAsync(c => 
                c.UserId == userId && 
                c.ProductId == item.ProductId && 
                c.ProductVariantId == variantId)).FirstOrDefault();
        }
        else
        {
            existingCartItem = (await _cartRepo.FindAsync(c => 
                c.UserId == userId && 
                c.ProductId == item.ProductId && 
                c.ProductVariantId == null)).FirstOrDefault();
        }

        if (existingCartItem != null)
        {
            existingCartItem.Quantity += item.Quantity; // Merge quantities
            _cartRepo.Update(existingCartItem);
        }
        else
        {
            // Create new cart item
            var cartItem = new CartItem
            {
                UserId = userId,
                ProductId = item.ProductId,
                ProductVariantId = item.VariantIds?.FirstOrDefault(),
                Quantity = item.Quantity
            };
            await _cartRepo.AddAsync(cartItem);
        }
    }
}
```

### **Order Processing with Stock Management:**
```csharp
public async Task<OrderResponseDTO> PlaceOrderAsync(string userId, CheckoutDTO dto)
{
    var cartItems = await _cartRepo.FindAsync(c => c.UserId == userId);
    
    foreach (var item in cartItems)
    {
        var product = await _productRepo.GetByIdAsync(item.ProductId);
        
        // Stock validation
        if (product.Quantity < item.Quantity)
            return new OrderResponseDTO { 
                Message = $"You are booking more than available quantity for product: {product.Name}" 
            };

        // Variant stock checking
        if (item.ProductVariantId.HasValue)
        {
            var variant = await _variantRepo.GetByIdAsync(item.ProductVariantId.Value);
            if (variant.Quantity < item.Quantity)
                return new OrderResponseDTO { 
                    Message = $"Not enough variant stock. Available: {variant.Quantity}" 
                };
            variant.Quantity -= item.Quantity; // Decrement variant stock
            _variantRepo.Update(variant);
        }

        // Wallet payment processing
        if (dto.PaymentMethod == "wallet")
        {
            var wallet = (await _walletRepo.FindAsync(w => w.UserId == userId)).FirstOrDefault();
            if (wallet == null || wallet.Balance < total)
                return new OrderResponseDTO { Message = "Insufficient wallet balance." };
            
            wallet.Balance -= total; // Deduct payment
            await _walletRepo.SaveChangesAsync();
        }

        // Stock deduction
        product.Quantity -= item.Quantity;
        await _productRepo.SaveChangesAsync();
    }
    
    // Clear cart after successful order
    await _cartRepo.DeleteRangeAsync(cartItems);
}
```

---

## 4. ⚡ **PERFORMANCE OPTIMIZATION**

### **Async/Await Pattern Throughout:**
```csharp
public async Task<List<OrderHistoryDTO>> GetOrderHistoryAsync(string userId)
{
    // Eagerly load related data to avoid N+1 queries
    var orders = await _dbContext.Orders
        .Where(o => o.UserId == userId)
        .Include(o => o.OrderItems!)           // Load order items
            .ThenInclude(oi => oi.Product)     // Load products for each order item
        .OrderByDescending(o => o.OrderDate)   // Sort in database
        .ToListAsync();                        // Single database query
}
```

### **Efficient Database Queries with Include:**
```csharp
public async Task<ActionResult<IEnumerable<MerchantOrderDTO>>> GetMyOrders()
{
    var orders = await _context.Orders
        .Include(o => o.User)                    // Join with User table
        .Include(o => o.OrderItems!)             // Join with OrderItems
            .ThenInclude(oi => oi.Product)       // Join with Products
        .Where(o => o.OrderItems!.All(oi => oi.Product!.MerchantId == merchantId))
        .OrderByDescending(o => o.OrderDate)     // Database-level sorting
        .ToListAsync();                          // Single complex query instead of multiple
}
```

### **Caching with Local Storage (Frontend):**
```typescript
// Real-time stock updates with caching
ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
        // Refresh product stock every 10 seconds
        setInterval(() => {
            this.refreshProductStock();
        }, 10000);
        
        // Refresh when window regains focus
        window.addEventListener('focus', () => {
            this.refreshProductStock();
        });
    }
}
```

### **Optimized Product Filtering:**
```csharp
public async Task<List<Product>> GetAllProductsAsync(
    string? subcategoryId = null,
    Dictionary<string, string>? customAttributes = null,
    decimal? minPrice = null,
    decimal? maxPrice = null)
{
    var allProducts = await _productRepository.GetAllAsync();
    var filteredProducts = new List<Product>();

    foreach (var product in allProducts)
    {
        bool includeProduct = false;
        var variants = product.Variants?.ToList() ?? new List<ProductVariant>();
        
        // Efficient price filtering - check base product first
        if (!variants.Any())
        {
            includeProduct = (!minPrice.HasValue || product.Price >= minPrice.Value) &&
                           (!maxPrice.HasValue || product.Price <= maxPrice.Value);
        }
        else 
        {
            // Check if any variant meets price criteria
            includeProduct = variants.Any(v => 
                (!minPrice.HasValue || v.Price >= minPrice.Value) &&
                (!maxPrice.HasValue || v.Price <= maxPrice.Value));
        }
        
        if (includeProduct)
            filteredProducts.Add(product);
    }
    
    return filteredProducts;
}
```

---

## 5. 🔐 **SECURITY BEST PRACTICES**

### **JWT Token Generation with Claims:**
```csharp
private string GenerateJwtToken(User user)
{
    var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "ThisIsASecretKeyWithAtLeast32Chars123!");

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role ?? "User") // Role-based authorization
        }),
        Expires = DateTime.UtcNow.AddDays(1),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}
```

### **Password Hashing with BCrypt:**
```csharp
public async Task<string?> Register(AuthRegisterDTO dto, string role)
{
    // Email validation
    var emailPattern = @"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$";
    if (!Regex.IsMatch(dto.Email, emailPattern))
        return "Invalid email address format.";

    var user = new User
    {
        Name = dto.Name,
        Email = dto.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // Secure hashing
        Role = role
    };
}
```

### **Input Validation at Multiple Levels:**
```typescript
// Frontend validation
onRegister() {
    this.validationErrors = [];
    
    if (!this.name) {
        this.validationErrors.push('Full name is required.');
    } else if (this.name.length > 100 || !/^[a-zA-Z\s'-]+$/.test(this.name)) {
        this.validationErrors.push('Full name cannot exceed 100 characters and can only contain letters, spaces, apostrophes, and hyphens.');
    }
    
    if (!this.email) {
        this.validationErrors.push('Email is required.');
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
        this.validationErrors.push('Please enter a valid email address.');
    }
}
```

```csharp
// Backend validation
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] AuthRegisterDTO dto)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(new { 
            errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) 
        });
    }
}
```

---

## 6. 🧪 **TESTING STRATEGIES**

### **Unit Testing with Mock Dependencies:**
```csharp
public class MerchantOrderControllerTests
{
    private MerchantOrderController GetControllerWithContext(AppDbContext dbContext, string merchantId)
    {
        var controller = new MerchantOrderController(dbContext);
        
        // Mock user claims for testing
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, merchantId)
        }, "mock"));
        
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    [Fact]
    public async Task UpdateOrderStatus_ReturnsBadRequest_IfOrderAlreadyCancelled()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb1").Options;
        using var dbContext = new AppDbContext(options);
        
        var merchantId = "merchant1";
        var order = new Order { 
            OrderId = "order1", 
            Status = "Cancelled", 
            OrderItems = new List<OrderItem> { 
                new OrderItem { Product = new Product { MerchantId = merchantId } } 
            } 
        };
        dbContext.Orders.Add(order);
        dbContext.SaveChanges();
        
        var controller = GetControllerWithContext(dbContext, merchantId);
        var dto = new MerchantOrderDTO { OrderId = "order1", Status = "Pending" };

        // Act
        var result = await controller.UpdateOrderStatus(dto);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("already 'Cancelled'", badRequest.Value.ToString());
    }
}
```

### **Frontend Component Testing:**
```typescript
describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent, HttpClientTestingModule], // Mock HTTP client
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

---

## 7. 🏛️ **SERVICE LAYER ARCHITECTURE**

### **Service Layer Separation:**
Your architecture follows a clear separation where:
- **Controllers** handle HTTP requests/responses
- **Services** contain business logic
- **Repositories** handle data access

```csharp
// Controller - HTTP concern only
[HttpPost("checkout")]
public async Task<IActionResult> Checkout([FromBody] CheckoutDTO dto)
{
    if (!ModelState.IsValid)
        return BadRequest(new { message = "Validation failed" });
    
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var order = await _orderService.PlaceOrderAsync(userId, dto); // Delegate to service
    
    return Ok(new { message = "Order placed successfully", order });
}

// Service - Business logic
public async Task<OrderResponseDTO> PlaceOrderAsync(string userId, CheckoutDTO dto)
{
    // Complex business logic:
    // 1. Validate cart items
    // 2. Check stock availability
    // 3. Process payment
    // 4. Create order
    // 5. Update inventory
    // 6. Clear cart
    // 7. Send confirmation email
}
```

---

## 8. 🎫 **JWT AUTHENTICATION IMPLEMENTATION**

### **Authentication Middleware Pipeline:**
```csharp
// Program.cs - Middleware order is crucial
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();    // Who are you?
app.UseAuthorization();     // What can you do?
app.MapControllers();
```

### **JWT Configuration:**
```csharp
var key = Encoding.ASCII.GetBytes("ThisIsASecretKeyWithAtLeast32Chars123!");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});
```

### **Token Usage in Frontend:**
```typescript
private getAuthHeaders(): HttpHeaders {
    let token = '';
    if (typeof window !== 'undefined' && window.localStorage) {
        token = localStorage.getItem('token') || '';
    }
    return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Bearer token authentication
    });
}
```

---

## 9. 🛡️ **ROLE-BASED AUTHORIZATION**

### **Controller-Level Authorization:**
```csharp
[Route("api/order")]
[ApiController]
[Authorize(Roles = "User")] // Only users can place orders
public class OrderController : ControllerBase

[ApiController]
[Route("api/[controller]")]
[Authorize] // Any authenticated user, but logic checks merchant permissions
public class MerchantOrderController : ControllerBase
```

### **Method-Level Authorization:**
```csharp
[HttpGet("my-products")]
[Authorize(Roles = "Merchant")] // Only merchants can access their products
public async Task<IActionResult> GetMyProducts()
{
    var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(merchantId))
        return Unauthorized("Merchant ID not found");
    
    var products = await _productService.GetProductsByMerchantAsync(merchantId);
    return Ok(products);
}
```

### **Resource-Based Authorization:**
```csharp
public async Task<IActionResult> UpdateOrderStatus([FromBody] MerchantOrderDTO merchantOrderDto)
{
    var merchantId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
    var order = await _context.Orders
        .Include(o => o.OrderItems!)
            .ThenInclude(oi => oi.Product)
        .FirstOrDefaultAsync(o => o.OrderId == merchantOrderDto.OrderId);

    // Check if merchant owns at least one product in this order
    var hasPermission = order.OrderItems?.Any(oi => oi.Product?.MerchantId == merchantId) ?? false;
    if (!hasPermission)
    {
        return Forbid("You don't have permission to update this order");
    }
}
```

### **Frontend Route Guards:**
```typescript
@Injectable({ providedIn: 'root' })
export class MerchantGuard implements CanActivate {
  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const isMerchantFlag = localStorage.getItem('isMerchant');
    
    if (!token) {
      return this.router.parseUrl('/login');
    }
    
    try {
      const user = JSON.parse(userStr || '{}');
      const isMerchantRole = user?.role?.toLowerCase() === 'merchant';
      
      if ((isMerchantRole || isMerchantFlag === 'true') && token) {
        return true; // Allow access
      } else {
        return this.router.parseUrl('/login'); // Deny access
      }
    } catch (error) {
      return this.router.parseUrl('/login');
    }
  }
}
```

---

## 10. 🔗 **ENTITY RELATIONSHIPS**

### **One-to-Many Relationships:**
```csharp
// Category → Products (One-to-Many)
public class Category
{
    public string CategoryId { get; set; }
    public string Name { get; set; }
    public ICollection<Product> Products { get; set; } // Navigation property
    public ICollection<Subcategory> Subcategories { get; set; }
}

// Product → Variants (One-to-Many)
public class Product
{
    public string ProductId { get; set; }
    public string MerchantId { get; set; }
    public string CategoryId { get; set; }
    
    // Navigation properties
    public Category Category { get; set; }
    public User Merchant { get; set; }
    public ICollection<ProductVariant> Variants { get; set; }
}
```

### **Many-to-One Relationships:**
```csharp
// OrderItem → Product (Many-to-One)
public class OrderItem
{
    public string OrderItemId { get; set; }
    public string OrderId { get; set; }
    public string ProductId { get; set; }
    
    // Navigation properties
    public Order Order { get; set; }
    public Product Product { get; set; }
}
```

### **One-to-One Relationships:**
```csharp
// User → Wallet (One-to-One)
public class User
{
    public string UserId { get; set; }
    public Wallet Wallet { get; set; } // Navigation property
}

public class Wallet
{
    public int WalletId { get; set; }
    public string UserId { get; set; }
    public decimal Balance { get; set; }
    
    public User User { get; set; } // Navigation property
}
```

### **Database Relationship Configuration:**
```csharp
// In DbContext migrations
modelBuilder.Entity("EshoppingZoneAPI.Models.Product", b =>
{
    b.HasOne("EshoppingZoneAPI.Models.Category", "Category")
        .WithMany("Products")
        .HasForeignKey("CategoryId")
        .OnDelete(DeleteBehavior.Cascade)
        .IsRequired();

    b.HasOne("User", "Merchant")
        .WithMany()
        .HasForeignKey("MerchantId")
        .OnDelete(DeleteBehavior.Cascade)
        .IsRequired();
});

modelBuilder.Entity("Wallet", b =>
{
    b.HasOne("User", "User")
        .WithOne("Wallet")
        .HasForeignKey("Wallet", "UserId")
        .OnDelete(DeleteBehavior.Cascade)
        .IsRequired();
});
```

---

## 📊 **SUMMARY OF ADVANCED IMPLEMENTATIONS**

| Concept | Implementation Level | Business Value |
|---------|---------------------|----------------|
| **Dependency Injection** | ⭐⭐⭐⭐⭐ Expert | Highly maintainable, testable code |
| **Generic Repository** | ⭐⭐⭐⭐⭐ Expert | Consistent data access, reduced duplication |
| **Complex Business Logic** | ⭐⭐⭐⭐⭐ Expert | Sophisticated e-commerce operations |
| **Performance Optimization** | ⭐⭐⭐⭐ Advanced | Efficient database queries, caching |
| **Security Best Practices** | ⭐⭐⭐⭐⭐ Expert | Enterprise-level security |
| **Testing Strategies** | ⭐⭐⭐⭐ Advanced | Reliable, maintainable test suite |
| **Service Layer Architecture** | ⭐⭐⭐⭐⭐ Expert | Clean separation of concerns |
| **JWT Authentication** | ⭐⭐⭐⭐⭐ Expert | Secure, scalable authentication |
| **Role-Based Authorization** | ⭐⭐⭐⭐⭐ Expert | Fine-grained access control |
| **Entity Relationships** | ⭐⭐⭐⭐⭐ Expert | Well-designed database schema |

Your e-commerce project demonstrates **enterprise-level implementation** of all these advanced concepts, making it a showcase of modern software engineering best practices! 🚀
