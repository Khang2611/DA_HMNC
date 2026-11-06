using FluentValidation;
using MediatR;
using SmartInventory.SharedKernel.Behaviors;

namespace SmartInventory.Inventory.UnitTests.Behaviors;

public class ValidationBehaviorTests
{
    public record SampleCommand(string Name) : IRequest<string>;

    public class SampleCommandValidator : AbstractValidator<SampleCommand>
    {
        public SampleCommandValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        }
    }

    [Fact]
    public async Task Handle_WhenNoValidators_CallsNextDelegate()
    {
        var behavior = new ValidationBehavior<SampleCommand, string>([]);
        var command = new SampleCommand("Test");
        var nextCalled = false;

        var result = await behavior.Handle(
            command,
            (cancellationToken) =>
            {
                nextCalled = true;
                return Task.FromResult("Success");
            },
            CancellationToken.None);

        Assert.True(nextCalled);
        Assert.Equal("Success", result);
    }

    [Fact]
    public async Task Handle_WhenValidationPasses_CallsNextDelegate()
    {
        var validator = new SampleCommandValidator();
        var behavior = new ValidationBehavior<SampleCommand, string>([validator]);
        var command = new SampleCommand("Valid Name");
        var nextCalled = false;

        var result = await behavior.Handle(
            command,
            (cancellationToken) =>
            {
                nextCalled = true;
                return Task.FromResult("Success");
            },
            CancellationToken.None);

        Assert.True(nextCalled);
        Assert.Equal("Success", result);
    }

    [Fact]
    public async Task Handle_WhenValidationFails_ThrowsValidationException()
    {
        var validator = new SampleCommandValidator();
        var behavior = new ValidationBehavior<SampleCommand, string>([validator]);
        var command = new SampleCommand(string.Empty);
        var nextCalled = false;

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            behavior.Handle(
                command,
                (cancellationToken) =>
                {
                    nextCalled = true;
                    return Task.FromResult("Success");
                },
                CancellationToken.None));

        Assert.False(nextCalled);
        Assert.Contains(exception.Errors, e => e.PropertyName == "Name");
    }
}
