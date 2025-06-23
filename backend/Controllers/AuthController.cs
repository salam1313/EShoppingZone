using EshoppingZoneAPI.DTOs;
using EshoppingZoneAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EshoppingZoneAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] AuthRegisterDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var result = await _authService.Register(dto, "User");
            if (result == "Invalid email address format.")
                return BadRequest(new { message = result });
            if (result == "User already exists for this role")
                return Conflict(new { message = result });
            return Ok(new { message = result });
        }        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] AuthLoginDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var result = await _authService.Login(dto);
            if (result == null)
                return Unauthorized(new { message = "Invalid credentials." });
            return Ok(result);
        }
    }
}
