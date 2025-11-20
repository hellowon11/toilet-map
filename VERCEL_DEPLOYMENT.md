# 🚀 部署到 Vercel 完整指南

## 步骤 1: 创建 GitHub 仓库

### 方法 A: 使用 GitHub 网页（推荐）

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `toilet-map` (或你喜欢的名字)
   - **Description**: `Toilet Finder 🚽 - Find clean toilets in Malaysia`
   - **Visibility**: 选择 **Public** 或 **Private**
   - ⚠️ **不要**勾选 "Initialize this repository with a README"
4. 点击 **"Create repository"**

### 方法 B: 使用 GitHub CLI（如果已安装）

```bash
gh repo create toilet-map --public --source=. --remote=origin --push
```

## 步骤 2: 推送代码到 GitHub

在项目目录运行以下命令：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# 推送代码
git branch -M main
git push -u origin main
```

**或者**，如果 GitHub 已经显示了命令，直接复制粘贴即可。

## 步骤 3: 在 Vercel 部署

### 3.1 登录 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**（推荐，会自动连接 GitHub）

### 3.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 中找到你的 `toilet-map` 仓库
3. 点击 **"Import"**

### 3.3 配置项目

1. **Project Name**: 保持默认或修改
2. **Framework Preset**: 应该自动检测为 **Next.js**
3. **Root Directory**: 保持默认 `./`
4. **Build Command**: 保持默认 `npm run build`
5. **Output Directory**: 保持默认 `.next`

### 3.4 添加环境变量 ⚠️ 重要！

在 **"Environment Variables"** 部分，添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL = https://xzecbilcpuiulkcrrsol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWNiaWxjcHVpdWxrY3Jyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjAwOTEsImV4cCI6MjA3OTE5NjA5MX0.ddo0jZs6aWKL3stnig1oooGzlFtVBKpwwxudDeNaBOE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyC_kK6pS-MqXfntWGXW-DBpT43THUDiLEc
```

**注意**：
- 变量名必须完全一致（包括大小写）
- 每个变量都要单独添加
- 确保所有三个环境都添加（Production, Preview, Development）

### 3.5 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常 1-3 分钟）
3. 部署成功后，你会看到一个 URL，例如：`https://toilet-map.vercel.app`

## 步骤 4: 验证部署

1. 访问部署的 URL
2. 测试以下功能：
   - ✅ 地图是否正常加载
   - ✅ 搜索功能是否正常
   - ✅ 添加厕所功能是否正常
   - ✅ 图片上传是否正常

## 步骤 5: 自定义域名（可选）

1. 在 Vercel 项目设置中，点击 **"Domains"**
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

## 🔄 更新部署

以后每次推送代码到 GitHub，Vercel 会自动重新部署！

```bash
git add .
git commit -m "Your commit message"
git push
```

## ❗ 常见问题

### 问题 1: 构建失败
- 检查环境变量是否正确添加
- 查看 Vercel 构建日志中的错误信息

### 问题 2: 地图不显示
- 检查 Google Maps API Key 是否正确
- 确保 API Key 在 Google Cloud Console 中已启用

### 问题 3: 数据库连接失败
- 检查 Supabase URL 和 Key 是否正确
- 确保 Supabase 项目是活跃的

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 Vercel 的构建日志
2. 检查浏览器控制台的错误信息
3. 参考 [Vercel 文档](https://vercel.com/docs)

