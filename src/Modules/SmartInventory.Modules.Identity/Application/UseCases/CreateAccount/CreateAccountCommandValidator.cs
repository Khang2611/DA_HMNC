using System.Text.RegularExpressions;
using FluentValidation;
using SmartInventory.Modules.Identity.Domain;

namespace SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;

public class CreateAccountCommandValidator : AbstractValidator<CreateAccountCommand>
{
    private static readonly Regex UsernameRegex = new(@"^[a-zA-Z0-9._-]+$", RegexOptions.Compiled);

    public CreateAccountCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username không được để trống.")
            .Length(3, 50).WithMessage("Username phải từ 3 đến 50 ký tự.")
            .Matches(UsernameRegex).WithMessage("Username chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch nối.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .Must(PasswordPolicy.IsValid).WithMessage("Mật khẩu phải có tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số.");

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
