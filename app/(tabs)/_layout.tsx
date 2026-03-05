import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import theme from '../../constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const currentTheme = theme[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#130B1F',
          borderTopColor: '#2C1D3C',
          paddingTop: 8,
          height: 72,
        },
        tabBarActiveTintColor: currentTheme.tabIconSelected,
        tabBarInactiveTintColor: currentTheme.tabIconDefault,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '对话',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="zi"
        options={{
          title: '测字',
          tabBarIcon: ({ color, size }) => <Ionicons name="pencil-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: '冥想',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: '占卜',
          tabBarIcon: ({ color, size }) => <Ionicons name="eye-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
