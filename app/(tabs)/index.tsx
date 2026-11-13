import { useEffect } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

/**
 * Web 根路径交给云游道观（/realm）；原生仍把对话当首页。
 * Vercel 也会把 / 重定向到 /realm，这里再兜一层，避免客户端路由回到旧首页。
 */
export default function IndexGate() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search || '');
      const persona = params.get('persona');
      if (persona) {
        window.location.replace(`/chat?persona=${encodeURIComponent(persona)}`);
        return;
      }
      window.location.replace('/realm');
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#c9a85a" />
      </View>
    );
  }

  return <Redirect href="/chat" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D14',
  },
});
