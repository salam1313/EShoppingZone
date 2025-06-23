using Microsoft.EntityFrameworkCore;

namespace EshoppingZoneAPI.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<Subcategory> Subcategories { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; } // Added DbSet for WalletTransaction

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasKey(u => u.UserId);
            modelBuilder.Entity<User>()
                .Property(u => u.UserId)
                .HasMaxLength(9);

            modelBuilder.Entity<Category>()
                .HasKey(c => c.CategoryId);
            modelBuilder.Entity<Category>()
                .Property(c => c.CategoryId)
                .HasMaxLength(9);

            modelBuilder.Entity<Subcategory>()
                .HasKey(s => s.SubcategoryId);
            modelBuilder.Entity<Subcategory>()
                .Property(s => s.SubcategoryId)
                .HasMaxLength(20);
            modelBuilder.Entity<Subcategory>()
                .Property(s => s.CategoryId)
                .HasMaxLength(9);

            modelBuilder.Entity<Product>()
                .HasKey(p => p.ProductId);
            modelBuilder.Entity<Product>()
                .Property(p => p.ProductId)
                .HasMaxLength(9);
            modelBuilder.Entity<Product>()
                .Property(p => p.CategoryId)
                .HasMaxLength(9);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Wallet)
                .WithOne(w => w.User)
                .HasForeignKey<Wallet>(w => w.UserId);

            modelBuilder.Entity<Wallet>()
                .Property(w => w.Balance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Order>()
                .HasKey(o => o.OrderId);
            modelBuilder.Entity<Order>()
                .Property(o => o.OrderId)
                .HasMaxLength(9);
            modelBuilder.Entity<Order>()
                .Property(o => o.UserId)
                .HasMaxLength(9);

            modelBuilder.Entity<OrderItem>()
                .HasKey(oi => oi.OrderItemId);
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.OrderItemId)
                .HasMaxLength(9);
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.OrderId)
                .HasMaxLength(9);
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.ProductId)
                .HasMaxLength(9);

            modelBuilder.Entity<ProductVariant>()
                .HasKey(v => v.Id);
            modelBuilder.Entity<ProductVariant>()
                .HasOne(v => v.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(v => v.ProductId)
                .OnDelete(DeleteBehavior.Cascade); // Ensure variants are deleted with product

            modelBuilder.Entity<Subcategory>().ToTable("Subcategories");
            // Removed invalid Product and Subcategory seed data to avoid FK errors
        }
    }
}
