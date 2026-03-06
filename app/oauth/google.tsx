import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/user';

export default function OAuthCallback() {
  const [status, setStatus] = useState('正在处理授权...');
  const params = useLocalSearchParams();
  const router = useRouter();
  const { loginWithSocial } = useUserStore();

  useEffect(() => {
    console.log('[OAuth] Callback params:', params);
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 从 URL 查询参数中获取
      let idToken = params.id_token as string | undefined;
      let code = params.code as string | undefined;
      const error = params.error as string | undefined;
      const errorDescription = params.error_description as string | undefined;

      console.log('[OAuth] Query params - id_token:', idToken ? 'present' : 'none', 'code:', code ? 'present' : 'none');

      // 如果查询参数中没有 id_token，尝试从 hash 中获取（Implicit Flow）
      if (!idToken && typeof window !== 'undefined' && window.location.hash) {
        const hashString = window.location.hash.substring(1); // 去掉 #
        const hashParams = new URLSearchParams(hashString);
        idToken = hashParams.get('id_token') || undefined;
        code = code || hashParams.get('code') || undefined;
        console.log('[OAuth] Hash params - id_token:', idToken ? 'present' : 'none', 'code:', code ? 'present' : 'none');
      }

      if (error) {
        setStatus('授权失败: ' + (errorDescription || error));
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      // 优先使用 id_token
      const token = idToken || code;

      if (token) {
        setStatus('正在完成登录...');

        try {
          const success = await loginWithSocial('google', token);

          if (success) {
            setStatus('登录成功！');
            setTimeout(() => router.replace('/(tabs)'), 1500);
          } else {
            setStatus('登录失败: 服务端处理失败');
            setTimeout(() => router.replace('/login'), 3000);
          }
        } catch (loginError: any) {
          console.error('[OAuth] Login error:', loginError);
          setStatus('登录出错: ' + (loginError.message || '未知错误'));
          setTimeout(() => router.replace('/login'), 3000);
        }
      } else {
        setStatus('未收到授权信息，请重试');
        setTimeout(() => router.replace('/login'), 3000);
      }
    } catch (error: any) {
      console.error('[OAuth] Callback error:', error);
      setStatus('处理出错: ' + (error.message || '未知错误'));
      setTimeout(() => router.replace('/login'), 3000);
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
