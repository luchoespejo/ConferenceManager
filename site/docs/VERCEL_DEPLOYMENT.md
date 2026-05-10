# Vercel Deployment Guide

## Overview

Deploy Next.js public site to Vercel (Hobby plan). Automatic deployments on each push to main branch.

## Prerequisites

✅ **Done:**
- Vercel account (Hobby plan)
- GitHub account with repo access
- Repo pushed to GitHub

## Step-by-Step Setup

### 1. Import Project in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..." → "Project"**
3. Select **GitHub** repository: `luchoespejo/ConferenceManager`
4. Click **Import**

### 2. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./site`

**Build Command:** `npm run build` (default)

**Start Command:** `npm start` (default)

### 3. Set Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.com
```

**Important:** 
- Must start with `NEXT_PUBLIC_` to be available in browser
- Replace `your-backend-url.com` with actual backend URL:
  - **Development:** `http://localhost:5000`
  - **Production:** Your Railway/hosting URL

### 4. Deploy

Click **"Deploy"** button. Wait ~2-3 minutes for build.

On success:
- ✅ Build completed
- ✅ Site URL: `https://your-project.vercel.app`
- ✅ Wildcard domain support for dynamic subdomains

## Post-Deployment

### Access Site

- **Default:** `https://conferencemanager.vercel.app` (example)
- **Subdomains:** `https://tech-conf.conferencemanager.vercel.app`
  (requires DNS configuration)

### Configure Custom Domain

1. Vercel dashboard → **Settings** → **Domains**
2. Add domain: `tuplataforma.com`
3. Update DNS records:
   ```
   Name: @
   Type: ALIAS/CNAME
   Value: cname.vercel.sh
   ```
4. Setup wildcard: `*.tuplataforma.com` → same CNAME

### Monitor Deployments

Vercel dashboard shows:
- ✅ Build logs
- 📊 Performance metrics
- 🔍 Deployment history
- 📱 Preview URLs for PRs

## Environment Variables by Stage

### Preview (Pull Requests)

```
NEXT_PUBLIC_API_URL = http://localhost:5000
```

### Production (main branch)

```
NEXT_PUBLIC_API_URL = https://api.tuplataforma.com
```

**Set different values per environment:**
1. Dashboard → **Settings** → **Environment Variables**
2. Select environment: Production / Preview / Development
3. Add/update variables

## Automatic Deployments

**Trigger:** Push to `main` branch

```bash
git push origin main
# Vercel automatically starts build
# Check: vercel.com/dashboard → deployments
```

**Preview URLs for PRs:**
- Create PR → Vercel creates preview deployment
- Share preview URL with team
- Merge PR → Production deployment starts

## Debugging Deployment Issues

### Build Failed

Check build logs:
1. Vercel dashboard → **Deployments**
2. Click failed deployment
3. View **Build logs** for errors

Common issues:
- Missing env var: `NEXT_PUBLIC_API_URL`
- Wrong root directory: Verify `./site`
- API URL unreachable: Check backend is running

### Site 404 / Not Found

**Problem:** Site URL works but shows 404

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Verify backend is accessible from Vercel (public URL)
3. Check `/api/public/[slug]` endpoint returns data

### Build Takes Too Long

**Hobby plan limits:**
- Max build time: 45 seconds
- Max function duration: 10 seconds
- If exceeded: upgrade to Pro plan

## Monitoring

### Performance

Vercel provides analytics:
- Page load times
- Web Vitals (CLS, LCP, FID)
- Error tracking
- Request logs

**Access:** Dashboard → **Analytics**

### Logs

View real-time logs:
```bash
# Using Vercel CLI
vercel logs https://your-site.vercel.app
```

## Rollback to Previous Deployment

1. Dashboard → **Deployments**
2. Find previous working deployment
3. Click **"Promote to Production"**

## Scaling Beyond Hobby Plan

When ready:

**Pro Plan ($20/month):**
- Unlimited deployments
- 45-second build limit remains
- Priority support
- Advanced analytics

**Enterprise:**
- Custom infrastructure
- Dedicated support
- SLA guarantees

## Database & Backend Integration

### API Calls from Site

Site makes requests to backend API:

```typescript
// app/page.tsx
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
fetch(`${apiUrl}/api/public/${slug}`)
```

**Ensure backend is:**
- ✅ Running and accessible
- ✅ CORS configured for Vercel domain
- ✅ Using public URL (not localhost)

### CORS Configuration

Backend must allow Vercel domain:

```csharp
// backend/Program.cs
app.UseCors(builder => builder
    .WithOrigins(
        "http://localhost:3000",
        "https://yourapp.vercel.app",
        "https://tuplataforma.com"
    )
    .AllowAnyHeader()
    .AllowAnyMethod()
);
```

## Vercel vs Railway

| Feature | Vercel | Railway |
|---------|--------|--------|
| **Purpose** | Frontend (Next.js) | Backend (.NET) + Database |
| **Plan** | Hobby free | Hobby $5/month |
| **Auto-deploy** | Yes (Git push) | Yes (Git push) |
| **Scaling** | Auto-scale | Manual sizing |
| **Domains** | Unlimited | Per project |

## Troubleshooting Checklist

- [ ] GitHub repo connected to Vercel
- [ ] Root directory set to `./site`
- [ ] `NEXT_PUBLIC_API_URL` environment variable set
- [ ] Backend is public and accessible
- [ ] CORS headers configured on backend
- [ ] Build completes in <45 seconds
- [ ] Site loads and shows conference data
- [ ] Subdomains resolve (if using custom domain)

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Environment Variables:** https://vercel.com/docs/environment-variables
- **Troubleshooting:** https://vercel.com/docs/troubleshoot
