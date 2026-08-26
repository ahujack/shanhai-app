import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeAuthExpired } from '../src/lib/auth-expired';
import { useUserStore } from '../src/store/user';
import { useI18nStore } from '../src/store/i18n';
import { captureReferralFromUrl } from '../src/utils/referralAttribution';
import WebFonts from '../components/WebFonts';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 不再阻塞等 SpaceMono/FontAwesome：Web 上字体下载会拖慢首屏。
  // Ionicons 由各页按需加载，系统字体先渲染即可。
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const loadUser = useUserStore((state) => state.loadUser);
  const loadLanguage = useI18nStore((state) => state.loadLanguage);
  const t = useI18nStore((state) => state.t);
  const router = useRouter();
  const authPromptLockRef = useRef(false);

  useEffect(() => {
    void loadLanguage();
    void captureReferralFromUrl();
    void loadUser();
  }, [loadLanguage, loadUser]);

  useEffect(() => {
    return subscribeAuthExpired(() => {
      const hadUser = !!useUserStore.getState().user;
      useUserStore.setState({
        user: null,
        token: null,
        chart: null,
        hasChart: false,
        dailyFortune: null,
        checkInStatus: null,
      });
      if (!hadUser) return;
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
        t('auth.expired.title', '登录已过期'),
        t(
          'auth.expired.message',
          '您之前登录过，当前会话已失效。重新登录后可同步资料、签到与会员权益；也可稍后继续以游客方式使用部分功能。',
        ),
        [
          { text: t('common.later', '稍后'), style: 'cancel', onPress: dismiss },
          { text: t('auth.relogin', '重新登录'), onPress: goLogin },
        ],
        { cancelable: true, onDismiss: dismiss },
      );
    });
  }, [router, t]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WebFonts />
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
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="oauth/google"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
