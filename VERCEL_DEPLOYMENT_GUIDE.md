# Vercel Deployment Guide - Service Account Configuration

This guide explains how to securely deploy your application to Vercel while properly handling the `service-account-key.json` file.

## Overview

The `service-account-key.json` file contains sensitive Google Cloud credentials and should **NEVER** be committed to your repository. Instead, we'll use Vercel environment variables to securely store and access these credentials.

## Step 1: Convert Service Account Key to Base64

You need to convert your `service-account-key.json` file to a base64-encoded string.

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("service-account-key.json"))
```

### On macOS/Linux:
```bash
base64 -i service-account-key.json
```

Copy the entire output string - you'll need it in the next step.

## Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

### Required Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `<base64-encoded-key>` | Paste the base64 string from Step 1 |
| `GOOGLE_CLOUD_PROJECT` | `your-project-id` | Your Google Cloud Project ID |
| `GOOGLE_CLOUD_LOCATION` | `us-central1` | Your Google Cloud region |
| `MONGODB_URI` | `mongodb://...` | Your MongoDB connection string |

### Additional Variables:
Add any other environment variables from your `.env` file (e.g., `PORT`, `JWT_SECRET`, etc.)

**Important:** Make sure to select the appropriate environments (Production, Preview, Development) for each variable.

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Deploy via Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Vercel will automatically deploy on each push

## How It Works

The updated `gemini.service.js` now supports two modes:

### Development Mode (Local)
- Reads `service-account-key.json` from the project root
- Works as before with no changes needed

### Production Mode (Vercel)
- Reads `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable
- Decodes the base64 string
- Creates a temporary file for Google Cloud SDK
- Automatically cleans up on restart

## Verification

After deployment, check your Vercel deployment logs to ensure:
1. No errors about missing service account credentials
2. Google Cloud Vertex AI requests are successful
3. The warning "service-account-key.json not found" does NOT appear

## Security Notes

✅ **DO:**
- Keep `service-account-key.json` in `.gitignore`
- Use Vercel environment variables for sensitive data
- Rotate your service account keys periodically
- Use different service accounts for dev/prod

❌ **DON'T:**
- Commit `service-account-key.json` to Git
- Share your base64-encoded key publicly
- Use the same credentials across multiple projects
- Store credentials in client-side code

## Troubleshooting

### Error: "Failed to decode GOOGLE_SERVICE_ACCOUNT_KEY"
- Verify the base64 string is complete (no line breaks)
- Re-encode the file and update the environment variable

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"
- Ensure `GOOGLE_SERVICE_ACCOUNT_KEY` is set in Vercel
- Check that the environment is selected (Production/Preview)

### Error: "Invalid credentials"
- Verify your Google Cloud Project ID is correct
- Ensure the service account has necessary permissions
- Check that the service account key hasn't been deleted

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Vertex AI Authentication](https://cloud.google.com/vertex-ai/docs/authentication)
