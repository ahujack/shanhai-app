/** 山海灵境 · 云游道观 前端配置 */

export const APP_NAME = '山海灵境 · 云游道观';

/** 主站入口（登录、八字、测字、对话） */
export const MAIN_SITE = 'https://www.shanhai.app';

/**
 * API 根路径。
 * 本地开发走 Vite 代理 `/api`；生产可设 VITE_API_BASE。
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api';

/**
 * 多人在场 WebSocket。
 * 本地：`npm run realtime:dev` 默认 8787。
 * 生产：设 VITE_PRESENCE_URL，如 wss://realm.xxx.workers.dev/presence
 */
export const PRESENCE_URL =
  (import.meta.env.VITE_PRESENCE_URL as string | undefined) ||
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8787/presence`;

export const COMPANIONS = [
  {
    id: 'elder',
    name: '云游子',
    title: '断事老师',
    blurb: '关系取舍、事业方向：先给判断，再拆依据。',
    greeting: '先把卡住你的那件事说出来。',
    path: `${MAIN_SITE}/?persona=elder`,
    robe: 0x5f6460,
    aura: 0xc9a85a,
  },
  {
    id: 'youth',
    name: '灵溪',
    title: '清醒同频',
    blurb: '压力、说不清的日常：语气轻一点，建议实一点。',
    greeting: '我在。先给我一个字或一句话就好。',
    path: `${MAIN_SITE}/?persona=youth`,
    robe: 0x4d6478,
    aura: 0xa8b8c8,
  },
  {
    id: 'oracle',
    name: '月华',
    title: '情绪陪伴',
    blurb: '感情、夜里反复想的事：先接住，再慢慢拆开。',
    greeting: '你可以慢慢说。今晚先不用做决定。',
    path: `${MAIN_SITE}/?persona=oracle`,
    robe: 0x6e5f72,
    aura: 0xc4b4c8,
  },
] as const;
