FROM mcr.microsoft.com/dotnet/sdk:10.0

WORKDIR /app

COPY . .

RUN dotnet restore

EXPOSE 5000

ENTRYPOINT ["dotnet", "watch", "run"]
