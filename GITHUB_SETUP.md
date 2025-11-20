# 📦 创建 GitHub 仓库详细步骤

## 方法 1: 使用 GitHub 网页（推荐）

### 步骤 1: 登录 GitHub
1. 访问 [https://github.com](https://github.com)
2. 如果没有账号，点击 **"Sign up"** 注册
3. 如果有账号，点击 **"Sign in"** 登录

### 步骤 2: 创建新仓库
1. 登录后，点击右上角的 **"+"** 图标
2. 在下拉菜单中选择 **"New repository"**

### 步骤 3: 填写仓库信息
在创建页面填写以下信息：

**Repository name** (仓库名称):
```
toilet-map
```
或者任何你喜欢的名字，例如：`kl-toilet-finder`

**Description** (描述，可选):
```
Toilet Finder 🚽 - Find clean toilets in Malaysia
```

**Visibility** (可见性):
- ✅ 选择 **Public** (公开) - 任何人都可以看到
- 或选择 **Private** (私有) - 只有你可以看到

**⚠️ 重要：不要勾选以下选项**
- ❌ 不要勾选 "Add a README file"
- ❌ 不要勾选 "Add .gitignore"
- ❌ 不要勾选 "Choose a license"

（因为你的项目已经有这些文件了）

### 步骤 4: 创建仓库
点击绿色的 **"Create repository"** 按钮

### 步骤 5: 复制仓库地址
创建成功后，GitHub 会显示一个页面，上面有仓库地址，类似：
```
https://github.com/YOUR_USERNAME/toilet-map.git
```
**复制这个地址**，稍后会用到。

---

## 方法 2: 使用 GitHub CLI（如果你安装了）

如果你已经安装了 GitHub CLI (`gh`)，可以直接在命令行创建：

```bash
gh repo create toilet-map --public --source=. --remote=origin --push
```

这会自动：
- 创建仓库
- 添加远程地址
- 推送代码

---

## 下一步：连接本地代码到 GitHub

创建好仓库后，在项目目录运行以下命令：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/toilet-map.git

# 推送代码
git branch -M main
git push -u origin main
```

**或者**，GitHub 创建仓库后会显示这些命令，直接复制粘贴即可！

---

## 需要帮助？

如果遇到问题：
1. 确保你已经登录 GitHub
2. 确保仓库名称是唯一的（如果提示已存在，换个名字）
3. 如果推送时要求输入用户名密码，使用 Personal Access Token 而不是密码

