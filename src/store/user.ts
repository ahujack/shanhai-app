import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, BaziChart, FortuneSlip, userApi, chartApi, fortuneApi, CreateUserDto, authApi } from '../services/api';

const USER_ID_KEY = 'shanhai_user_id';
const AUTH_TOKEN_KEY = 'shanhai_auth_token';

// 导出 token 供 API 服务使用
export let globalAuthToken: string | null = null;

// 初始化时加载 token（仅在浏览器环境）
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(AUTH_TOKEN_KEY).then(token => {
    globalAuthToken = token;
  });
}

interface UserState {
  user: UserProfile | null;
  token: string | null;
  chart: BaziChart | null;
  hasChart: boolean;
  dailyFortune: FortuneSlip | null;
  isLoading: boolean;
  
  // Auth actions
  loadUser: () => Promise<void>;
  loginWithCode: (email?: string, code?: string) => Promise<boolean>;
  loginWithSocial: (provider: 'google' | 'facebook', idToken: string) => Promise<boolean>;
  sendCode: (email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // User actions
  createUser: (dto: CreateUserDto) => Promise<UserProfile>;
  generateChart: (gender: 'male' | 'female') => Promise<void>;
  loadDailyFortune: () => Promise<void>;
  clearUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  chart: null,
  hasChart: false,
  dailyFortune: null,
  isLoading: false,
  
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (userId) {
        const user = await userApi.get(userId);
        set({ user, token });
        
        // 加载命盘
        try {
          const chartData = await chartApi.get(userId);
          if (chartData.hasChart && chartData.chart) {
            set({ chart: chartData.chart, hasChart: true });
          }
        } catch (e) {
          // 用户可能还没有命盘
          set({ hasChart: false });
        }
        
        // 加载每日运势
        try {
          const fortune = await fortuneApi.getDaily(userId);
          set({ dailyFortune: fortune });
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.error('加载用户失败:', e);
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendCode: async (email?: string) => {
    try {
      const result = await authApi.sendCode({ email: email || undefined });
      return result.success;
    } catch (e) {
      console.error('发送验证码失败:', e);
      return false;
    }
  },
  
  loginWithCode: async (email?: string, code?: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login({ email: email || '', code: code || '' });
      if (result.success && result.token && result.user) {
        await AsyncStorage.setItem(USER_ID_KEY, result.user.id);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
        set({ user: result.user, token: result.token });
        return true;
      }
      return false;
    } catch (e) {
      console.error('登录失败:', e);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  loginWithSocial: async (provider, idToken) => {
    set({ isLoading: true });
    try {
      const result = await authApi.socialLogin({ provider, idToken });
      if (result.success && result.token && result.user) {
        await AsyncStorage.setItem(USER_ID_KEY, result.user.id);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
        set({ user: result.user, token: result.token });
        return true;
      }
      return false;
    } catch (e) {
      console.error('第三方登录失败:', e);
      return false;
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
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
  
  loadDailyFortune: async () => {
    const { user } = get();
    try {
      const fortune = await fortuneApi.getDaily(user?.id);
      set({ dailyFortune: fortune });
    } catch (e) {
      // ignore
    }
  },
  
  clearUser: async () => {
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    set({ user: null, token: null, chart: null, hasChart: false, dailyFortune: null });
  },
}));
