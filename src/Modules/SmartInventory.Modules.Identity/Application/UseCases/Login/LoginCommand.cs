using MediatR;
using SmartInventory.Modules.Identity.Application.DTOs;

namespace SmartInventory.Modules.Identity.Application.UseCases.Login;

public record LoginCommand(string Username, string Password) : IRequest<LoginResponse>;
