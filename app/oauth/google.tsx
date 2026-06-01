import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/user';
import { useI18nStore } from '../../src/store/i18n';
import { localizeAuthMessage } from '../../src/utils/authMessage';

export default function OAuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { loginWithSocial } = useUserStore();
  const language = useI18nStore((state) => state.language);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);
  const [status, setStatus] = useState(tx('正在处理授权...', 'Processing authorization...', '正在處理授權...'));

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
        const detail = localizeAuthMessage({
          rawMessage: errorDescription || error,
          language,
          fallback: {
            zhCN: '请稍后重试',
            enUS: 'Please try again later.',
            zhTW: '請稍後重試',
          },
        });
        setStatus(
          tx('授权失败: {msg}', 'Authorization failed: {msg}', '授權失敗：{msg}').replace(
            '{msg}',
            detail,
          ),
        );
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      // 优先使用 id_token
      const token = idToken || code;

      if (token) {
        setStatus(tx('正在完成登录...', 'Completing sign-in...', '正在完成登入...'));

        try {
          const success = await loginWithSocial('google', token);

          if (success) {
            setStatus(tx('登录成功！', 'Sign-in successful!', '登入成功！'));
            setTimeout(() => router.replace('/(tabs)'), 1500);
          } else {
            setStatus(
              tx(
                '登录失败: 服务端处理失败',
                'Sign-in failed: server processing failed',
                '登入失敗：伺服器處理失敗',
              ),
            );
            setTimeout(() => router.replace('/login'), 3000);
          }
        } catch (loginError: any) {
          console.error('[OAuth] Login error:', loginError);
          const detail = localizeAuthMessage({
            rawMessage: loginError.message,
            language,
            fallback: {
              zhCN: '未知错误',
              enUS: 'Unknown error',
              zhTW: '未知錯誤',
            },
          });
          setStatus(
            tx('登录出错: {msg}', 'Sign-in error: {msg}', '登入出錯：{msg}').replace(
              '{msg}',
              detail,
            ),
          );
          setTimeout(() => router.replace('/login'), 3000);
        }
      } else {
        setStatus(tx('未收到授权信息，请重试', 'No authorization payload received. Please retry.', '未收到授權資訊，請重試'));
        setTimeout(() => router.replace('/login'), 3000);
      }
    } catch (error: any) {
      console.error('[OAuth] Callback error:', error);
      const detail = localizeAuthMessage({
        rawMessage: error.message,
        language,
        fallback: {
          zhCN: '未知错误',
          enUS: 'Unknown error',
          zhTW: '未知錯誤',
        },
      });
      setStatus(
        tx('处理出错: {msg}', 'Processing error: {msg}', '處理出錯：{msg}').replace(
          '{msg}',
          detail,
        ),
      );
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
