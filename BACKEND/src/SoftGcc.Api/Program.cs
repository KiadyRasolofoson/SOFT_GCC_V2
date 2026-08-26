using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SoftGcc.Api.Hubs;
using SoftGcc.Api.Middlewares;
using SoftGcc.Application;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Infrastructure;
using SoftGcc.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

if (OperatingSystem.IsWindows())
{
    builder.Configuration
        .AddJsonFile("appsettings.Windows.json", optional: true, reloadOnChange: true)
        .AddEnvironmentVariables();
}

if (string.IsNullOrWhiteSpace(builder.Configuration["ConnectionStrings:DefaultConnection"]))
{
    throw new InvalidOperationException(DatabaseInitializer.MissingConnectionMessage());
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<INotificationPublisher, SignalRNotificationPublisher>();
builder.Services.AddSignalR();

#region Cors configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
               "http://localhost:5173",
               "http://localhost:4201",
               "http://localhost:5189",
               "http://151.80.218.41",
               "http://151.80.218.41:5173",
               "http://151.80.218.41:5003",
               "http://151.80.218.41:80",
               "http://37.59.76.165",
               "http://37.59.76.165:5003",
               "http://37.59.76.165:80",
               "http://37.59.76.165:5173"
           )
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials();
    });
});
#endregion

#region Authentification JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("CanViewEvaluation", policy =>
        policy.Requirements.Add(new CanViewEvaluationRequirement()));
    options.AddPolicy("CanEditEvaluation", policy =>
        policy.Requirements.Add(new CanEditEvaluationRequirement()));
    options.AddPolicy("CanValidateEvaluation", policy =>
        policy.Requirements.Add(new CanValidateEvaluationRequirement()));
    options.AddPolicy("CanDelegateEvaluation", policy =>
        policy.Requirements.Add(new CanDelegateEvaluationRequirement()));

    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "roleId" &&
                (c.Value == "1" || c.Value == "3" || c.Value == "4"))));
});
#endregion

builder.Services.AddControllers(options =>
    {
        options.SuppressAsyncSuffixInActionNames = false;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "SOFTCARRIERE ET COMPETENCE API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Veuillez entrer le token JWT ici. Exemple : Bearer <token>",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

await DatabaseInitializer.InitializeAsync(app.Services, app.Configuration, app.Environment);

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseCors("AllowReactApp");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SOFTCARRIERE ET COMPETENCE API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseMiddleware<LicenseCheckMiddleware>();
app.UseAuthorization();

app.MapHub<NotificationHub>("/hubs/notification");
app.MapControllers();

app.Run();
