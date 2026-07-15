import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitAuthExpired } from '../lib/auth-expired';

/** 与 Metro/Expo 一致：开发包为 true，Release 为 false */
function isDevBundle(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).__DEV__ !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !!(globalThis as any).__DEV__;
    }
  } catch {
    /* ignore */
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
}

/** 供 store 等与 API 同环境的调试输出（生产 Release 不打印） */
export function apiDebugLog(...args: unknown[]) {
  if (isDevBundle()) {
    console.log(...args);
  }
}

export { isDevBundle };

/** 与 Vercel/Expo 一致：优先 EXPO_PUBLIC_*（Metro 会内联），其次 NEXT_PUBLIC_* */
function readApiUrlFromEnv(): string {
  if (typeof process === 'undefined') return '';
  return (
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    ''
  );
}

/**
 * 未配置时使用默认 Railway API，避免 CI/Vercel 未设变量时构建/运行直接失败。
 * 生产仍建议在环境变量中显式配置 API 基址。
 */
function resolveApiBaseUrl(): string {
  const raw = readApiUrlFromEnv();
  if (raw) return raw.replace(/\/$/, '');
  const fallback = 'https://shanhai-production.up.railway.app/api';
  if (isDevBundle()) return fallback;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn(
      '[shanhai-app] 未配置 EXPO_PUBLIC_API_URL / NEXT_PUBLIC_API_URL，已回退默认后端。建议在 Vercel/CI 中显式设置。',
    );
  }
  return fallback;
}

export const API_BASE_URL = resolveApiBaseUrl();
type ClientLanguage = 'zh-CN' | 'en-US' | 'zh-TW';
let globalAppLanguage: ClientLanguage = 'zh-CN';

// 全局 token 变量
let globalAuthToken: string | null = null;

// 初始化时尝试从存储获取 token
if (typeof window !== 'undefined') {
  try {
    // 优先尝试使用 globalAuthToken（由 store 设置）
    if (globalAuthToken) {
      apiDebugLog('[API] 使用 globalAuthToken');
    } else if (typeof localStorage !== 'undefined') {
      // Web 环境使用 localStorage
      const stored = localStorage.getItem('shanhai_auth_token');
      globalAuthToken = stored;
      apiDebugLog('[API] 从 localStorage 初始化 token:', stored ? 'exists' : 'null');
    }
  } catch (e) {
    apiDebugLog('[API] 读取 token 失败:', e);
  }
}

// 导出设置 token 的函数
export function setGlobalAuthToken(token: string | null) {
  globalAuthToken = token;
  apiDebugLog('[API] 设置 globalAuthToken:', token ? 'exists' : 'null');
}

export function setGlobalAppLanguage(language: ClientLanguage) {
  if (language === 'zh-CN' || language === 'en-US' || language === 'zh-TW') {
    globalAppLanguage = language;
  } else {
    globalAppLanguage = 'zh-CN';
  }
}

/** 401 且判定为登录态失效时清 token 并通知 UI（含 Native） */
async function clearSessionOnAuthError(errorMsg: string): Promise<void> {
  const msg = String(errorMsg);
  const looksAuth =
    /登录|认证|token|Token|过期|unauthorized|请先登录|未授权|Unauthorized/i.test(msg) ||
    /请求失败:\s*401/.test(msg);
  if (!looksAuth) return;
  setGlobalAuthToken(null);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('shanhai_auth_token');
      localStorage.removeItem('shanhai_user_id');
    }
  } catch {
    /* ignore */
  }
  try {
    await AsyncStorage.removeItem('shanhai_auth_token');
    await AsyncStorage.removeItem('shanhai_user_id');
  } catch {
    /* ignore */
  }
  emitAuthExpired();
}

/** 可选：fetch 超时（识字/测字等 LLM 链路较慢，避免浏览器默认过早断开） */
export type RequestExtraOptions = { timeoutMs?: number };

function extractRequestId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const requestId = (payload as { requestId?: unknown }).requestId;
  return typeof requestId === 'string' && requestId.trim() ? requestId.trim() : null;
}

function withRequestId(message: string, requestId?: string | null): string {
  if (!requestId) return message;
  return `${message}（请求ID: ${requestId}）`;
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  extra?: RequestExtraOptions,
): Promise<T> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const timeoutMs = extra?.timeoutMs;

  apiDebugLog(`[API Request] ${options.method || 'GET'} ${fullUrl}`, options.body);

  // 获取 token（优先使用 globalAuthToken，然后尝试 localStorage）
  let token: string | null = globalAuthToken;
  if (!token && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      token = localStorage.getItem('shanhai_auth_token');
    } catch (e) {
      // ignore
    }
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs != null && timeoutMs > 0 && !options.signal) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      ...(timeoutMs != null && timeoutMs > 0 && !options.signal ? { signal: controller.signal } : {}),
      headers: {
        'Content-Type': 'application/json',
        'X-App-Language': globalAppLanguage,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    // 尝试解析响应为 JSON
    let data;
    try {
      data = await response.json();
    } catch {
      // 如果响应不是 JSON
      if (!response.ok) {
        console.error(`[API Error] ${response.status} ${response.statusText}`);
        const headerRequestId = response.headers.get('x-request-id');
        throw new Error(withRequestId(`请求失败: ${response.status} ${response.statusText}`, headerRequestId));
      }
      throw new Error('服务器响应格式错误');
    }

    apiDebugLog(`[API Response] ${response.status}`, data);

    // 即使 HTTP 状态码是 200，也要检查业务层面的 success
    if (response.ok && data.success === false) {
      // 业务层面的失败，仍然返回数据让调用方处理
      return data;
    }

    if (!response.ok) {
      // HTTP 层面的错误
      const bodyRequestId = extractRequestId(data);
      const headerRequestId = response.headers.get('x-request-id');
      const requestId = bodyRequestId || headerRequestId;
      const baseMessage = data?.message || `请求失败: ${response.status}`;
      const errorMsg = withRequestId(baseMessage, requestId);
      console.error(`[API Error] ${response.status}`, errorMsg);
      if (response.status === 401) {
        // 积分预检未登录时不应清掉本地 token（后端已改为 200；此处兼容旧版或其它环境的 401）
        const isPointsPrecheck = /^\/points\/check(\?|$)/.test(endpoint);
        if (!isPointsPrecheck) {
          await clearSessionOnAuthError(errorMsg);
        }
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Request Failed] ${fullUrl}:`, error);
    const err = error as Error;
    if (err?.name === 'AbortError') {
      const sec = timeoutMs ? Math.round(timeoutMs / 1000) : 0;
      throw new Error(
        sec > 0
          ? `请求超时（>${sec}s），识别需要调用 AI，请稍后重试或检查网络`
          : '请求已取消',
      );
    }
    const msg = String(err?.message || error);
    if (/Failed to fetch|NetworkError|network error|load failed|ERR_CONNECTION|timed out|TIMEOUT/i.test(msg)) {
      const isZiRelated = /^\/zi\//.test(endpoint);
      throw new Error(
        isZiRelated
          ? '网络异常或服务器响应超时。手写识别需调用云端 AI，请稍后重试；若持续失败请检查网络或稍后再试。'
          : '网络异常或服务器响应超时，请稍后重试。',
      );
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ========== Affiliate Portal API ==========
export type AffiliatePortalSummary = {
  partner: {
    code: string;
    name: string;
    commissionRate: number;
    settlementCycle: 'weekly' | 'monthly' | string;
    minimumPayout: number;
    nextSettlementAt: string;
  };
  funnel: {
    clicks: number;
    registeredUsers: number;
    paidUsers: number;
    conversionRate: number;
  };
  summary: Record<
    'pending' | 'approved' | 'paid',
    {
      orderCount: number;
      grossAmount: number;
      netAmount: number;
      commissionAmount: number;
    }
  >;
  commissions: Array<{
    id: string;
    productName: string;
    productCode: string;
    grossAmount: number;
    netAmount: number;
    commissionAmount: number;
    currency: string;
    status: string;
    completedAt: string | null;
    createdAt: string;
  }>;
};

export const affiliateApi = {
  portal: (code: string, token: string) => {
    const params = new URLSearchParams({ code, token });
    return request<AffiliatePortalSummary>(`/affiliate/portal?${params.toString()}`);
  },
};

// ========== User API ==========
export interface UserProfile {
  id: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  birthLocation?: string;
  birthLongitude?: number;
  birthLatitude?: number;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  location?: string;
  focusGod?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: 'user' | 'admin';
  membership: 'free' | 'premium' | 'vip';
  /** ISO 8601，有值时与后端权益判断一致 */
  membershipExpiryAt?: string | null;
  referralCode?: string; // 推荐码
  referredBy?: string;   // 推荐人ID
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  /** 必填：与注册/登录邮箱一致，用于资料与找回 */
  email?: string;
  birthDate?: string;
  birthTime?: string;
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  birthLocation?: string;
  birthLongitude?: number;
  birthLatitude?: number;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  location?: string;
  focusGod?: string;
}

// ========== Auth API ==========
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}

export const authApi = {
  // 发送验证码 (purpose: 'login' | 'register')
  sendCode: (dto: { email?: string; purpose?: string }) =>
    request<{ success: boolean; message: string; code?: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  
  // 注册
  register: (dto: { email: string; password: string; code: string; name?: string; referralCode?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  
  // 登录（支持密码或验证码）
  login: (dto: { email: string; password?: string; code?: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  
  // 第三方登录
  socialLogin: (dto: { provider: 'google' | 'facebook'; idToken: string; referralCode?: string }) =>
    request<AuthResponse>('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  
  // 刷新 Token
  refresh: (token: string) =>
    request<{ success: boolean; token?: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  
  // 登出
  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),
  
  // 重置密码
  resetPassword: (dto: { email: string; code: string; newPassword: string }) =>
    request<AuthResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};

export const userApi = {
  create: (dto: CreateUserDto) =>
    request<UserProfile>('/users', { method: 'POST', body: JSON.stringify(dto) }),
    
  get: (id: string) =>
    request<UserProfile>(`/users/${id}`),
    
  update: (id: string, dto: Partial<CreateUserDto>) =>
    request<UserProfile>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
};

// ========== Chart API ==========
export interface BaziChart {
  userId: string;
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  dayMaster: string;
  tenGods: {
    year: string;
    month: string;
    day: string;
    hour: string;
    summary: string[];
  };
  sun: string;
  moon: string;
  wuxingStrength: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  personalityTraits: string[];
  fortuneSummary: {
    career: string;
    wealth: string;
    love: string;
    health: string;
  };
  suggestions: string[];
  conclusion: {
    overall: string;
    mindset: string;
  };
  detailedReading: {
    corePattern: string;
    relationship: string;
    career: string;
    wealth: string;
    health: string;
    decadeRhythm: string[];
    luckCycles: {
      startAge: number;
      direction: 'forward' | 'backward';
      cycles: Array<{
        ageRange: string;
        ganZhi: string;
        focus: string;
      }>;
    };
    annualForecast: Array<{
      year: number;
      ganZhi: string;
      tenGod: string;
      hint: string;
      favorable: string;
      caution: string;
      windowMonths: string[];
      masterCommentary?: string;
    }>;
    yearlyTips: string[];
    paywallHint?: string;
    disclaimer: string;
  };
}

export interface ChartPreviewDto {
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  birthLongitude?: number;
  birthLocation?: string;
  timezone?: string;
  language?: ClientLanguage;
}

export const chartApi = {
  /** 游客试算，服务端不落库 */
  preview: (dto: ChartPreviewDto) =>
    request<BaziChart>('/charts/preview', {
      method: 'POST',
      body: JSON.stringify({ ...dto, language: dto.language || globalAppLanguage }),
    }),

  generate: (userId: string, gender: 'male' | 'female') =>
    request<BaziChart>(`/charts/${userId}`, { 
      method: 'POST', 
      body: JSON.stringify({ gender, language: globalAppLanguage }) 
    }),
    
  get: (userId: string) =>
    request<{ hasChart: boolean; chart?: BaziChart }>(`/charts/${userId}`),
};

// ========== Persona API ==========
export interface PersonaProfile {
  id: string;
  name: string;
  title: string;
  toneTags: string[];
  description: string;
  greeting: string;
  image: string;
}

export const personaApi = {
  getAll: () => request<PersonaProfile[]>('/personas'),
  get: (id: string) => request<PersonaProfile>(`/personas/${id}`),
};

// ========== Fortune API ==========
export interface FortuneSlip {
  id: string;
  zodiac: string;
  zodiacAnimal: string;
  day: string;
  month: string;
  year: string;
  poem: {
    title: string;
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
  interpretation: {
    overall: string;
    love: string;
    career: string;
    wealth: string;
    health: string;
  };
  advice: string[];
  lucky: {
    color: string;
    number: string;
    direction: string;
    food: string;
  };
  fortuneRank?: '上上签' | '上签' | '中签' | '下签';
  fortuneScore?: number;
  fortuneTheme?: 'career' | 'love' | 'wealth' | 'health' | 'general';
  luckyTime?: string;
  drawCode?: string;
  funTip?: string;
  mission?: string;
  socialLine?: string;
}

export const fortuneApi = {
  getDaily: () => request<FortuneSlip>('/fortunes/daily'),
  draw: () => request<FortuneSlip>('/fortunes/draw'),
};

// ========== Reading API ==========
export interface DivinationResult {
  id: string;
  question: string;
  category: string;
  conclusion?: {
    verdict: string;
    confidence: number;
    emotionalTone: string;
    nextStep: string;
  };
  hexagram: {
    original: string;
    originalName: string;
    changed: string;
    changedName: string;
    lines: string[];
    yaoDescriptions: string[];
  };
  interpretation: {
    overall: string;
    situation: string;
    guidance: string;
  };
  recommendations: string[];
  timing: {
    suitable: string;
    caution: string;
  };
  culturalSource?: string;
  metadata: {
    generatedAt: string;
    method: string;
  };
}

export interface CreateReadingDto {
  question: string;
  category?: 'career' | 'love' | 'wealth' | 'health' | 'growth' | 'general';
  language?: ClientLanguage;
}

export const readingApi = {
  create: (dto: CreateReadingDto) =>
    request<DivinationResult>('/readings', {
      method: 'POST',
      body: JSON.stringify({ ...dto, language: dto.language || globalAppLanguage }),
    }),
};

// ========== Meditation API ==========
export interface MeditationStep {
  order: number;
  title: string;
  description: string;
  durationSeconds: number;
}

export interface Meditation {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: 'calm' | 'sleep' | 'anxiety' | 'focus';
  steps: MeditationStep[];
}

export const meditationApi = {
  getAll: () => request<Meditation[]>('/meditations'),
  getById: (id: string) => request<Meditation>(`/meditations/${id}`),
};

// ========== Zi API ==========
export interface ZiResult {
  handwriting: {
    pressure: 'heavy' | 'light' | 'medium';
    pressureInterpretation: string;
    stability: 'stable' | 'shaky' | 'average';
    stabilityInterpretation: string;
    structure: 'compact' | 'loose' | 'balanced';
    structureInterpretation: string;
    continuity: 'connected' | 'broken' | 'average';
    continuityInterpretation: string;
    overallStyle: string;
    personalityInsights: string[];
  };
  zi: {
    zi: string;
    bushou: string;
    bihua: number;
    wuxing: string;
    yinyang: string;
    jixiong: string;
    yijing: string;
    guaXiang: string;
    components: string[];
    componentMeanings: string[];
    associativeMeaning: string;
    lihefa?: string[];
    tianziGe?: string[];
    imageryInference?: string;
    probingQuestion?: string;
    oracleBone?: {
      exists: boolean;
      source: string;
      imageUrls: string[];
      totalImages: number;
      shownImages: number;
      previewLocked: boolean;
      interpretation: string;
      note: string;
    };
  };
  interpretation: {
    overall: string;
    career: string;
    love: string;
    wealth: string;
    health: string;
    advice: string[];
    focusReading?: {
      focus: string;
      summary: string;
      anchors: string[];
      riskSignals: string[];
      actionPlan: string[];
      llmEnhanced?: boolean;
    };
    premiumHint?: string;
  };
  coldReadings: string[];
  followUpQuestions: string[];
  metadata: {
    method: string;
    generatedAt: string;
  };
}

/** 手写识字 + 多模态较慢，单独放宽超时（毫秒） */
const ZI_RECOGNIZE_TIMEOUT_MS = 120_000;
const ZI_ANALYZE_HANDWRITING_TIMEOUT_MS = 180_000;
const ZI_TEXT_ANALYZE_TIMEOUT_MS = 120_000;

export const ziApi = {
  analyze: (zi: string, focusAspect?: string, handwriting?: object, userQuestion?: string, invitePreview?: boolean) =>
    request<ZiResult>(
      '/zi/analyze',
      {
        method: 'POST',
        body: JSON.stringify({ zi, focusAspect, handwriting, userQuestion, invitePreview }),
      },
      { timeoutMs: ZI_TEXT_ANALYZE_TIMEOUT_MS },
    ),
};

export const handwritingApi = {
  recognize: (image: string) =>
    request<{ recognizedZi: string | null; confidence?: number }>(
      '/zi/recognize',
      {
        method: 'POST',
        body: JSON.stringify({ image }),
      },
      { timeoutMs: ZI_RECOGNIZE_TIMEOUT_MS },
    ),
  analyze: (image: string, focusAspect?: string, userQuestion?: string) =>
    request<{ recognizedZi: string | null; confidence?: number; analysis?: ZiResult; error?: string }>(
      '/zi/analyze-handwriting',
      {
        method: 'POST',
        body: JSON.stringify({ image, focusAspect, userQuestion }),
      },
      { timeoutMs: ZI_ANALYZE_HANDWRITING_TIMEOUT_MS },
    ),
};

// ========== Agent API ==========
export interface AgentChatDto {
  message: string;
  personaId?: string;
  context?: string[];
  mood?: 'calm' | 'anxious' | 'sad' | 'excited';
  clientLocalHour?: number;
  language?: ClientLanguage;
}

export interface AgentResponse {
  persona: string;
  intent: string;
  reply: string;
  actions: Array<{
    type: string;
    label: string;
  }>;
  artifacts: {
    reading?: DivinationResult;
    fortune?: FortuneSlip;
    chart?: BaziChart;
    meditation?: Meditation;
    zi?: ZiResult;
  };
  hasChart: boolean;
}

async function getAuthTokenForStream(): Promise<string | null> {
  if (globalAuthToken?.trim()) return globalAuthToken;
  try {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('shanhai_auth_token');
      if (token?.trim()) return token;
    }
  } catch {
    /* ignore */
  }
  try {
    const token = await AsyncStorage.getItem('shanhai_auth_token');
    if (token?.trim()) return token;
  } catch {
    /* ignore */
  }
  return null;
}

export const agentApi = {
  chat: (dto: AgentChatDto) =>
    request<AgentResponse>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ ...dto, language: dto.language || globalAppLanguage }),
    }),
  /** 流式聊天，onChunk 收到每个文本片段，返回完整 AgentResponse */
  chatStream: async (
    dto: AgentChatDto,
    onChunk: (content: string) => void,
  ): Promise<AgentResponse> => {
    const token = await getAuthTokenForStream();
    const url = `${API_BASE_URL}/agent/chat-stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Language': globalAppLanguage,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...dto, language: dto.language || globalAppLanguage }),
    });
    if (!res.ok) {
      let errText = '';
      let requestId = res.headers.get('x-request-id');
      try {
        const j = await res.json();
        errText = j?.message || '';
        requestId = requestId || extractRequestId(j);
      } catch {
        /* ignore */
      }
      const finalMessage = withRequestId(errText || `请求失败: ${res.status}`, requestId);
      if (res.status === 401) {
        await clearSessionOnAuthError(finalMessage);
      }
      throw new Error(finalMessage);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('不支持流式响应');
    const decoder = new TextDecoder();
    let buffer = '';
    let result: AgentResponse | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'chunk' && parsed.content) {
              onChunk(parsed.content);
            } else if (parsed.type === 'done') {
              result = {
                persona: parsed.persona,
                intent: parsed.intent,
                reply: parsed.reply,
                actions: parsed.actions || [],
                artifacts: parsed.artifacts || {},
                hasChart: parsed.hasChart || false,
              };
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message || '流式请求失败');
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('流式请求')) throw e;
            // ignore parse errors for non-JSON lines
          }
        }
      }
    }
    if (!result) throw new Error('未收到完整响应');
    return result;
  },
  transcribeAudio: async (audioBlob: Blob): Promise<{ success: boolean; text: string }> => {
    const token = await getAuthTokenForStream();
    const url = `${API_BASE_URL}/agent/transcribe`;
    const formData = new FormData();
    const blobType = String(audioBlob?.type || '').toLowerCase();
    const ext = blobType.includes('ogg')
      ? 'ogg'
      : blobType.includes('mp4') || blobType.includes('m4a')
        ? 'm4a'
        : blobType.includes('wav')
          ? 'wav'
          : 'webm';
    formData.append('audio', audioBlob, `voice.${ext}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    if (!res.ok) {
      const msg = data?.message || `语音转写请求失败: ${res.status}`;
      throw new Error(msg);
    }
    if (!data?.success || !String(data?.text || '').trim()) {
      throw new Error(data?.message || '语音转写未返回文本');
    }
    return { success: true, text: String(data.text).trim() };
  },
};

// ========== 签到 API ==========
export interface CheckInResult {
  success: boolean;
  message: string;
  streak: number;
  points: number;
  reward?: string;
  isFirstCheckIn?: boolean;
  unlockedAchievement?: {
    name: string;
    description: string;
    icon: string;
  };
}

export interface CheckInStatus {
  todayCheckedIn: boolean;
  currentStreak: number;
  totalPoints: number;
  consecutiveDays: number;
}

export const checkInApi = {
  // 签到（从JWT token获取userId）
  checkIn: () =>
    request<CheckInResult>('/checkin', { method: 'POST' }),
  
  // 获取签到状态
  getStatus: () =>
    request<CheckInStatus>('/checkin/status'),
  
  // 获取签到日历
  getCalendar: () =>
    request<string[]>('/checkin/calendar'),
};

// ========== 成就 API ==========
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  requirement: number;
  points: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}

export interface AchievementProgress {
  total: number;
  unlocked: number;
  unlockedPoints: number;
}

export const achievementApi = {
  // 获取所有成就列表
  getAll: () =>
    request<Achievement[]>('/achievements'),
  
  // 获取用户成就列表
  getUserAchievements: () =>
    request<UserAchievement[]>('/achievements/user'),
  
  // 获取用户成就进度
  getProgress: () =>
    request<AchievementProgress>('/achievements/progress'),
};

// ========== 积分 API ==========
export interface PointsSummary {
  totalPoints: number;
  availablePoints: number;
  totalEarned: number;
  totalSpent: number;
}

export interface PointRecord {
  id: string;
  userId: string;
  points: number;
  type: string;
  description?: string;
  createdAt: string;
}

export interface BillingRules {
  gateEnabled: boolean;
  costs: {
    zi: number;
    reading: number;
  };
  membershipExemptions: {
    zi: boolean;
    reading: boolean;
    baziAdvanced: boolean;
  };
  paywalls: {
    baziAdvancedMode: 'membership_only';
  };
  currentUser: {
    membership: 'free' | 'premium' | 'vip';
    isMember: boolean;
  };
}

export interface MembershipValueSnapshot {
  membership: 'free' | 'premium' | 'vip';
  membershipExpiryAt: string | null;
  daysLeft: number;
  deepReadings30d: number;
  estimatedSavedPoints30d: number;
  estimatedSavedUsd30d: number;
}

export const pointsApi = {
  // 获取积分概况
  getSummary: () =>
    request<PointsSummary>('/points'),
  
  // 获取积分记录
  getRecords: (limit?: number) =>
    request<PointRecord[]>(`/points/records${limit ? `?limit=${limit}` : ''}`),
  
  // 消费积分
  consume: (points: number, type: string, description: string) =>
    request<{ success: boolean; message: string; remainingPoints?: number }>('/points/consume', {
      method: 'POST',
      body: JSON.stringify({ points, type, description }),
    }),
  
  // 检查积分是否足够
  check: (points: number) =>
    request<{ success: boolean; hasEnough: boolean }>('/points/check', {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),
  // 获取扣费规则与会员权益映射
  getRules: () =>
    request<BillingRules>('/points/rules'),
  // 获取会员价值快照（用于展示“本月已节省”）
  getMembershipValue: () =>
    request<MembershipValueSnapshot>('/points/membership-value'),
};

// ========== 支付 API ==========
export interface PaymentProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: 'points' | 'subscription';
  price: number;
  points: number;
  periodDays: number | null;
  features: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Payment {
  id: string;
  userId: string;
  productId: string;
  product: PaymentProduct;
  amount: number;
  currency: string;
  points: number;
  stripePaymentId: string | null;
  stripeSessionId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CheckoutResult {
  paymentId: string;
  sessionId: string;
  url: string;
  mock?: boolean;
  message?: string;
}

export interface PaymentStatusResult {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  productType: 'points' | 'subscription';
  membership: 'free' | 'premium' | 'vip';
  membershipExpiryAt?: string | null;
  completedAt: string | null;
}

export const paymentApi = {
  // 获取支付状态
  getStatus: () =>
    request<{ stripeConfigured: boolean }>('/payment/status'),

  // 查询单笔支付状态（用于支付完成后刷新）
  getByIdStatus: (paymentId: string) =>
    request<PaymentStatusResult>(`/payment/status/${paymentId}`),
  
  // 获取所有支付产品
  getProducts: () =>
    request<PaymentProduct[]>('/payment/products'),
  
  // 获取单个产品详情
  getProduct: (id: string) =>
    request<PaymentProduct>(`/payment/products/${id}`),
  
  // 创建支付会话
  createCheckout: (productId: string) =>
    request<CheckoutResult>('/payment/checkout', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  
  // 模拟支付成功（仅用于测试）
  mockPayment: (paymentId: string) =>
    request<{ success: boolean; payment: Payment }>(`/payment/mock-payment/${paymentId}`),
  
  // 获取用户支付历史
  getHistory: (limit?: number, offset?: number) =>
    request<Payment[]>(`/payment/history${limit ? `?limit=${limit}` : ''}`),
};

// ========== Analytics & 反馈 ==========
export type AnalyticsTrackEvent = {
  name: string;
  props?: Record<string, unknown>;
  clientTime?: string;
};

export const analyticsApi = {
  track: (body: {
    events: AnalyticsTrackEvent[];
    client?: { locale?: string; timezone?: string; region?: string };
  }) =>
    request<{ success: boolean; count: number }>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  submitFeedback: (body: {
    category: string;
    rating?: number;
    comment?: string;
    context?: Record<string, unknown>;
  }) =>
    request<{ success: boolean }>('/analytics/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
