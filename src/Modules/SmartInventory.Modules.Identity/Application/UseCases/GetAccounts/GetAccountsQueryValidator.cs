using FluentValidation;

namespace SmartInventory.Modules.Identity.Application.UseCases.GetAccounts;

public class GetAccountsQueryValidator : AbstractValidator<GetAccountsQuery>
{
    public GetAccountsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Kích thước trang (pageSize) phải từ 1 đến 100.");
    }
}
