// API 配置
// 开发环境使用 localhost，生产环境使用 Railway 提供的 URL
// 可通过环境变量 NEXT_PUBLIC_API_URL 覆盖
// 注意：在 React Native 中，需要使用 expo 插件来读取环境变量
const API_BASE_URL = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL 
  : 'https://shanhai-production.up.railway.app/api';

// 调试日志
if (typeof window !== 'undefined') {
  console.log('API_BASE_URL:', API_BASE_URL);
}

// 全局 token 变量
let globalAuthToken: string | null = null;

// 初始化时尝试从存储获取 token
if (typeof window !== 'undefined') {
  try {
    // 优先尝试使用 globalAuthToken（由 store 设置）
    if (globalAuthToken) {
      console.log('[API] 使用 globalAuthToken');
    } else if (typeof localStorage !== 'undefined') {
      // Web 环境使用 localStorage
      const stored = localStorage.getItem('shanhai_auth_token');
      globalAuthToken = stored;
      console.log('[API] 从 localStorage 初始化 token:', stored ? 'exists' : 'null', 'key: shanhai_auth_token');
    }
  } catch (e) {
    console.log('[API] 读取 token 失败:', e);
  }
}

// 导出设置 token 的函数
export function setGlobalAuthToken(token: string | null) {
  globalAuthToken = token;
  console.log('[API] 设置 globalAuthToken:', token ? 'exists' : 'null');
}

// 通用请求函数
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  // 调试日志
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`, options.body);
  
  // 获取 token（优先使用 globalAuthToken，然后尝试 localStorage）
  let token: string | null = globalAuthToken;
  if (!token && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      token = localStorage.getItem('shanhai_auth_token');
    } catch (e) {
      // ignore
    }
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }
      throw new Error('服务器响应格式错误');
    }

    console.log(`[API Response] ${response.status}`, data);

    // 即使 HTTP 状态码是 200，也要检查业务层面的 success
    if (response.ok && data.success === false) {
      // 业务层面的失败，仍然返回数据让调用方处理
      return data;
    }

    if (!response.ok) {
      // HTTP 层面的错误
      const errorMsg = data?.message || `请求失败: ${response.status}`;
      console.error(`[API Error] ${response.status}`, errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Request Failed] ${fullUrl}:`, error);
    throw error;
  }
}

// ========== User API ==========
export interface UserProfile {
  id: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  location?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: 'user' | 'admin';
  membership: 'free' | 'premium' | 'vip';
  referralCode?: string; // 推荐码
  referredBy?: string;   // 推荐人ID
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  birthDate?: string;
  birthTime?: string;
  gender?: 'male' | 'female' | 'other';
  timezone?: string;
  location?: string;
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
  socialLogin: (dto: { provider: 'google' | 'facebook'; idToken: string }) =>
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
}

export const chartApi = {
  generate: (userId: string, gender: 'male' | 'female') =>
    request<BaziChart>(`/charts/${userId}`, { 
      method: 'POST', 
      body: JSON.stringify({ gender }) 
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
}

export const fortuneApi = {
  getDaily: (userId?: string) => 
    request<FortuneSlip>(`/fortunes/daily${userId ? `?userId=${userId}` : ''}`),
  draw: () => request<FortuneSlip>('/fortunes/draw'),
};

// ========== Reading API ==========
export interface DivinationResult {
  id: string;
  question: string;
  category: string;
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
  userId?: string;
}

export const readingApi = {
  create: (dto: CreateReadingDto) =>
    request<DivinationResult>('/readings', { method: 'POST', body: JSON.stringify(dto) }),
};

// ========== Agent API ==========
export interface AgentChatDto {
  message: string;
  personaId?: string;
  mood?: 'calm' | 'anxious' | 'sad' | 'excited';
  userId?: string;
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

export const paymentApi = {
  // 获取支付状态
  getStatus: () =>
    request<{ stripeConfigured: boolean }>('/payment/status'),
  
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
