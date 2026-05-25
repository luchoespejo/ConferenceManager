# Build stage — context: repo root (required for multi-project references)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore layer: copy only csproj files first (cache-friendly)
COPY ConferenceManager.Domain/ConferenceManager.Domain.csproj ConferenceManager.Domain/
COPY ConferenceManager.Application/ConferenceManager.Application.csproj ConferenceManager.Application/
COPY ConferenceManager.Infrastructure/ConferenceManager.Infrastructure.csproj ConferenceManager.Infrastructure/
COPY backend/ConferenceManager.csproj backend/

RUN dotnet restore backend/ConferenceManager.csproj

# Copy source
COPY ConferenceManager.Domain/ ConferenceManager.Domain/
COPY ConferenceManager.Application/ ConferenceManager.Application/
COPY ConferenceManager.Infrastructure/ ConferenceManager.Infrastructure/
COPY backend/ backend/

RUN dotnet publish backend/ConferenceManager.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "ConferenceManager.dll"]
