using FluentValidation;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.ChangePassword;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.OldPassword)
            .NotEmpty().WithMessage("Mật khẩu cũ không được để trống.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống.")
            .Must(PasswordPolicy.IsValid).WithMessage("Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số.");
    }
}
