import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, useColorScheme, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeAuthExpired } from '../src/lib/auth-expired';
import { useUserStore } from '../src/store/user';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const loadUser = useUserStore((state) => state.loadUser);
  const router = useRouter();
  const authPromptLockRef = useRef(false);

  useEffect(() => {
    // 延迟一下让 Zustand 初始化完成，然后加载用户
    const init = async () => {
      setIsReady(true);
      // 加载用户信息（从 localStorage 恢复登录状态）
      await loadUser();
    };
    init();
  }, []);

  useEffect(() => {
    return subscribeAuthExpired(() => {
      useUserStore.setState({ token: null });
      const { user } = useUserStore.getState();
      if (!user) return;
      if (authPromptLockRef.current) return;
      authPromptLockRef.current = true;
      const dismiss = () => {
        authPromptLockRef.current = false;
      };
      const goLogin = () => {
        dismiss();
        router.push('/login');
      };
      Alert.alert(
        '登录已过期',
        '您之前登录过，当前会话已失效。重新登录后可同步资料、签到与会员权益；也可稍后继续以游客方式使用部分功能。',
        [
          { text: '稍后', style: 'cancel', onPress: dismiss },
          { text: '重新登录', onPress: goLogin },
        ],
        { cancelable: true, onDismiss: dismiss },
      );
    });
  }, [router]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0716', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F8D05F" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 所有页面都可以访问，登录是可选的 */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="oauth/google" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
