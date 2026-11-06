using MediatR;

namespace SmartInventory.Modules.Identity.Application.UseCases.ChangePassword;

public record ChangePasswordCommand(string OldPassword, string NewPassword) : IRequest;
