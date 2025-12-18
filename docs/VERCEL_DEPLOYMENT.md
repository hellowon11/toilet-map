# 🚀 Complete Vercel Deployment Guide

## Step 1: Create GitHub Repository

### Method A: Using GitHub Web Interface (Recommended)

1. Visit [GitHub](https://github.com) and log in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in repository information:
   - **Repository name**: `toilet-map` (or any name you prefer)
   - **Description**: `Toilet Finder 🚽 - Find clean toilets in Malaysia`
   - **Visibility**: Choose **Public** or **Private**
   - ⚠️ **Do NOT** check "Initialize this repository with a README"
4. Click **"Create repository"**

### Method B: Using GitHub CLI (if installed)

```bash
gh repo create toilet-map --public --source=. --remote=origin --push
```

## Step 2: Push Code to GitHub

Run the following commands in your project directory:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# Push code
git branch -M main
git push -u origin main
```

**Or**, if GitHub displays the commands, you can copy and paste them directly.

## Step 3: Deploy on Vercel

### 3.1 Log in to Vercel

1. Visit [Vercel](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Select **"Continue with GitHub"** (Recommended, automatically connects GitHub)

### 3.2 Import Project

1. After logging in, click **"Add New..."** → **"Project"**
2. Find your `toilet-map` repository in **"Import Git Repository"**
3. Click **"Import"**

### 3.3 Configure Project

1. **Project Name**: Keep default or modify
2. **Framework Preset**: Should auto-detect as **Next.js**
3. **Root Directory**: Keep default `./`
4. **Build Command**: Keep default `npm run build`
5. **Output Directory**: Keep default `.next`

### 3.4 Add Environment Variables ⚠️ Important!

In the **"Environment Variables"** section, add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://xzecbilcpuiulkcrrsol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWNiaWxjcHVpdWxrY3Jyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjAwOTEsImV4cCI6MjA3OTE5NjA5MX0.ddo0jZs6aWKL3stnig1oooGzlFtVBKpwwxudDeNaBOE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyC_kK6pS-MqXfntWGXW-DBpT43THUDiLEc
```

**Note**:
- Variable names must match exactly (including case)
- Add each variable separately
- Ensure all three environments are added (Production, Preview, Development)

### 3.5 Deploy

1. Click the **"Deploy"** button
2. Wait for the build to complete (usually 1-3 minutes)
3. After successful deployment, you'll see a URL, for example: `https://toilet-map.vercel.app`

## Step 4: Verify Deployment

1. Visit the deployed URL
2. Test the following features:
   - ✅ Is the map loading correctly?
   - ✅ Is the search function working?
   - ✅ Is the add toilet function working?
   - ✅ Is image upload working?

## Step 5: Custom Domain (Optional)

1. In Vercel project settings, click **"Domains"**
2. Add your custom domain
3. Follow the prompts to configure DNS records

## 🔄 Update Deployment

Every time you push code to GitHub, Vercel will automatically redeploy!

```bash
git add .
git commit -m "Your commit message"
git push
```

## ❗ Common Issues

### Issue 1: Build failed
- Check if environment variables are correctly added
- Check error messages in Vercel build logs

### Issue 2: Map not displaying
- Check if Google Maps API Key is correct
- Ensure API Key is enabled in Google Cloud Console

### Issue 3: Database connection failed
- Check if Supabase URL and Key are correct
- Ensure Supabase project is active

## 📞 Need Help?

If you encounter issues, you can:
1. Check Vercel's build logs
2. Check browser console error messages
3. Refer to [Vercel Documentation](https://vercel.com/docs)
