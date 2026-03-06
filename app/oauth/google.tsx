import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useUserStore } from '../../src/store/user';

export default function OAuthCallback() {
  const [status, setStatus] = useState('正在处理授权...');
  const params = useLocalSearchParams();
  const router = useRouter();
  const segments = useSegments();
  const { loginWithSocial } = useUserStore();

  useEffect(() => {
    console.log('[OAuth] Callback params:', params);
    console.log('[OAuth] Current segments:', segments);
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 从 URL 参数中获取 code、id_token 或 error
      const code = params.code as string | undefined;
      const idToken = params.id_token as string | undefined;
      const error = params.error as string | undefined;
      const errorDescription = params.error_description as string | undefined;

      console.log('[OAuth] Code:', code ? 'present' : 'none');
      console.log('[OAuth] ID Token:', idToken ? 'present' : 'none');

      if (error) {
        setStatus('授权失败: ' + (errorDescription || error));
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      // 优先使用 id_token（如果使用 responseType: 'id_token'）
      const token = idToken || code;
      
      if (token) {
        setStatus('正在完成登录...');
        
        try {
          // 直接使用 loginWithSocial
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
        // 如果没有 token，尝试从 URL 中提取
        setStatus('正在解析授权信息...');
        
        // 检查 URL hash 中是否有 token
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const idTokenFromHash = hashParams.get('id_token');
          
          if (idTokenFromHash || accessToken) {
            const tokenToUse = idTokenFromHash || accessToken;
            setStatus('正在完成登录...');
            
            const success = await loginWithSocial('google', tokenToUse!);
            
            if (success) {
              setStatus('登录成功！');
              setTimeout(() => router.replace('/(tabs)'), 1500);
              return;
            }
          }
        }
        
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
