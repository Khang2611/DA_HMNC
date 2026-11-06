using FluentValidation;

namespace SmartInventory.Modules.Identity.Application.UseCases.UpdateAccountStatus;

public class UpdateAccountStatusCommandValidator : AbstractValidator<UpdateAccountStatusCommand>
{
    public UpdateAccountStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Id tài khoản không hợp lệ.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái không hợp lệ.");
    }
}
