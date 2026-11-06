using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SmartInventory.SharedKernel.Exceptions;

namespace SmartInventory.Api.Middlewares;

public class DomainExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly IHostEnvironment _env;

    public DomainExceptionHandler(IProblemDetailsService problemDetailsService, IHostEnvironment env)
    {
        _problemDetailsService = problemDetailsService;
        _env = env;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        int statusCode;
        string title;
        string detail;
        Dictionary<string, object?> extensions = new(StringComparer.Ordinal);

        switch (exception)
        {
            case ValidationException validationException:
                statusCode = StatusCodes.Status400BadRequest;
                title = "Validation Error";
                detail = "One or more validation errors occurred.";
                var errors = validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray(),
                        StringComparer.Ordinal);
                extensions["errors"] = errors;
                break;

            case UnauthorizedException unauthorizedException:
                statusCode = StatusCodes.Status401Unauthorized;
                title = "Unauthorized";
                detail = unauthorizedException.Message;
                break;

            case ForbiddenException forbiddenException:
                statusCode = StatusCodes.Status403Forbidden;
                title = "Forbidden";
                detail = forbiddenException.Message;
                break;

            case NotFoundException notFoundException:
                statusCode = StatusCodes.Status404NotFound;
                title = "Resource Not Found";
                detail = notFoundException.Message;
                break;

            case ConflictException conflictException:
                statusCode = StatusCodes.Status409Conflict;
                title = "Conflict";
                detail = conflictException.Message;
                break;

            case DomainException domainException:
                statusCode = StatusCodes.Status422UnprocessableEntity;
                title = "Domain Rule Violation";
                detail = domainException.Message;
                break;

            default:
                statusCode = StatusCodes.Status500InternalServerError;
                title = "Internal Server Error";
                detail = _env.IsDevelopment()
                    ? exception.ToString()
                    : "An unexpected error occurred.";
                break;
        }

        httpContext.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path,
        };

        foreach (var (key, value) in extensions)
        {
            problemDetails.Extensions[key] = value;
        }

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception,
        });
    }
}
