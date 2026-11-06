using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SmartInventory.Modules.Identity.Application.DTOs;
using SmartInventory.Modules.Identity.Application.UseCases.ChangePassword;
using SmartInventory.Modules.Identity.Application.UseCases.CreateAccount;
using SmartInventory.Modules.Identity.Application.UseCases.Login;
using SmartInventory.Modules.Identity.Domain;
using SmartInventory.Modules.Identity.Endpoints;

namespace SmartInventory.Api.IntegrationTests;

[Trait("Feature", "IDENTITY")]
public class IdentityIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IClassFixture<MsSqlDatabaseFixture>
{
    private readonly HttpClient _client;
    private const string AdminUsername = "bootstrap_admin";
    private const string AdminPassword = "BootstrapAdmin123!";

    public IdentityIntegrationTests(WebApplicationFactory<Program> factory, MsSqlDatabaseFixture fixture)
    {
        var customFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:Default", fixture.ConnectionString);
            builder.UseSetting("Jwt:Issuer", "SmartInventoryTest");
            builder.UseSetting("Jwt:Audience", "SmartInventoryTestClients");
            builder.UseSetting("Jwt:SigningKey", "TestSigningKey_AtLeast_32CharactersLong_Security_Key_12345");
            builder.UseSetting("Jwt:ExpiresMinutes", "60");
            builder.UseSetting("Bootstrap:AdminUsername", AdminUsername);
            builder.UseSetting("Bootstrap:AdminPassword", AdminPassword);
            builder.UseSetting("Bootstrap:AdminEmail", "bootstrap_admin@smartinventory.com");
        });

        _client = customFactory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_Returns200AndToken()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(AdminUsername, AdminPassword));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.Equal(AdminUsername, result.User.Username);
        Assert.Equal(nameof(AccountRole.QTV), result.User.Role);
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(AdminUsername, "WrongPass123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithLockedAccount_Returns403WithReason()
    {
        var adminToken = await GetAdminTokenAsync();

        // Create an account then lock it
        var username = $"locked_user_{Guid.NewGuid():N}"[..20];
        var createResponse = await CreateAccountAsync(adminToken, username, "UserLocked123!", "Locked User", $"{username}@test.com", AccountRole.NhanVienKho);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<AccountDto>();
        Assert.NotNull(created);

        // Lock the account
        var lockResponse = await UpdateStatusAsync(adminToken, created.Id, AccountStatus.Locked);
        Assert.Equal(HttpStatusCode.OK, lockResponse.StatusCode);

        // Attempt login
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(username, "UserLocked123!"));
        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);

        var content = await loginResponse.Content.ReadAsStringAsync();
        Assert.Contains("khóa", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetMe_WithoutToken_Returns401()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAccounts_WhenCalledByNonAdmin_Returns403()
    {
        var adminToken = await GetAdminTokenAsync();

        var username = $"worker_{Guid.NewGuid():N}"[..20];
        await CreateAccountAsync(adminToken, username, "WorkerPass123!", "Kho Worker", $"{username}@test.com", AccountRole.NhanVienKho);

        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(username, "WorkerPass123!"));
        var loginData = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(loginData);

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/accounts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData.AccessToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateAccount_WithDuplicateUsernameOrEmail_Returns409()
    {
        var adminToken = await GetAdminTokenAsync();

        var username = $"dup_user_{Guid.NewGuid():N}"[..20];
        var email = $"{username}@test.com";

        var res1 = await CreateAccountAsync(adminToken, username, "ValidPassword123!", "User Original", email, AccountRole.NhanVienKho);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        var res2 = await CreateAccountAsync(adminToken, username, "ValidPassword123!", "User Dup", $"other_{email}", AccountRole.NhanVienKho);
        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task UpdateAccountStatus_WhenQtvSelfLocks_Returns422()
    {
        var adminToken = await GetAdminTokenAsync();

        // Get admin's own id
        var meRes = await GetMeAsync(adminToken);
        var me = await meRes.Content.ReadFromJsonAsync<AccountDto>();
        Assert.NotNull(me);

        var lockResponse = await UpdateStatusAsync(adminToken, me.Id, AccountStatus.Locked);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, lockResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateAccount_WhenDemotingLastActiveQtv_Returns422()
    {
        var adminToken = await GetAdminTokenAsync();

        var meRes = await GetMeAsync(adminToken);
        var me = await meRes.Content.ReadFromJsonAsync<AccountDto>();
        Assert.NotNull(me);

        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/accounts/{me.Id}")
        {
            Content = JsonContent.Create(new UpdateAccountRequest(
                me.FullName,
                me.Email,
                AccountRole.QuanLyKho))
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_ThenLoginWithNewPassword_Succeeds()
    {
        var adminToken = await GetAdminTokenAsync();

        var username = $"pwd_user_{Guid.NewGuid():N}"[..20];
        const string oldPass = "OldPassword123!";
        const string newPass = "NewPassword123!";

        await CreateAccountAsync(adminToken, username, oldPass, "Password User", $"{username}@test.com", AccountRole.QuanLyKho);

        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(username, oldPass));
        var loginData = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(loginData);

        var changePwdReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/change-password")
        {
            Content = JsonContent.Create(new ChangePasswordCommand(oldPass, newPass))
        };
        changePwdReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData.AccessToken);

        var changePwdRes = await _client.SendAsync(changePwdReq);
        Assert.Equal(HttpStatusCode.NoContent, changePwdRes.StatusCode);

        // Login with old password should fail
        var oldLoginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(username, oldPass));
        Assert.Equal(HttpStatusCode.Unauthorized, oldLoginRes.StatusCode);

        // Login with new password should succeed
        var newLoginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(username, newPass));
        Assert.Equal(HttpStatusCode.OK, newLoginRes.StatusCode);
    }

    [Fact]
    public async Task Login_ExceedingRateLimit_Returns429()
    {
        var responses = new List<HttpResponseMessage>();

        for (var i = 0; i < 7; i++)
        {
            var res = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand("rate_limit_user", "AnyPassword123!"));
            responses.Add(res);
        }

        Assert.Contains(responses, r => r.StatusCode == HttpStatusCode.TooManyRequests);
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginCommand(AdminUsername, AdminPassword));
        var data = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return data!.AccessToken;
    }

    private async Task<HttpResponseMessage> GetMeAsync(string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    private async Task<HttpResponseMessage> CreateAccountAsync(
        string token, string username, string password, string fullName, string email, AccountRole role)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/accounts")
        {
            Content = JsonContent.Create(new CreateAccountCommand(username, password, fullName, email, role))
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    private async Task<HttpResponseMessage> UpdateStatusAsync(string token, int accountId, AccountStatus status)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/accounts/{accountId}/status")
        {
            Content = JsonContent.Create(new UpdateAccountStatusRequest(status))
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }
}
