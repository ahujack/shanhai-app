import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';
import theme from '../../constants/Colors';
import { trackScreenView } from '../../src/services/analytics';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const currentTheme = theme[colorScheme];
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackScreenView(pathname);
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#130B1F',
          borderTopColor: '#2C1D3C',
          paddingTop: 10,
          height: 80,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: currentTheme.tabIconSelected,
        tabBarInactiveTintColor: currentTheme.tabIconDefault,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '对话',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="zi"
        options={{
          title: '测字',
          tabBarIcon: ({ color }) => <Ionicons name="pencil-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: '占卜',
          tabBarIcon: ({ color }) => <Ionicons name="eye-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bazi"
        options={{
          title: '八字',
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
          title: '我的',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
