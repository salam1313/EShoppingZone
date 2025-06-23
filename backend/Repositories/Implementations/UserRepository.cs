using Microsoft.EntityFrameworkCore;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;

namespace EshoppingZoneAPI.Repositories.Implementations
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByEmailAndRoleAsync(string email, string role)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.Role == role);
        }
    }
}
