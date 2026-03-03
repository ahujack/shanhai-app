# Railway 部署指南

## 前端部署到 Vercel

### 1. 推送代码到 GitHub

```bash
cd /Users/wangjie/Documents/山海灵境
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

### 2. 部署后端到 Railway

1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 `shanhai-server` 仓库
5. 添加环境变量：
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key（可选，用于 AI 功能）
6. 点击 "Deploy"

部署成功后，Railway 会提供一个 URL，例如：
```
https://shanhai-server-xxxx.up.railway.app
```

### 3. 配置前端环境变量

1. 访问 https://vercel.com
2. 使用 GitHub 登录
3. 点击 "New Project" → "Import Git Repository"
4. 选择 `shanhai-app` 仓库
5. 在 "Environment Variables" 中添加：
   - `NEXT_PUBLIC_API_URL`: `https://你的Railway项目名.up.railway.app/api`
   
   例如：
   ```
   NEXT_PUBLIC_API_URL=https://shanhai-server-1234.up.railway.app/api
   ```
6. 点击 "Deploy"

### 4. 完成！

部署成功后：
- 后端 API: `https://shanhai-server-xxxx.up.railway.app/api`
- 前端 Web: `https://shanhai-app.vercel.app`

## 本地开发

如果要在本地连接 Railway 后端，在 `shanhai-app/.env` 中添加：

```bash
NEXT_PUBLIC_API_URL=https://your-railway-project.up.railway.app/api
```

## 扩展

### 免费额度
- Railway: 500小时/月（约够 24*31=744 小时，刚好够用）
- Vercel: 100GB 流量/月
- DeepSeek: 新用户有免费额度

### 付费升级
当用户量增长后：
- Railway: $5/月起（更多实例）
- Vercel: $20/月（Pro 功能）

### 数据库（可选）
如果需要持久化数据：
```bash
# 在 Railway 添加 PostgreSQL
railway add postgresql
```
