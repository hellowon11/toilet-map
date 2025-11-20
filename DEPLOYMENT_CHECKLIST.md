# 🚀 上线检查清单

## ✅ 已完成的功能
- ✅ 地图显示和标记
- ✅ 列表视图
- ✅ 搜索功能
- ✅ 筛选功能（评分、价格、设施）
- ✅ 收藏功能
- ✅ 历史记录
- ✅ 评论和评分
- ✅ 图片上传和显示
- ✅ 分享功能
- ✅ AI 助手
- ✅ 添加新厕所
- ✅ 距离计算
- ✅ 用户资料
- ✅ 移动端优化

## ⚠️ 上线前必须完成

### 1. 环境变量配置
创建 `.env.local` 文件（已在代码中添加 fallback，但建议使用环境变量）：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**部署平台设置**（Vercel/Netlify）：
- 在平台的环境变量设置中添加上述变量
- 确保变量名称以 `NEXT_PUBLIC_` 开头

### 2. 数据库检查
确保 Supabase 数据库已配置：
- ✅ `toilets` 表存在
- ✅ `reviews` 表存在（包含 `images` 字段）
- ✅ `profiles` 表存在（包含 `favorites` 字段）
- ✅ Row Level Security (RLS) 已正确配置
- ✅ Storage bucket 已创建用于图片上传

### 3. Google Maps API
- ✅ API Key 已创建
- ⚠️ 确保 API Key 有正确的限制（HTTP referrer 限制）
- ⚠️ 启用必要的 API：
  - Maps JavaScript API
  - Places API (如果需要)

### 4. 安全性检查
- ✅ API Keys 已从代码中移除（使用环境变量）
- ⚠️ 检查 Supabase RLS 策略是否安全
- ⚠️ 确保 Storage bucket 有正确的访问权限

## 📋 建议改进（可选）

### 性能优化
- [ ] 添加图片懒加载
- [ ] 优化地图加载性能
- [ ] 添加数据缓存

### 用户体验
- [ ] 添加加载状态指示器
- [ ] 改进错误提示信息
- [ ] 添加空状态提示

### 功能增强
- [ ] 添加报告问题功能
- [ ] 添加语音搜索
- [ ] 添加离线模式（PWA）

## 🚀 部署步骤

### Vercel 部署（推荐）
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量
4. 部署

### 其他平台
- Netlify: 类似 Vercel
- 自托管: 需要配置 Node.js 服务器

## ✅ 上线后检查

- [ ] 测试所有核心功能
- [ ] 检查移动端显示
- [ ] 测试图片上传
- [ ] 测试搜索和筛选
- [ ] 检查地图加载
- [ ] 测试分享功能

## 📝 注意事项

1. **API 配额**: 注意 Google Maps API 的使用配额
2. **存储空间**: 监控 Supabase Storage 使用量
3. **数据库**: 定期备份数据库
4. **监控**: 设置错误监控（如 Sentry）

## 🎉 可以上线！

当前功能已经足够完整，可以上线使用。建议先在小范围测试，然后逐步推广。

