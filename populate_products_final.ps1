# Fixed script with subcategory support
$API_BASE = "http://localhost:5148"

Write-Host "=== Product Population Script (Fixed) ===" -ForegroundColor Cyan

# Login
$loginBody = '{"email":"merchant@gmail.com","password":"123456"}'
$loginResponse = Invoke-RestMethod -Uri "$API_BASE/api/m/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$authToken = $loginResponse.token
Write-Host "✅ Login successful!" -ForegroundColor Green

# Get categories with subcategories
$categories = Invoke-RestMethod -Uri "$API_BASE/api/category" -Method GET
Write-Host "✅ Found $($categories.Count) categories" -ForegroundColor Green

# Display categories and subcategories
foreach ($cat in $categories) {
    Write-Host "Category: $($cat.name) (ID: $($cat.categoryId))" -ForegroundColor Cyan
    if ($cat.subcategories -and $cat.subcategories.Count -gt 0) {
        foreach ($sub in $cat.subcategories) {
            Write-Host "  - Subcategory: $($sub.name) (ID: $($sub.subcategoryId))" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  - No subcategories found" -ForegroundColor Red
    }
}

# Headers for authenticated requests
$headers = @{'Authorization' = "Bearer $authToken"; 'Content-Type' = 'application/json'}

# Products templates by category
$electronicsProducts = @(
    @{name="Premium Wireless Headphones"; desc="High-quality noise-canceling wireless headphones"; price=299.99; qty=50; img="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
    @{name="Smart Fitness Watch"; desc="Advanced fitness tracking watch with heart rate monitor"; price=249.99; qty=75; img="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
    @{name="Wireless Charging Pad"; desc="Fast wireless charging pad for all devices"; price=39.99; qty=100; img="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500"}
    @{name="Bluetooth Speaker"; desc="Portable speaker with waterproof design"; price=79.99; qty=60; img="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"}
    @{name="USB-C Hub"; desc="Multi-port hub with HDMI support"; price=49.99; qty=80; img="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500"}
    @{name="Wireless Mouse"; desc="Ergonomic wireless mouse"; price=29.99; qty=120; img="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500"}
    @{name="Phone Stand"; desc="Adjustable phone stand"; price=19.99; qty=150; img="https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500"}
    @{name="Power Bank"; desc="20000mAh portable power bank"; price=59.99; qty=90; img="https://images.unsplash.com/photo-1609592806955-610a7c29bb4e?w=500"}
    @{name="HD Webcam"; desc="1080p webcam with auto-focus"; price=69.99; qty=45; img="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500"}
    @{name="Cable Organizer"; desc="Desktop cable management system"; price=14.99; qty=200; img="https://images.unsplash.com/photo-1558618047-3c8c98de8e4c?w=500"}
)

$clothingProducts = @(
    @{name="Cotton T-Shirt"; desc="Comfortable 100% cotton t-shirt"; price=24.99; qty=100; img="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"}
    @{name="Denim Jeans"; desc="Premium denim jeans with slim fit"; price=79.99; qty=60; img="https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"}
    @{name="Leather Jacket"; desc="Genuine leather jacket"; price=199.99; qty=25; img="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"}
    @{name="Running Shoes"; desc="Lightweight running shoes"; price=129.99; qty=40; img="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"}
    @{name="Wool Sweater"; desc="Cozy wool sweater"; price=89.99; qty=35; img="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500"}
    @{name="Summer Dress"; desc="Light summer dress"; price=59.99; qty=50; img="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500"}
    @{name="Baseball Cap"; desc="Adjustable baseball cap"; price=19.99; qty=80; img="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500"}
    @{name="Winter Coat"; desc="Warm winter coat"; price=159.99; qty=30; img="https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500"}
    @{name="Silk Scarf"; desc="Elegant silk scarf"; price=39.99; qty=45; img="https://images.unsplash.com/photo-1601195853937-43b4aef0a7a1?w=500"}
    @{name="Athletic Shorts"; desc="Moisture-wicking shorts"; price=34.99; qty=70; img="https://images.unsplash.com/photo-1506629905961-b33bd772c2d3?w=500"}
)

$sportsProducts = @(
    @{name="Yoga Mat"; desc="Non-slip yoga mat"; price=39.99; qty=80; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Resistance Bands"; desc="Set of resistance bands"; price=29.99; qty=100; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Basketball"; desc="Official size basketball"; price=49.99; qty=60; img="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500"}
    @{name="Swimming Goggles"; desc="Anti-fog swimming goggles"; price=24.99; qty=90; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Running Belt"; desc="Lightweight running belt"; price=19.99; qty=120; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Tennis Racket"; desc="Professional tennis racket"; price=129.99; qty=35; img="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500"}
    @{name="Gym Towel"; desc="Quick-dry gym towel"; price=14.99; qty=150; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Protein Shaker"; desc="Leak-proof shaker bottle"; price=12.99; qty=200; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Exercise Ball"; desc="Anti-burst exercise ball"; price=34.99; qty=70; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
    @{name="Jump Rope"; desc="Adjustable jump rope"; price=16.99; qty=110; img="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"}
)

Write-Host "`nStarting product addition..." -ForegroundColor Yellow
$totalAdded = 0

foreach ($cat in $categories) {
    Write-Host "`nProcessing category: $($cat.name)" -ForegroundColor Cyan
    
    # Get the first subcategory if available
    $subcategoryId = $null
    if ($cat.subcategories -and $cat.subcategories.Count -gt 0) {
        $subcategoryId = $cat.subcategories[0].subcategoryId
        Write-Host "Using subcategory: $($cat.subcategories[0].name)" -ForegroundColor Yellow
    } else {
        Write-Host "No subcategories available, skipping this category" -ForegroundColor Red
        continue
    }
    
    # Select products based on category name
    $productsToAdd = @()
    if ($cat.name -like "*Electronic*" -or $cat.name -eq "Electronics") {
        $productsToAdd = $electronicsProducts
    } elseif ($cat.name -like "*fashion*" -or $cat.name -like "*Apparel*" -or $cat.name -like "*saree*") {
        $productsToAdd = $clothingProducts
    } elseif ($cat.name -like "*Sport*") {
        $productsToAdd = $sportsProducts
    } else {
        # Generic products for unknown categories
        $productsToAdd = @(
            @{name="Quality Product 1"; desc="Premium quality item"; price=29.99; qty=50; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Professional Item 2"; desc="Professional grade equipment"; price=49.99; qty=75; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Essential Product 3"; desc="Essential daily use item"; price=19.99; qty=100; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Premium Solution 4"; desc="Premium quality solution"; price=89.99; qty=30; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Deluxe Package 5"; desc="Complete deluxe package"; price=159.99; qty=20; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Compact Design 6"; desc="Space-saving design"; price=39.99; qty=60; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Modern Technology 7"; desc="Latest technology features"; price=79.99; qty=40; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Classic Style 8"; desc="Timeless classic style"; price=69.99; qty=45; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Advanced Features 9"; desc="Advanced feature set"; price=99.99; qty=35; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
            @{name="Essential Item 10"; desc="Must-have essential"; price=24.99; qty=80; img="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500"}
        )
    }
    
    # Add up to 10 products for this category
    for ($i = 0; $i -lt 10 -and $i -lt $productsToAdd.Count; $i++) {
        $p = $productsToAdd[$i]
        
        $productBody = @{
            name = $p.name
            description = $p.desc
            price = $p.price
            quantity = $p.qty
            mainImageUrl = $p.img
            categoryId = $cat.categoryId
            subcategoryId = $subcategoryId
        } | ConvertTo-Json
        
        try {
            $result = Invoke-RestMethod -Uri "$API_BASE/api/product/without-variants" -Method POST -Headers $headers -Body $productBody
            Write-Host "  ✅ Added: $($p.name)" -ForegroundColor Green
            $totalAdded++
        }
        catch {
            Write-Host "  ❌ Failed: $($p.name) - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 150
    }
}

Write-Host "`n🎉 Product population completed!" -ForegroundColor Green
Write-Host "📊 Total products added: $totalAdded" -ForegroundColor Green

if ($totalAdded -gt 0) {
    Write-Host "`nSuccess! You can now check your application to see the new products." -ForegroundColor Yellow
}
