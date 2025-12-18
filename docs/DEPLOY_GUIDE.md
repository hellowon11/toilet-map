# 🚀 Complete Deployment Guide: GitHub + Vercel

## Step 1: Create GitHub Repository

### Method A: Using Web Interface (Recommended)

1. **Visit GitHub**
   - Open your browser and go to [https://github.com](https://github.com)
   - Log in to your account (sign up if you don't have one)

2. **Create New Repository**
   - Click the **"+"** icon in the top right corner
   - Select **"New repository"**

3. **Fill in Repository Information**
   - **Repository name**: `toilet-map` (or any name you prefer)
   - **Description**: `Toilet Finder 🚽 - Find clean toilets in Malaysia`
   - **Visibility**: Choose **Public** or **Private**
   - ⚠️ **Important**: **Do NOT** check the following options:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - Click **"Create repository"**

4. **Copy Repository URL**
   - After creation, GitHub will display the repository URL, similar to:
     ```
     https://github.com/YOUR_USERNAME/toilet-map.git
     ```
   - **Copy this URL**, you'll need it in the next step

---

## Step 2: Push Code to GitHub

### Run the following commands in your project directory:

**Replace `YOUR_USERNAME` with your GitHub username**

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# Push code
git branch -M main
git push -u origin main
```

**Or**, if GitHub displays the commands, you can copy and paste them directly.

---

## Step 3: Deploy on Vercel

### 3.1 Log in to Vercel

1. Visit [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Select **"Continue with GitHub"** (Recommended, automatically connects GitHub)

### 3.2 Import Project

1. After logging in, click **"Add New..."** → **"Project"**
2. Find your `toilet-map` repository in **"Import Git Repository"**
3. Click **"Import"**

### 3.3 Configure Project

1. **Project Name**: Keep default or change to `toilet-finder`
2. **Framework Preset**: Should auto-detect as **Next.js**
3. **Root Directory**: Keep default `./`
4. **Build Command**: Keep default `npm run build`
5. **Output Directory**: Keep default `.next`

### 3.4 Add Environment Variables ⚠️ Very Important!

In the **"Environment Variables"** section, click **"Add"** or **"Add New"** to add the following three variables:

**Variable 1:**
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://xzecbilcpuiulkcrrsol.supabase.co`
- **Environment**: 
  - If options are available, check all (Production, Preview, Development)
  - If no options, just add it (Vercel will automatically apply to all environments)

**Variable 2:**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWNiaWxjcHVpdWxrY3Jyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjAwOTEsImV4cCI6MjA3OTE5NjA5MX0.ddo0jZs6aWKL3stnig1oooGzlFtVBKpwwxudDeNaBOE`
- **Environment**: 
  - If options are available, check all (Production, Preview, Development)
  - If no options, just add it

**Variable 3:**
- **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: `AIzaSyC_kK6pS-MqXfntWGXW-DBpT43THUDiLEc`
- **Environment**: 
  - If options are available, check all (Production, Preview, Development)
  - If no options, just add it

**💡 Tip**: 
- If you don't see environment selection options, don't worry! Just add the variables directly, Vercel will automatically apply them to all environments.
- After adding all variables, click **"Save"** or **"Add"** to save.

### 3.5 Deploy

1. Click the **"Deploy"** button
2. Wait for the build to complete (usually 1-3 minutes)
3. After successful deployment, you'll see a URL, for example: `https://toilet-map.vercel.app`

---

## Step 4: Verify Deployment

Visit the deployed URL and test the following features:
- ✅ Is the map loading correctly?
- ✅ Is the search function working?
- ✅ Is the add toilet function working?
- ✅ Is the review function working?
- ✅ Is image upload working?

---

## 🔄 Updating Code in the Future

For future code updates, simply:

```bash
git add .
git commit -m "Your update description"
git push
```

Vercel will automatically detect GitHub updates and automatically redeploy!

---

## ❗ Common Issues

### Issue 1: Prompted for username and password when pushing
**Solution**: Use Personal Access Token instead of password
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token, check `repo` permission
3. Use token as password

### Issue 2: Build failed
- Check if environment variables are correctly added
- Check error messages in Vercel build logs

### Issue 3: Map not displaying
- Check if Google Maps API Key is correct
- Ensure API Key is enabled in Google Cloud Console

### Issue 4: Database connection failed
- Check if Supabase URL and Key are correct
- Ensure Supabase project is active

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel's build logs
2. Check browser console error messages
3. Refer to [Vercel Documentation](https://vercel.com/docs)
