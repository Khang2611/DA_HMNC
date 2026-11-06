using FluentValidation;

namespace SmartInventory.Modules.Identity.Application.UseCases.UpdateAccount;

public class UpdateAccountCommandValidator : AbstractValidator<UpdateAccountCommand>
{
    public UpdateAccountCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Id tài khoản không hợp lệ.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(150).WithMessage("Họ và tên tối đa 150 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(254).WithMessage("Email tối đa 254 ký tự.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ tối đa 255 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Vai trò không hợp lệ.");
    }
}
