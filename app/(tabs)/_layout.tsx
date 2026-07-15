import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';
import theme from '../../constants/Colors';
import { trackScreenView } from '../../src/services/analytics';
import { useI18nStore } from '../../src/store/i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const currentTheme = theme[colorScheme];
  const pathname = usePathname();
  const lastPath = useRef<string>('');
  const t = useI18nStore((state) => state.t);
  const language = useI18nStore((state) => state.language);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackScreenView(pathname);
  }, [pathname]);

  return (
    <Tabs
      key={language}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#080A0F',
          borderTopColor: 'rgba(214, 179, 106, 0.14)',
          paddingTop: 9,
          height: 76,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarActiveTintColor: currentTheme.tabIconSelected,
        tabBarInactiveTintColor: currentTheme.tabIconDefault,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.chat', '对话'),
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="zi"
        options={{
          title: t('tab.zi', '测字'),
          tabBarIcon: ({ color }) => <Ionicons name="pencil-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: t('tab.reading', '占卜'),
          tabBarIcon: ({ color }) => <Ionicons name="eye-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bazi"
        options={{
          title: t('tab.bazi', '八字'),
          tabBarIcon: ({ color }) => <Ionicons name="reader-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="points"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile', '我的'),
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
