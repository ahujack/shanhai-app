// API 配置
// 开发环境使用 localhost，生产环境使用 Railway 提供的 URL
// 可通过环境变量 NEXT_PUBLIC_API_URL 覆盖
// 注意：在 React Native 中，需要使用 expo 插件来读取环境变量
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shanhai-production.up.railway.app/api';

// 调试日志
if (typeof window !== 'undefined') {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('process.env:', process.env);
}

// 通用请求函数
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  // 调试日志
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`, options.body);
  
  // 从 AsyncStorage 获取 token（仅在浏览器环境）
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      token = await AsyncStorage.getItem('shanhai_auth_token');
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

    if (!response.ok) {
      console.error(`[API Error] ${response.status} ${response.statusText}`, await response.text());
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API Response] ${response.status}`, data);
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
  register: (dto: { email: string; password: string; code: string; name?: string }) =>
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

export const agentApi = {
  chat: (dto: AgentChatDto) =>
    request<AgentResponse>('/agent/chat', { method: 'POST', body: JSON.stringify(dto) }),
};

// ========== Meditation API ==========
export interface Meditation {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: 'calm' | 'sleep' | 'anxiety' | 'focus';
  steps: Array<{
    order: number;
    title: string;
    description: string;
    durationSeconds: number;
  }>;
}

export const meditationApi = {
  getAll: () => request<Meditation[]>('/meditations'),
  get: (id: string) => request<Meditation>(`/meditations/${id}`),
};

// ========== Zi (测字) API ==========
export interface HandwritingAnalysis {
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
}

export interface ZiAnalysis {
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
}

export interface ZiResult {
  handwriting: HandwritingAnalysis;
  zi: ZiAnalysis;
  interpretation: {
    overall: string;
    career: string;
    love: string;
    wealth: string;
    health: string;
    advice: string[];
  };
  coldReadings: string[];
  followUpQuestions: string[];
  metadata: {
    method: string;
    generatedAt: string;
  };
}

export const ziApi = {
  analyze: (zi: string, handwriting?: Partial<HandwritingAnalysis>) =>
    request<ZiResult>('/zi/analyze', {
      method: 'POST',
      body: JSON.stringify({ zi, handwriting }),
    }),
};

// ========== Handwriting OCR API ==========
export interface OcrResult {
  zi: string;
  confidence: number;
}

export interface HandwritingAnalysisResult {
  recognizedZi: string | null;
  confidence: number;
  analysis?: ZiResult;
  error?: string;
}

export const handwritingApi = {
  // 仅识别手写文字
  recognize: (svgString: string) => {
    // 将SVG转换为base64
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    return request<OcrResult>('/zi/recognize', {
      method: 'POST',
      body: JSON.stringify({ image: base64 }),
    });
  },
  
  // 识别并分析
  analyze: (svgString: string) => {
    // 将SVG转换为base64
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    return request<HandwritingAnalysisResult>('/zi/analyze-handwriting', {
      method: 'POST',
      body: JSON.stringify({ image: base64 }),
    });
  },
};

// ========== 更新 Agent API ==========
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
