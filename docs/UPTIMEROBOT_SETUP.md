# 🔄 UptimeRobot Setup Guide - Keep Supabase Active

This guide explains how to set up UptimeRobot to ping your Supabase database every 5 minutes to prevent it from going to sleep (Supabase free tier sleeps after 7 days of inactivity).

## Why This is Needed

Supabase's free tier automatically puts your database to sleep after 7 days of inactivity. When asleep, the first request will take 30-60 seconds to wake it up, causing a poor user experience.

By setting up UptimeRobot to ping your health check endpoint every 5 minutes, your Supabase database will stay active 24/7.

## Step 1: Deploy Your App

Make sure your app is deployed on Vercel (or another hosting platform). The health check endpoint will be available at:

```
https://your-app-domain.vercel.app/api/health
```

For example:
```
https://toilet-map.vercel.app/api/health
```

## Step 2: Test the Health Check Endpoint

Before setting up UptimeRobot, test the endpoint in your browser:

1. Visit: `https://your-app-domain.vercel.app/api/health`
2. You should see a JSON response like:
   ```json
   {
     "status": "ok",
     "message": "Supabase is active",
     "timestamp": "2025-12-18T14:23:45.123Z",
     "database": "connected"
   }
   ```

If you see this, the endpoint is working correctly!

## Step 3: Create UptimeRobot Account

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up for a free account (supports up to 50 monitors)
3. Verify your email address

## Step 4: Add a New Monitor

1. Log in to UptimeRobot dashboard
2. Click **"Add New Monitor"** button

## Step 5: Configure the Monitor

Fill in the following settings:

### Monitor Type
- Select: **HTTP(s)**

### Friendly Name
- Enter: `Supabase Health Check` (or any name you prefer)

### URL (or IP)
- Enter your health check endpoint URL:
  ```
  https://your-app-domain.vercel.app/api/health
  ```
  Replace `your-app-domain.vercel.app` with your actual Vercel domain.

### Monitoring Interval
- Select: **5 minutes** (this is the minimum interval for free accounts)

### Alert Contacts
- Select your email address (or add a new contact)
- You can also add other notification methods (SMS, Slack, etc.)

### Advanced Settings (Optional)
- **HTTP Method**: GET (default)
- **Expected Status Code**: 200
- **Timeout**: 30 seconds (default)

## Step 6: Save and Test

1. Click **"Create Monitor"**
2. UptimeRobot will immediately test the endpoint
3. Wait a few seconds and check if the status shows **"Up"** (green)

## Step 7: Verify It's Working

1. Wait 5-10 minutes
2. Check your monitor status - it should show multiple successful checks
3. The monitor will ping your endpoint every 5 minutes automatically

## Expected Behavior

- **Every 5 minutes**: UptimeRobot sends a GET request to `/api/health`
- **The endpoint**: Queries Supabase database (keeps it active)
- **Result**: Supabase stays awake 24/7, no more 7-day sleep!

## Troubleshooting

### Monitor shows "Down" (red)

1. **Check if your app is deployed**: Visit your app URL in browser
2. **Test the endpoint directly**: Visit `https://your-app-domain.vercel.app/api/health`
3. **Check Vercel logs**: Go to Vercel dashboard → Your project → Deployments → View logs
4. **Verify environment variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel

### Monitor shows "Paused"

- This usually means you've hit the free tier limit (50 monitors)
- Check your UptimeRobot dashboard for any limits

### Database still goes to sleep

- Make sure the monitor is actually running (status should be "Up")
- Check UptimeRobot logs to see if requests are being sent
- Verify the endpoint is returning status 200

## Alternative: Use Vercel Cron Jobs (Advanced)

If you prefer not to use UptimeRobot, you can also use Vercel Cron Jobs:

1. Create `vercel.json` in your project root:
   ```json
   {
     "crons": [{
       "path": "/api/health",
       "schedule": "*/5 * * * *"
     }]
   }
   ```

2. However, Vercel Cron Jobs require a Pro plan, so UptimeRobot (free) is recommended for most users.

## Cost

- **UptimeRobot Free Tier**: 
  - 50 monitors
  - 5-minute check interval (minimum)
  - Email alerts
  - Perfect for this use case!

## Summary

✅ Health check endpoint created at `/api/health`  
✅ UptimeRobot monitors it every 5 minutes  
✅ Supabase stays active 24/7  
✅ No more 7-day sleep! 🎉
