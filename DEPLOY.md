# 快速部署步骤

## 第一步：推送代码到 GitHub

如果还没有初始化 Git：

```bash
cd /Users/wangjie/Documents/山海灵境

git init
git add .
git commit -m "Initial commit: 山海灵境 AI 玄学陪伴应用"

# 如果还没有 GitHub 仓库，先在 GitHub 上创建一个空的仓库，然后：
git remote add origin https://github.com/你的用户名/shan-hai-ling-jing.git
git push -u origin main
```

## 第二步：部署后端 (Railway)

1. 打开 https://railway.app
2. 用 GitHub 登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择 `shanhai-server` 仓库
6. 点击 "Deploy"

## 第三步：部署前端 (Vercel)

1. 打开 https://vercel.com
2. 用 GitHub 登录
3. 点击 "New Project"
4. 选择 `shanhai-app` 仓库
5. 添加环境变量:
   - `NEXT_PUBLIC_API_URL`: 填入 Railway 提供的 API 地址 + `/api`
6. 点击 "Deploy"

## 完成！

部署成功后，你就可以通过 Vercel 提供的 URL 访问 Web 版本了。
