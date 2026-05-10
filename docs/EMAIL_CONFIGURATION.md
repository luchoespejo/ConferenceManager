# Email Configuration Guide

## Overview

ConferenceManager uses **Resend** for email delivery in production and **Fake Email Service** for development.

- **Development:** Emails logged to console/logs, not sent to Resend
- **Production:** Emails sent via Resend API

## Development Setup

### Default (Fake Mode - Recommended)

```json
// appsettings.Development.json
{
  "Email": {
    "UseFake": true
  },
  "Resend": {
    "ApiKey": "re_YOUR_RESEND_API_KEY_HERE",
    "FromAddress": "noreply@tuplataforma.com"
  }
}
```

**Behavior:** All emails are logged with content instead of being sent.

**Check logs for email content:**
```
FAKE EMAIL — To: user@example.com | Name: Test User | Verification URL: http://localhost:5000/api/auth/verificar-email?token=...
```

### Testing with Real Resend (Optional)

To test email delivery during development:

1. Get API key from [resend.com](https://resend.com)
2. Create verified domain (Resend requires domain verification)
3. Set `UseFake: false` in appsettings.Development.json
4. Add valid API key

```json
{
  "Email": {
    "UseFake": false
  },
  "Resend": {
    "ApiKey": "re_abc123xyz789",
    "FromAddress": "noreply@yourdomain.com"
  }
}
```

## Production Setup

### Prerequisites

1. **Resend Account:** Create at [resend.com](https://resend.com)
2. **API Key:** Generate from dashboard
3. **Domain:** Verify your domain (e.g., `tuplataforma.com`)

### Configuration

Set environment variables or secrets:

```bash
# Environment variables
export Resend__ApiKey="re_your_api_key_here"
export Resend__FromAddress="noreply@tuplataforma.com"
export Email__UseFake="false"
```

Or in `appsettings.Production.json`:

```json
{
  "Email": {
    "UseFake": false
  },
  "Resend": {
    "ApiKey": "re_your_api_key_here",
    "FromAddress": "noreply@tuplataforma.com"
  }
}
```

### Railway Deployment

1. Go to project settings → Environment
2. Add variables:
   - `Resend__ApiKey`: Your Resend API key
   - `Resend__FromAddress`: Your verified sender email
   - `Email__UseFake`: `false`

3. Redeploy

## Email Templates

### Verification Email

Sent on user registration:

- **To:** User's email
- **Subject:** "Confirmá tu cuenta en ConferenceManager"
- **Content:** Verification link (expires in 24 hours)
- **Trigger:** `AuthService.RegistrarAsync()`

## Troubleshooting

### "Resend:ApiKey is not configured" Error

**Problem:** ApiKey is empty or missing  
**Solution:** Check appsettings file or environment variables. For dev, set `UseFake: true` to skip Resend entirely.

### Email not arriving (with UseFake: false)

**Check:**
1. Resend API key is valid
2. Domain is verified in Resend dashboard
3. FromAddress matches verified domain
4. Check Resend activity logs for failures
5. Check spam folder

### Email logging (with UseFake: true)

**Check logs for "FAKE EMAIL":**
```bash
# Running locally
dotnet run  # Watch application output for FAKE EMAIL entries

# Docker
docker logs container_id | grep "FAKE EMAIL"
```

## Development Workflow

1. **Start with UseFake: true** (default in appsettings.Development.json)
2. **Check application logs** for email verification URLs
3. **Copy verification URL** from logs and test in browser
4. **Only enable real Resend** if testing actual email delivery is critical

## API Integration

### Verification Email Flow

```csharp
// User registration
var result = await authService.RegistrarAsync(new RegistroRequest(...));
// Email sent via IEmailService (Fake or Resend based on config)
// Response returns success regardless of email delivery
```

### Manual Testing

```csharp
// Test endpoint (remove from production)
[HttpPost("test-email")]
public async Task<IResult> TestEmail([FromBody] EmailTestRequest req)
{
    await emailService.SendAsync(req.Email, "Test", "Hello");
    return Results.Ok();
}
```

## Resend Setup Steps

1. Create account at [resend.com](https://resend.com)
2. Verify domain:
   - Add DNS records provided by Resend
   - Wait for verification (5-30 min)
3. Get API key from Settings → API Keys
4. Test with curl:

```bash
curl --location --request POST 'https://api.resend.com/emails' \
  --header 'Authorization: Bearer re_YOUR_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "text": "Hello world"
  }'
```

## Security

- **Never commit API keys** to git
- **Use environment variables** in production
- **Rotate keys regularly** in Resend dashboard
- **Log sensitive data carefully** (logs should exclude full URLs/tokens in production)

## Monitoring

### Development

Watch logs for email delivery:
```bash
dotnet run | grep "FAKE EMAIL"
```

### Production

Check Resend dashboard:
- Activity → Emails
- View delivery status, bounce/spam reports
- Setup webhooks for delivery notifications

## Support

- **Resend Docs:** https://resend.com/docs
- **Common Issues:** https://resend.com/docs/help
- **Email Verification:** User must click link in email within 24 hours
