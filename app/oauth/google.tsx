import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useUserStore } from '../../src/store/user';

export default function OAuthCallback() {
  const [status, setStatus] = useState('处理中...');
  const params = useLocalSearchParams();
  const router = useRouter();
  const { setUser, setToken } = useUserStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 从 URL 参数中获取 code 或 error
      const code = params.code as string | undefined;
      const error = params.error as string | undefined;
      const errorDescription = params.error_description as string | undefined;

      if (error) {
        setStatus('授权失败: ' + (errorDescription || error));
        setTimeout(() => router.replace('/login'), 2000);
        return;
      }

      if (code) {
        setStatus('正在完成登录...');
        
        // 将 code 发送到后端
        const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'https://shanhai-production.up.railway.app';
        
        const response = await fetch(`${backendUrl}/api/auth/social-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: 'google',
            idToken: code,
          }),
        });

        const data = await response.json();

        if (data.success && data.token) {
          setToken(data.token);
          setUser(data.user);
          setStatus('登录成功！');
          setTimeout(() => router.replace('/(tabs)'), 1000);
        } else {
          setStatus('登录失败: ' + (data.message || '未知错误'));
          setTimeout(() => router.replace('/login'), 2000);
        }
      } else {
        setStatus('未收到授权码');
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('处理出错');
      setTimeout(() => router.replace('/login'), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F8D05F" />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0716',
  },
  status: {
    marginTop: 16,
    color: '#F8D05F',
    fontSize: 16,
  },
});
