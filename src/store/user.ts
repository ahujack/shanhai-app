import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, BaziChart, FortuneSlip, userApi, chartApi, fortuneApi, CreateUserDto } from '../services/api';

const USER_ID_KEY = 'shanhai_user_id';

interface UserState {
  user: UserProfile | null;
  chart: BaziChart | null;
  hasChart: boolean;
  dailyFortune: FortuneSlip | null;
  isLoading: boolean;
  
  // Actions
  loadUser: () => Promise<void>;
  createUser: (dto: CreateUserDto) => Promise<UserProfile>;
  generateChart: (gender: 'male' | 'female') => Promise<void>;
  loadDailyFortune: () => Promise<void>;
  clearUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  chart: null,
  hasChart: false,
  dailyFortune: null,
  isLoading: false,
  
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        const user = await userApi.get(userId);
        set({ user });
        
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
  
  createUser: async (dto: CreateUserDto) => {
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
  
  generateChart: async (gender: 'male' | 'female') => {
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
    set({ user: null, chart: null, hasChart: false, dailyFortune: null });
  },
}));
