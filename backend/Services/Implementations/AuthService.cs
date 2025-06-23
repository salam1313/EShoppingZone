using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;
using EshoppingZoneAPI.Repositories.Interfaces;
using EshoppingZoneAPI.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace EshoppingZoneAPI.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<string?> Register(AuthRegisterDTO dto, string role)
        {
            // Email regex validation
            var emailPattern = @"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$";
            if (string.IsNullOrWhiteSpace(dto.Email) || !Regex.IsMatch(dto.Email, emailPattern))
                return "Invalid email address format.";

            var existingUser = await _userRepository.GetByEmailAndRoleAsync(dto.Email, role);
            if (existingUser != null)
                return "User already exists for this role";

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            return "Registration successful";
        }        public async Task<AuthLoginResponseDTO?> Login(AuthLoginDTO dto)
        {
            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return null;

            return new AuthLoginResponseDTO
            {
                Token = GenerateJwtToken(user),
                Name = user.Name,
                Email = user.Email,
                Role = user.Role ?? "User",
                Address = "" // User model doesn't have Address property
            };
        }        public async Task<AuthLoginResponseDTO?> Login(AuthLoginDTO dto, string expectedRole)
        {
            // Find user by email and role
            var user = await _userRepository.GetByEmailAndRoleAsync(dto.Email, expectedRole);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return null;
            
            return new AuthLoginResponseDTO
            {
                Token = GenerateJwtToken(user),
                Name = user.Name,
                Email = user.Email,
                Role = user.Role ?? expectedRole,
                Address = "" // User model doesn't have Address property
            };
        }        private string GenerateJwtToken(User user)
        {
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "ThisIsASecretKeyWithAtLeast32Chars123!");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Role, user.Role ?? "User")
                }),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
