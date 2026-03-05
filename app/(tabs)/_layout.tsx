import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useColorScheme, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/user';
import theme from '../../constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const currentTheme = theme[colorScheme];
  const { user } = useUserStore();
  const router = useRouter();

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
        headerShown: true,
        headerStyle: {
          backgroundColor: '#130B1F',
        },
        headerTintColor: '#F8D05F',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
            {!user ? (
              <TouchableOpacity 
                onPress={() => router.push('/login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>登录</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => router.push('/profile')}
                style={styles.userButton}
              >
                <Ionicons name="person" size={22} color="#F8D05F" />
              </TouchableOpacity>
            )}
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '对话',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
          headerTitle: '山海灵境',
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
          // 个人中心页隐藏 tabBar
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    backgroundColor: '#4C2F80',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loginButtonText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
  userButton: {
    padding: 8,
  },
});
