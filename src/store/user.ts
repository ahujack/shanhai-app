import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, BaziChart, FortuneSlip, userApi, chartApi, fortuneApi, CreateUserDto, authApi, checkInApi, CheckInStatus, setGlobalAuthToken } from '../services/api';

const USER_ID_KEY = 'shanhai_user_id';
const AUTH_TOKEN_KEY = 'shanhai_auth_token';

// 兼容Web和Native的存储辅助函数
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Web环境使用localStorage
      return localStorage.getItem(key);
    }
    // Native环境使用AsyncStorage
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Web环境使用localStorage
      localStorage.setItem(key, value);
    } else {
      // Native环境使用AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Web环境使用localStorage
      localStorage.removeItem(key);
    } else {
      // Native环境使用AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  }
};

// 导出 token 供 API 服务使用
export let globalAuthToken: string | null = null;

// 初始化时加载 token（仅在浏览器环境）- 同步版本确保立即可用
if (typeof window !== 'undefined') {
  // 同步从localStorage读取token，确保store初始化时token已加载
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  globalAuthToken = storedToken;
  console.log('[Store] 初始化加载token:', storedToken ? 'exists' : 'null');
}

interface UserState {
  user: UserProfile | null;
  token: string | null;
  chart: BaziChart | null;
  hasChart: boolean;
  dailyFortune: FortuneSlip | null;
  checkInStatus: CheckInStatus | null;
  isLoading: boolean;
  
  // Auth actions
  loadUser: () => Promise<void>;
  register: (email: string, password: string, code: string, name?: string, referralCode?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithCode: (email?: string, code?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithSocial: (provider: 'google' | 'facebook', idToken: string) => Promise<{ success: boolean; message?: string }>;
  sendCode: (email?: string, purpose?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  
  // User actions
  createUser: (dto: CreateUserDto) => Promise<UserProfile>;
  updateUser: (id: string, dto: Partial<CreateUserDto>) => Promise<UserProfile>;
  generateChart: (gender: 'male' | 'female') => Promise<void>;
  refreshChart: () => Promise<void>;
  loadDailyFortune: () => Promise<void>;
  clearUser: () => Promise<void>;
  
  // 签到
  checkIn: () => Promise<{ success: boolean; message?: string; points?: number; reward?: string } | null>;
  loadCheckInStatus: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  chart: null,
  hasChart: false,
  dailyFortune: null,
  checkInStatus: null,
  isLoading: false,
  
  loadUser: async () => {
    // 仅在浏览器环境执行
    if (typeof window === 'undefined') return;
    
    set({ isLoading: true });
    try {
      // 同步从localStorage读取，确保立即可用
      const userId = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_ID_KEY) : null;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      
      // 同步设置全局token
      globalAuthToken = token;
      setGlobalAuthToken(token);
      
      console.log('[loadUser] userId:', userId, 'token:', token ? 'exists' : 'null');
      if (userId) {
        const user = await userApi.get(userId);
        console.log('[loadUser] user loaded:', user);
        
        // 更新全局token和store状态
        set({ user, token: token });
        globalAuthToken = token;
        
        // 加载命盘
        try {
          const chartData = await chartApi.get(userId);
          if (chartData.hasChart && chartData.chart) {
            set({ chart: chartData.chart, hasChart: true });
          } else {
            set({ chart: null, hasChart: false });
          }
        } catch (e) {
          // 用户可能还没有命盘
          set({ chart: null, hasChart: false });
        }
        
        // 加载每日运势
        try {
          const fortune = await fortuneApi.getDaily();
          set({ dailyFortune: fortune });
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.error('加载用户失败:', e);
      // 如果加载失败，清除可能存在的无效token
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      globalAuthToken = null;
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendCode: async (email?: string, purpose?: string) => {
    try {
      const result = await authApi.sendCode({ email: email || undefined, purpose });
      if (result.success) {
        return { success: true };
      }
      // 返回错误消息，由调用方展示（避免重复弹窗）
      return { success: false, message: result.message || '发送失败，请稍后重试' };
    } catch (e: any) {
      console.error('发送验证码失败:', e);
      const msg = e?.message?.includes('Network') || e?.code === 'ECONNABORTED'
        ? '网络连接失败，请检查网络后重试'
        : '无法连接到服务器，请稍后重试';
      return { success: false, message: msg };
    }
  },

  // 注册
  register: async (email: string, password: string, code: string, name?: string, referralCode?: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register({ email, password, code, name, referralCode });
      if (result.success && result.token && result.user) {
        await storage.setItem(USER_ID_KEY, result.user.id);
        await storage.setItem(AUTH_TOKEN_KEY, result.token);
        set({ user: result.user, token: result.token });
        return { success: true };
      }
      const errorMessage = result.message || '注册失败，请检查输入信息';
      return { success: false, message: errorMessage };
    } catch (e: any) {
      console.error('注册失败:', e);
      const errorMessage = e?.response?.data?.message || '网络错误，请检查网络连接后重试';
      return { success: false, message: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  // 密码登录
  loginWithPassword: async (email: string, password: string) => {
    console.log('[Login] Starting password login for:', email);
    set({ isLoading: true });
    try {
      const result = await authApi.login({ email, password });
      console.log('[Login] Password login result:', result);
      if (result.success && result.token && result.user) {
        // 同步存储到localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(USER_ID_KEY, result.user.id);
          localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        }
        // 同步设置全局token
        globalAuthToken = result.token;
        setGlobalAuthToken(result.token);
        set({ user: result.user, token: result.token });
        console.log('[Login] Password login success, user:', result.user);
        return { success: true, message: '登录成功' };
      }
      // 返回错误消息，让UI层显示
      return { success: false, message: result.message || '邮箱或密码错误' };
    } catch (e: any) {
      console.error('[Login] Password login error:', e);
      return { success: false, message: e?.message || '网络错误，请检查网络连接后重试' };
    } finally {
      set({ isLoading: false });
    }
  },
  
  loginWithCode: async (email?: string, code?: string) => {
    console.log('[Login] Starting code login for:', email, 'code:', code);
    set({ isLoading: true });
    try {
      const result = await authApi.login({ email: email || '', code: code || '' });
      console.log('[Login] Code login result:', result);
      if (result.success && result.token && result.user) {
          // 同步存储到localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(USER_ID_KEY, result.user.id);
            localStorage.setItem(AUTH_TOKEN_KEY, result.token);
          }
          // 同步设置全局token
          globalAuthToken = result.token;
        set({ user: result.user, token: result.token });
        console.log('[Login] Code login success, user:', result.user);
        return { success: true, message: '登录成功' };
      }
      // 返回错误消息，让UI层显示
      return { success: false, message: result.message || '验证码错误或已过期' };
    } catch (e: any) {
      console.error('[Login] Code login error:', e);
      return { success: false, message: e?.message || '网络错误，请检查网络连接后重试' };
    } finally {
      set({ isLoading: false });
    }
  },
  
  loginWithSocial: async (provider, idToken) => {
    set({ isLoading: true });
    try {
      const result = await authApi.socialLogin({ provider, idToken });
      if (result.success && result.token && result.user) {
        // 同步存储到localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(USER_ID_KEY, result.user.id);
          localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        }
        // 同步设置全局token
        globalAuthToken = result.token;
        setGlobalAuthToken(result.token);
        set({ user: result.user, token: result.token });
        return { success: true, message: '登录成功' };
      }
      return { success: false, message: result.message || '第三方登录失败' };
    } catch (e) {
      console.error('第三方登录失败:', e);
      return { success: false, message: '网络错误，请检查网络连接后重试' };
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    await storage.removeItem(USER_ID_KEY);
    await storage.removeItem(AUTH_TOKEN_KEY);
    // 清除全局 token
    globalAuthToken = null;
    setGlobalAuthToken(null);
    set({ user: null, token: null, chart: null, hasChart: false, dailyFortune: null });
  },
  
  createUser: async (dto) => {
    set({ isLoading: true });
    try {
      const user = await userApi.create(dto);
      await AsyncStorage.setItem(USER_ID_KEY, user.id);
      set({ user });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (id, dto) => {
    set({ isLoading: true });
    try {
      const user = await userApi.update(id, dto);
      set((state) => ({ user: state.user ? { ...state.user, ...user } : user }));
      return user;
    } finally {
      set({ isLoading: false });
    }
  },
  
  generateChart: async (gender) => {
    const { user } = get();
    if (!user) return;
    
    set({ isLoading: true });
    try {
      const chart = await chartApi.generate(user.id, gender);
      set({ chart, hasChart: true });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshChart: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const chartData = await chartApi.get(user.id);
      if (chartData.hasChart && chartData.chart) {
        set({ chart: chartData.chart, hasChart: true });
      }
    } catch {
      // ignore
    }
  },
  
  loadDailyFortune: async () => {
    const { user } = get();
    try {
      const fortune = await fortuneApi.getDaily();
      set({ dailyFortune: fortune });
    } catch (e) {
      // ignore
    }
  },
  
  clearUser: async () => {
    await storage.removeItem(USER_ID_KEY);
    await storage.removeItem(AUTH_TOKEN_KEY);
    set({ user: null, token: null, chart: null, hasChart: false, dailyFortune: null, checkInStatus: null });
  },
  
  // 签到
  checkIn: async () => {
    const { user } = get();
    if (!user) return { success: false, message: '请先登录' };
    
    try {
      const result = await checkInApi.checkIn();
      if (result.success) {
        // 刷新签到状态
        await get().loadCheckInStatus();
        // 如果解锁了成就，返回成就信息
        const achievementMsg = result.unlockedAchievement 
          ? `\n🎉 解锁成就: ${result.unlockedAchievement.name}`
          : '';
        return { 
          success: true, 
          message: result.message + achievementMsg, 
          points: result.points, 
          reward: result.reward,
          achievement: result.unlockedAchievement 
        };
      } else {
        return { success: false, message: result.message };
      }
    } catch (e) {
      console.error('签到失败:', e);
      return { success: false, message: '签到失败，请稍后重试' };
    }
  },
  
  // 加载签到状态
  loadCheckInStatus: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const status = await checkInApi.getStatus();
      set({ checkInStatus: status });
    } catch (e) {
      console.error('加载签到状态失败:', e);
    }
  },
}));
