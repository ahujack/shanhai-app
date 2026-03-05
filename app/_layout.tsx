import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
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
  const { user, loadUser, isLoading } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await loadUser();
      setIsChecking(false);
      setIsReady(true);
    };
    checkAuth();
  }, []);

  // 等待初始化完成
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0716', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F8D05F" />
      </View>
    );
  }

  if (isChecking || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0716', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F8D05F" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 未登录时显示登录页 */}
        {!user ? (
          <>
            <Stack.Screen 
              name="login" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="register" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }} 
            />
          </>
        ) : (
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
            }} 
          />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
