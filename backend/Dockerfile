# NOTE: This Dockerfile is for local single-project builds only.
# For Render/production: use the Dockerfile at repo root (multi-project context required).
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY . .
RUN dotnet restore ConferenceManager.csproj
RUN dotnet publish ConferenceManager.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "ConferenceManager.dll"]
