# ============================================================================
# YaaImg ASP.NET Core Backend Dockerfile
# Multi-stage build: restore → build → publish → runtime
# ============================================================================

# Stage 1: Restore dependencies
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

# Copy solution and project files first (for better layer caching)
COPY apps/api/src/YaaImg.slnx ./
COPY apps/api/src/YaaImg.Api/YaaImg.Api.csproj ./YaaImg.Api/
COPY apps/api/src/YaaImg.Application/YaaImg.Application.csproj ./YaaImg.Application/
COPY apps/api/src/YaaImg.Domain/YaaImg.Domain.csproj ./YaaImg.Domain/
COPY apps/api/src/YaaImg.Infrastructure/YaaImg.Infrastructure.csproj ./YaaImg.Infrastructure/
COPY apps/api/src/YaaImg.Contracts/YaaImg.Contracts.csproj ./YaaImg.Contracts/

RUN dotnet restore YaaImg.Api/YaaImg.Api.csproj

# Stage 2: Build and publish
FROM restore AS build
COPY apps/api/src/ ./
RUN dotnet publish YaaImg.Api/YaaImg.Api.csproj -c Release -o /app/publish --no-restore

# Stage 3: Runtime (minimal image)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install curl for Docker health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

COPY --from=build /app/publish .

# Set environment defaults
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

USER appuser
ENTRYPOINT ["dotnet", "YaaImg.Api.dll"]
