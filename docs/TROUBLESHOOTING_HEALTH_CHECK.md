# 🔧 Troubleshooting Health Check 404 Error

If you're getting a 404 error when accessing `/api/health`, follow these steps:

## Step 1: Verify Vercel Deployment

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your `toilet-map` project
3. Check the **Deployments** tab
4. Look for the latest deployment with commit message: `"Add health check API endpoint for UptimeRobot to prevent Supabase sleep"`
5. Make sure it shows **"Ready"** status (green checkmark)

### If the latest deployment is not there:

**Option A: Wait a few minutes**
- Vercel usually auto-deploys within 1-3 minutes after pushing to GitHub
- Refresh the Vercel dashboard

**Option B: Trigger manual deployment**
1. In Vercel dashboard, click **"Redeploy"** on the latest deployment
2. Or go to **Settings** → **Git** → **Redeploy**

## Step 2: Check the Correct URL

Make sure you're using the correct URL format:

✅ **Correct:**
```
https://toilet-map.vercel.app/api/health
```

❌ **Wrong:**
```
https://toilet-map.vercel.app/health
https://toilet-map.vercel.app/api/health/
https://toilet-map.vercel.app/health/
```

**Note:** 
- Must include `/api/` prefix
- No trailing slash
- Use your actual Vercel domain (replace `toilet-map.vercel.app` with your domain)

## Step 3: Test in Browser First

Before setting up UptimeRobot, test the endpoint in your browser:

1. Open your browser
2. Visit: `https://your-app-domain.vercel.app/api/health`
3. You should see JSON response:
   ```json
   {
     "status": "ok",
     "message": "Supabase is active",
     "timestamp": "2025-12-18T14:23:45.123Z",
     "database": "connected"
   }
   ```

If you see this, the endpoint is working! ✅

## Step 4: Check Vercel Build Logs

If still getting 404:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Check **Build Logs** for any errors
4. Look for messages about `/api/health` route

## Step 5: Verify File Structure

The file should exist at:
```
src/app/api/health/route.ts
```

To verify locally:
```bash
# Check if file exists
ls src/app/api/health/route.ts

# Or on Windows PowerShell:
Test-Path src/app/api/health/route.ts
```

## Step 6: Force Rebuild

If nothing works, try:

1. **Make a small change** to trigger rebuild:
   ```bash
   # Add a comment to route.ts
   git add src/app/api/health/route.ts
   git commit -m "Trigger rebuild for health check"
   git push
   ```

2. **Or redeploy in Vercel:**
   - Go to Deployments
   - Click "..." menu on latest deployment
   - Select "Redeploy"

## Common Issues

### Issue: "404 Not Found" in Browser
- **Solution**: Wait for Vercel to finish deploying (check deployment status)

### Issue: "404 Not Found" in UptimeRobot
- **Solution**: Make sure URL is exactly `https://your-domain.vercel.app/api/health` (no trailing slash)

### Issue: "503 Service Unavailable"
- **Solution**: This means the route exists but Supabase connection failed. Check environment variables in Vercel.

### Issue: Route not showing in build
- **Solution**: Make sure file is at `src/app/api/health/route.ts` (not `src/api/health/route.ts`)

## Still Not Working?

1. Check Vercel deployment logs for errors
2. Verify environment variables are set correctly
3. Try accessing other API routes (if any) to test if API routing works at all
4. Check Next.js version compatibility (should be 13+ for App Router)

## Quick Test Command

Test the endpoint with curl (if available):
```bash
curl https://your-app-domain.vercel.app/api/health
```

Or use PowerShell:
```powershell
Invoke-WebRequest -Uri "https://your-app-domain.vercel.app/api/health" | Select-Object -ExpandProperty Content
```
