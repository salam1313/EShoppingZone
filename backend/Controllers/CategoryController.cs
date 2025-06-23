using Microsoft.AspNetCore.Mvc;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace EshoppingZoneAPI.Controllers
{
    [Route("api/category")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IRepository<Category> _categoryRepo;

        public CategoryController(AppDbContext context, IRepository<Category> categoryRepo)
        {
            _context = context;
            _categoryRepo = categoryRepo;
        }

        [HttpPost]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddCategory([FromBody] CategoryDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            // Only accept name for category creation, subcategories are not accepted here
            var category = new Category
            {
                Name = dto.Name,
                Subcategories = new List<Subcategory>()
            };
            await _categoryRepo.AddAsync(category);
            await _categoryRepo.SaveChangesAsync();
            return Ok(new { category.CategoryId, category.Name });
        }

        [HttpPost("{catid}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddSubcategoryToCategory(string catid, [FromBody] AddSubcategoryDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }
            // Only use catid from route, ignore CategoryId in payload
            var category = await _context.Categories.Include(c => c.Subcategories).FirstOrDefaultAsync(c => c.CategoryId == catid);
            if (category == null)
                return NotFound(new { message = "Category not found" });
            var sub = new Subcategory { Name = dto.SubcategoryName, Description = dto.Description, CategoryId = catid };
            category.Subcategories.Add(sub);            await _context.SaveChangesAsync();
            return Ok(new { message = "Subcategory added", subcategory = new { sub.SubcategoryId, sub.Name, sub.Description } });
        }

        [HttpPut("{categoryId}/subcategory")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> AddSubcategoryToCategoryV2(string categoryId, [FromBody] SubcategoryDTO dto)
        {
            var category = await _context.Categories.Include(c => c.Subcategories).FirstOrDefaultAsync(c => c.CategoryId == categoryId);
            if (category == null)
                return NotFound(new { message = "Category not found" });
            
            var subcategory = new Subcategory 
            { 
                Name = dto.Name, 
                Description = dto.Description, 
                CategoryId = categoryId 
            };
            
            category.Subcategories.Add(subcategory);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subcategory added", subcategory = new { subcategory.SubcategoryId, subcategory.Name, subcategory.Description } });
        }

        [HttpPut("sub/{subid}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> UpdateSubcategory(string subid, [FromBody] SubcategoryDTO dto)
        {
            var sub = await _context.Subcategories.FirstOrDefaultAsync(s => s.SubcategoryId == subid);
            if (sub == null)
                return NotFound(new { message = "Subcategory not found" });
            sub.Name = dto.Name;
            sub.Description = dto.Description;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subcategory updated", subcategory = new { sub.SubcategoryId, sub.Name, sub.Description } });
        }

        [HttpDelete("sub/{subid}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> DeleteSubcategory(string subid)
        {
            var sub = await _context.Subcategories.FirstOrDefaultAsync(s => s.SubcategoryId == subid);
            if (sub == null)
                return NotFound(new { message = "Subcategory not found" });
            _context.Subcategories.Remove(sub);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subcategory deleted" });
        }        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.Categories
                .Include(c => c.Subcategories)
                .ToListAsync();
            var result = categories.Select(c => new {
                c.CategoryId,
                c.Name,
                Subcategories = c.Subcategories.Select(s => new {
                    s.SubcategoryId,
                    s.Name,
                    s.Description
                }).ToList()
            });
            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategory(string id)
        {
            var category = await _context.Categories
                .Include(c => c.Subcategories)
                .FirstOrDefaultAsync(c => c.CategoryId == id);
            if (category == null)
                return NotFound(new { message = "Category not found" });
            var result = new {
                category.CategoryId,
                category.Name,
                Subcategories = category.Subcategories != null && category.Subcategories.Any()
                    ? category.Subcategories.Select(s => new { s.SubcategoryId, s.Name, s.Description }).Cast<object>().ToList()
                    : new List<object>()
            };
            return Ok(result);
        }

        [HttpGet("sub/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSubcategoryProducts(string id)
        {
            var subcategory = await _context.Subcategories
                .Include(s => s.Products)
                .FirstOrDefaultAsync(s => s.SubcategoryId == id);
            if (subcategory == null)
                return NotFound(new { message = "Subcategory not found" });
            var products = subcategory.Products != null && subcategory.Products.Any()
                ? subcategory.Products.Select(p => new { p.ProductId, p.Name, p.Description, p.Price, p.Quantity }).Cast<object>().ToList()
                : new List<object>();
            var result = new {
                subcategory.SubcategoryId,
                subcategory.Name,
                subcategory.Description,
                Products = products
            };
            return Ok(result);
        }

        [HttpDelete("{catid}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> DeleteCategory(string catid)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == catid);
            if (category == null)
                return NotFound(new { message = "Category not found" });
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Category deleted" });
        }
    }
}
