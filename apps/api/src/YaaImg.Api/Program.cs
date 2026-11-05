using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using YaaImg.Api.Middleware;

// Load root .env file if present by traversing parent directories
var searchDir = new DirectoryInfo(Directory.GetCurrentDirectory());
while (searchDir != null)
{
    var envPath = Path.Combine(searchDir.FullName, ".env");
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
            var parts = trimmed.Split('=', 2);
            if (parts.Length == 2)
            {
                var key = parts[0].Trim();
                var value = parts[1].Trim();
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                {
                    Environment.SetEnvironmentVariable(key, value);
                }
            }
        }
        break;
    }
    searchDir = searchDir.Parent;
}

var builder = WebApplication.CreateBuilder(args);

// Register HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Map SUPABASE_DB_URL to ConnectionStrings:DefaultConnection if provided
var dbUrl = Environment.GetEnvironmentVariable("SUPABASE_DB_URL");
if (!string.IsNullOrWhiteSpace(dbUrl))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = dbUrl;
}

// Configure Kestrel port 5000 by default
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
});

// Add Controllers
builder.Services.AddControllers();

// Register Application & Infrastructure Services
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<YaaImg.Application.Interfaces.IStorageService, YaaImg.Infrastructure.Services.SupabaseStorageService>();
builder.Services.AddScoped<YaaImg.Application.Interfaces.IBrandRepository, YaaImg.Infrastructure.Repositories.BrandRepository>();
builder.Services.AddScoped<YaaImg.Application.Services.BrandService>();

builder.Services.AddScoped<YaaImg.Application.Interfaces.IProviderKeyRepository, YaaImg.Infrastructure.Repositories.ProviderKeyRepository>();
builder.Services.AddScoped<YaaImg.Application.Interfaces.IVaultService, YaaImg.Infrastructure.Services.SupabaseVaultService>();
builder.Services.AddHttpClient<YaaImg.Application.Interfaces.IKeyValidationService, YaaImg.Infrastructure.Services.KeyValidationService>();
builder.Services.AddScoped<YaaImg.Application.Services.ProviderKeyService>();

builder.Services.AddScoped<YaaImg.Application.Interfaces.IBrandKitRepository, YaaImg.Infrastructure.Repositories.BrandKitRepository>();
builder.Services.AddScoped<YaaImg.Application.Services.BrandKitService>();

builder.Services.AddScoped<YaaImg.Application.Interfaces.IGenerationRepository, YaaImg.Infrastructure.Repositories.GenerationRepository>();
builder.Services.AddScoped<YaaImg.Application.Interfaces.IImageProcessor, YaaImg.Infrastructure.Services.ImageProcessor>();
builder.Services.AddHttpClient<YaaImg.Application.Interfaces.IImageProvider, YaaImg.Infrastructure.Services.AiImageProvider>();
builder.Services.AddScoped<YaaImg.Application.Services.GenerationService>();

builder.Services.AddScoped<YaaImg.Application.Interfaces.IAdminRepository, YaaImg.Infrastructure.Repositories.AdminRepository>();
builder.Services.AddScoped<YaaImg.Application.Services.AdminService>();

// Configure CORS for Next.js frontend (strict: http://localhost:3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Swagger with JWT Bearer authentication scheme
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "YaaImg API",
        Version = "v1",
        Description = "YaaImg Social Media Image Generation SaaS API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token. Example: 'Bearer eyJhbGci...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement((document) => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

var app = builder.Build();

// 1. Global Problem Details error handling middleware (outermost)
app.UseMiddleware<ProblemDetailsMiddleware>();

// 2. CORS middleware
app.UseCors("AllowFrontend");

// 3. Swagger in Development mode
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YaaImg API v1");
        c.RoutePrefix = "swagger";
    });
}

// 4. JWT Authentication middleware (protects non-public endpoints)
app.UseMiddleware<JwtAuthMiddleware>();

// 5. Map controller routes
app.MapControllers();

app.Run();
