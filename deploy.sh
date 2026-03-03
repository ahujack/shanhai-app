#!/bin/bash
# 部署脚本 - 在本地终端运行

echo "===== 推送代码到 GitHub ====="
cd /Users/wangjie/Documents/山海灵境

# 设置 Git 用户信息（如果需要）
git config --global user.name "ahujack"
git config --global user.email "your-email@example.com"

# 推送代码
git push -u origin main

echo ""
echo "===== 部署完成！ ====="
echo "1. 访问 https://railway.app 部署后端"
echo "2. 访问 https://vercel.com 部署前端"
