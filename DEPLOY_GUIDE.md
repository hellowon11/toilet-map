# 🚀 完整部署指南：GitHub + Vercel

## 步骤 1: 创建 GitHub 仓库

### 方法 A: 使用网页（推荐）

1. **访问 GitHub**
   - 打开浏览器，访问 [https://github.com](https://github.com)
   - 登录你的账号（如果没有，先注册）

2. **创建新仓库**
   - 点击右上角的 **"+"** 图标
   - 选择 **"New repository"**

3. **填写仓库信息**
   - **Repository name**: `toilet-map` （或你喜欢的名字）
   - **Description**: `Toilet Finder 🚽 - Find clean toilets in Malaysia`
   - **Visibility**: 选择 **Public** 或 **Private**
   - ⚠️ **重要**: **不要**勾选以下选项：
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - 点击 **"Create repository"**

4. **复制仓库地址**
   - 创建成功后，GitHub 会显示仓库地址，类似：
     ```
     https://github.com/YOUR_USERNAME/toilet-map.git
     ```
   - **复制这个地址**，下一步会用到

---

## 步骤 2: 推送代码到 GitHub

### 在项目目录运行以下命令：

**替换 `YOUR_USERNAME` 为你的 GitHub 用户名**

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# 推送代码
git branch -M main
git push -u origin main
```

**或者**，如果 GitHub 显示了命令，直接复制粘贴即可。

---

## 步骤 3: 在 Vercel 部署

### 3.1 登录 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**（推荐，会自动连接 GitHub）

### 3.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 中找到你的 `toilet-map` 仓库
3. 点击 **"Import"**

### 3.3 配置项目

1. **Project Name**: 保持默认或修改为 `toilet-finder`
2. **Framework Preset**: 应该自动检测为 **Next.js**
3. **Root Directory**: 保持默认 `./`
4. **Build Command**: 保持默认 `npm run build`
5. **Output Directory**: 保持默认 `.next`

### 3.4 添加环境变量 ⚠️ 非常重要！

在 **"Environment Variables"** 部分，点击 **"Add"** 或 **"Add New"** 添加以下三个变量：

**变量 1:**
- **Name (名称)**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value (值)**: `https://xzecbilcpuiulkcrrsol.supabase.co`
- **Environment (环境)**: 
  - 如果有选项，勾选所有（Production, Preview, Development）
  - 如果没有选项，直接添加即可（Vercel 会自动应用到所有环境）

**变量 2:**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWNiaWxjcHVpdWxrY3Jyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjAwOTEsImV4cCI6MjA3OTE5NjA5MX0.ddo0jZs6aWKL3stnig1oooGzlFtVBKpwwxudDeNaBOE`
- **Environment**: 
  - 如果有选项，勾选所有（Production, Preview, Development）
  - 如果没有选项，直接添加即可

**变量 3:**
- **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value**: `AIzaSyC_kK6pS-MqXfntWGXW-DBpT43THUDiLEc`
- **Environment**: 
  - 如果有选项，勾选所有（Production, Preview, Development）
  - 如果没有选项，直接添加即可

**💡 提示**: 
- 如果看不到环境选择选项，不用担心！直接添加变量即可，Vercel 会自动应用到所有环境。
- 添加完所有变量后，点击 **"Save"** 或 **"Add"** 保存。

### 3.5 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常 1-3 分钟）
3. 部署成功后，你会看到一个 URL，例如：`https://toilet-map.vercel.app`

---

## 步骤 4: 验证部署

访问部署的 URL，测试以下功能：
- ✅ 地图是否正常加载
- ✅ 搜索功能是否正常
- ✅ 添加厕所功能是否正常
- ✅ 评论功能是否正常
- ✅ 图片上传是否正常

---

## 🔄 以后更新代码

以后每次更新代码，只需要：

```bash
git add .
git commit -m "你的更新说明"
git push
```

Vercel 会自动检测到 GitHub 的更新，并自动重新部署！

---

## ❗ 常见问题

### 问题 1: 推送时要求输入用户名密码
**解决方案**: 使用 Personal Access Token 代替密码
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 生成新 token，勾选 `repo` 权限
3. 使用 token 作为密码

### 问题 2: 构建失败
- 检查环境变量是否正确添加
- 查看 Vercel 构建日志中的错误信息

### 问题 3: 地图不显示
- 检查 Google Maps API Key 是否正确
- 确保 API Key 在 Google Cloud Console 中已启用

### 问题 4: 数据库连接失败
- 检查 Supabase URL 和 Key 是否正确
- 确保 Supabase 项目是活跃的

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel 的构建日志
2. 检查浏览器控制台的错误信息
3. 参考 [Vercel 文档](https://vercel.com/docs)

