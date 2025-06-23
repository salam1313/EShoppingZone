using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Models;

namespace EshoppingZoneAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<string?> Register(AuthRegisterDTO dto, string role);
        Task<AuthLoginResponseDTO?> Login(AuthLoginDTO dto);
        Task<AuthLoginResponseDTO?> Login(AuthLoginDTO dto, string expectedRole);
    }
}
