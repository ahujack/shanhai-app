# 山海灵境 · MVP 开发底座

本仓库按照“移动端 App + NestJS API”的方式搭建初始代码骨架，便于在后续迭代中快速接入真实的 UI 素材、AI 能力以及付费体系。

## 目录结构

```
山海灵境/
├─ shanhai-app/        # React Native (Expo) 前端
└─ shanhai-server/     # NestJS 后端
```

### shanhai-app

- 采用 Expo Router + TypeScript + Bottom Tabs，默认提供“对话 / 抽签 / 解读 / 我的”四个页面骨架，后续可与智能体结果联动。
- 集成 `zustand` 管理灵伴 Persona 状态，提供示例数据和 UI 组件（渐变按钮、Section 卡片、灵伴卡片）。
- 暗色东方美学主题已抽象至 `constants/Colors.ts`，方便后续将设计 Token 映射到代码。

运行方式：

```bash
cd shanhai-app
npm install
npm run ios # 或 android / web
```

### shanhai-server

- 使用 NestJS 11，启用全局 ValidationPipe、`/api` 前缀与 CORS。
- 模块划分：
  - `health`：健康检查。
  - `persona`：灵伴档案（GET 列表 / 单条）。
  - `reading`：深度解读入口，接受问题描述并返回结构化占位结果，后续可挂接 LLM。
  - `agent`：智能体路由，`POST /api/agent/chat` 基于关键词模拟 tools 选择（占卜 / 冥想），未来可替换为真实 LLM 函数调用。
- 已安装 `class-validator`，方便扩展 DTO。

运行方式：

```bash
cd shanhai-server
npm install
npm run start:dev
```

## 下一步建议

1. 与设计稿对齐视觉 Token，替换临时图片/文案。
2. 在 `reading.service` 中接入真实的 Prompt Orchestrator。
3. 扩展 `persona` / `draw` API，与移动端通过 `.env` 配置的网关打通。
4. 接入 Supabase/AWS RDS 等存储，并补充 Prisma/TypeORM。

如需进一步的自动化部署、CI/CD 或素材生成脚本，可以继续基于此结构扩展。欢迎随时指出需要我协助的部分。*** End Patch

