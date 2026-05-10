# Railway Deployment Guide

## Overview

Deploy .NET Core backend API + PostgreSQL database to Railway.

## Prerequisites

- Railway account (Hobby plan ~$5/month)
- GitHub repo connected
- Docker configured locally (for testing)

## Step-by-Step Setup

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Connect GitHub repo: `luchoespejo/ConferenceManager`
5. Select repository → **Deploy**

### 2. Add Services

Railway auto-detects backend if Dockerfile exists. Add manually if needed:

#### PostgreSQL Database

1. Click **"Add Service"** → **Add from Marketplace**
2. Select **PostgreSQL**
3. Click **Deploy**

Auto-creates connection string in environment variables.

#### .NET Backend

1. Click **"New Service"** → **GitHub Repo**
2. Select ConferenceManager repo
3. **Root Directory:** `./backend`
4. **Dockerfile:** Auto-detected or specify `backend/Dockerfile`
5. Click **Deploy**

### 3. Configure Environment Variables

Click service → **Variables** tab

Add:

```
# JWT
Jwt__SecretKey=your-secret-key-here (min 32 chars)
Jwt__Issuer=ConferenceManager
Jwt__Audience=ConferenceManager

# Database (auto-filled by Railway)
ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}

# Email (Resend)
Resend__ApiKey=re_your_api_key_here
Resend__FromAddress=noreply@tuplataforma.com
Email__UseFake=false

# CORS
Cors__AllowedOrigins__0=https://your-vercel-site.vercel.app
Cors__AllowedOrigins__1=https://tuplataforma.com

# App URLs
App__BaseUrl=https://api.your-domain.com
App__SiteUrl=https://your-domain.com
```

### 4. Deploy

1. Push changes to GitHub:
   ```bash
   git push origin main
   ```

2. Railway automatically:
   - Pulls latest code
   - Builds Docker image
   - Starts container
   - Runs migrations (if configured)

3. Check deployment:
   - Railway dashboard → **Deployments**
   - View logs: **Logs** tab
   - Get URL: **Settings** → **Domains**

## Post-Deployment

### Get API URL

1. Railway dashboard → Backend service
2. Click **Settings** → **Domains**
3. Copy URL: `https://conferencemanager-api.railway.app`

Share with Vercel:
- Set `NEXT_PUBLIC_API_URL` in Vercel env vars
- Redeploy Next.js site

### Database Connection

Railway provides PostgreSQL connection string in env:

```
${{Postgres.DATABASE_URL}}
```

Used by .NET:
```csharp
services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
```

## EF Core Migrations

### Apply migrations on deploy

Add to Dockerfile:

```dockerfile
# Run migrations
RUN dotnet ef database update -c AppDbContext

# Start app
ENTRYPOINT ["dotnet", "ConferenceManager.dll"]
```

Or manually:

```bash
dotnet ef database update -c AppDbContext
```

### Create new migration

```bash
cd backend
dotnet ef migrations add MigrationName -c AppDbContext
git push  # Railway auto-applies
```

## Monitoring

### Logs

1. Railway dashboard → Service
2. **Logs** tab shows real-time output
3. Search/filter logs

### Metrics

- CPU usage
- Memory usage
- Network I/O
- Database connections

### Alerts

1. **Settings** → **Alerts**
2. Create alerts for:
   - High CPU (>80%)
   - High memory (>90%)
   - Deployment failures
   - Response time issues

## Custom Domain

### Point domain to Railway

1. Railway → **Settings** → **Domains**
2. Add custom domain: `api.tuplataforma.com`
3. Follow DNS instructions:
   ```
   CNAME: api.tuplataforma.com → railway.app (provided)
   ```
4. Wait for DNS propagation (~5-30 min)

### Update Application

Update env var:

```
App__BaseUrl=https://api.tuplataforma.com
```

Redeploy for changes to take effect.

## Database Management

### Access PostgreSQL

**From Railway CLI:**

```bash
railway link  # Select project
railway run psql
```

**Connection string:**
```
postgresql://user:password@host:port/database
```

(Found in Railway env vars)

### Backup Database

Railway automatically backs up daily. Manual backup:

```bash
# Export dump
pg_dump $DATABASE_URL > backup.sql

# Restore from dump
psql $DATABASE_URL < backup.sql
```

### Scaling Database

1. Railway → PostgreSQL service
2. **Settings** → **Scale**
3. Increase RAM/Storage as needed

## Troubleshooting

### Build Fails

Check build logs:
1. Railway → Deployments
2. Click failed deployment
3. View error in **Build logs**

Common issues:
- Missing env var
- Docker build error
- Root directory wrong

### Application crashes

Check app logs:
1. **Logs** tab
2. Look for exceptions
3. Check env vars are set correctly

### Database connection error

```
Npgsql.NpgsqlException: timeout expired
```

**Solutions:**
- Check `ConnectionStrings__DefaultConnection` is correct
- Verify PostgreSQL service is running
- Check firewall/network access

### CORS errors from Vercel

**Browser console shows:**
```
Access to XMLHttpRequest blocked by CORS
```

**Fix:**
1. Update `Cors__AllowedOrigins` with Vercel domain
2. Redeploy backend
3. Check response headers include `Access-Control-Allow-Origin`

## Environment-Specific Configuration

### Development (local)

```
appsettings.Development.json
Email__UseFake=true
Jwt__SecretKey=dev-secret
```

### Production (Railway)

```
Railway Environment Variables
Email__UseFake=false
Jwt__SecretKey=strong-production-secret
Resend__ApiKey=actual-api-key
```

## Scaling & Performance

### Hobby Plan Limits

- 500 hours/month included
- Limited to 1 service with persistent volume
- No auto-scaling
- Shared infrastructure

### Pro Plan ($12/month)

- Unlimited hours
- Multiple services
- Priority support
- Custom domains included

### When to upgrade

- Traffic exceeds capacity
- Multiple databases
- Private networking needed
- SLA required

## Deployment Pipeline

```
┌─────────────────┐
│  Push to GitHub │
│   (main branch) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Railway detects │
│  new commit     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Docker   │
│  image from     │
│  Dockerfile     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run migrations │
│  (if needed)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Start container│
│  Listen on port │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health checks  │
│  pass? Yes ✓    │
│  Deployment OK  │
└─────────────────┘
```

## Dockerfile Reference

Current `backend/Dockerfile` should have:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .

# Run migrations
RUN dotnet ef database update -c AppDbContext || true

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "ConferenceManager.dll"]
```

## Monitoring Checklist

- [ ] Backend builds successfully
- [ ] Database migrations applied
- [ ] API responds to requests
- [ ] Logs show no errors
- [ ] Vercel can reach backend URL
- [ ] CORS headers present
- [ ] Email service configured
- [ ] JWT tokens working
- [ ] Database backups enabled
- [ ] Custom domain resolves

## Support

- **Railway Docs:** https://docs.railway.app
- **.NET Deployment:** https://docs.railway.app/guides/deployments/builds/dockerfile
- **PostgreSQL:** https://docs.railway.app/databases/postgresql
- **Troubleshooting:** https://docs.railway.app/troubleshooting
