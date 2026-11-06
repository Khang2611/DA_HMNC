using FluentValidation;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccountById;

public class GetAccountByIdQueryValidator : AbstractValidator<GetAccountByIdQuery>
{
    public GetAccountByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Id tài khoản không hợp lệ.");
    }
}
