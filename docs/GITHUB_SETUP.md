# 📦 Detailed Steps to Create GitHub Repository

## Method 1: Using GitHub Web Interface (Recommended)

### Step 1: Log in to GitHub
1. Visit [https://github.com](https://github.com)
2. If you don't have an account, click **"Sign up"** to register
3. If you have an account, click **"Sign in"** to log in

### Step 2: Create New Repository
1. After logging in, click the **"+"** icon in the top right corner
2. Select **"New repository"** from the dropdown menu

### Step 3: Fill in Repository Information
Fill in the following information on the creation page:

**Repository name**:
```
toilet-map
```
Or any name you prefer, for example: `kl-toilet-finder`

**Description** (optional):
```
Toilet Finder 🚽 - Find clean toilets in Malaysia
```

**Visibility**:
- ✅ Choose **Public** - Anyone can see it
- Or choose **Private** - Only you can see it

**⚠️ Important: Do NOT check the following options**
- ❌ Do NOT check "Add a README file"
- ❌ Do NOT check "Add .gitignore"
- ❌ Do NOT check "Choose a license"

(Because your project already has these files)

### Step 4: Create Repository
Click the green **"Create repository"** button

### Step 5: Copy Repository URL
After successful creation, GitHub will display a page with the repository URL, similar to:
```
https://github.com/YOUR_USERNAME/toilet-map.git
```
**Copy this URL**, you'll need it later.

---

## Method 2: Using GitHub CLI (if you have it installed)

If you have GitHub CLI (`gh`) installed, you can create it directly from the command line:

```bash
gh repo create toilet-map --public --source=. --remote=origin --push
```

This will automatically:
- Create the repository
- Add the remote address
- Push the code

---

## Next Step: Connect Local Code to GitHub

After creating the repository, run the following commands in your project directory:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# Push code
git branch -M main
git push -u origin main
```

**Or**, GitHub will display these commands after creating the repository, just copy and paste them!

---

## Need Help?

If you encounter issues:
1. Make sure you're logged in to GitHub
2. Make sure the repository name is unique (if it says it already exists, use a different name)
3. If prompted for username and password when pushing, use Personal Access Token instead of password
