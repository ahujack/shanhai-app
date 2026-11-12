# 山海灵境 · 云游道观

低模 3D 可走动道观空间（Vite + three.js）。免登录，可静坐、上香、敲木鱼、击磬、撞钟、抽签、祈福，并能看到其他访客（可选）。

## 本地预览

```bash
cd shanhai-realm
npm install
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5273`）。

### 多人在场（可选）

另开一个终端：

```bash
npm run realtime:dev
```

客户端默认连 `ws://localhost:8787/presence`。Worker 没开时会自动降级为单人。

## 环境变量

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE` | API 根路径，默认 `/api`（开发由 Vite 代理到 Railway） |
| `VITE_PRESENCE_URL` | 在场 WebSocket，如 `wss://xxx.workers.dev/presence` |
| `REALM_API_TARGET` | Vite 代理目标，默认线上 Railway |

## 构建

```bash
npm run build
```

产物在 `dist/`，可静态托管；`/api` 需在网关反代到 `shanhai-server`。

## 与主站关系

- 抽签调用现有 `GET /api/fortunes/draw`
- 「问灵伴 / 测字 / 八字」跳转 [shanhai.app](https://www.shanhai.app)
- 本空间定位为**文化静修场景**，非宗教礼拜；文案避免拜佛、诵经、募捐等表述
