FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /app

COPY . .

RUN dotnet restore
RUN dotnet build -c Release

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/bin/Release/net10.0 .

EXPOSE 5000

ENTRYPOINT ["dotnet", "ConferenceManager.dll"]
