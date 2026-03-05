import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/user';
import { signInWithGoogle, signInWithFacebook } from '../src/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { sendCode, loginWithCode, loginWithSocial, isLoading } = useUserStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCodeSent) {
      setIsCodeSent(false);
    }
  }, [countdown, isCodeSent]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    // 调用后端 API 发送验证码
    const success = await sendCode(email);

    if (success) {
      Alert.alert('验证码已发送到您的邮箱', '请查收邮件');
      setIsCodeSent(true);
      setCountdown(60); // 开始60秒倒计时
    } else {
      Alert.alert('发送失败', '请重试');
    }
  };

  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    const success = await loginWithCode(email, code);

    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('登录失败', '验证码错误或已过期');
    }
  };

  const handleGuestMode = () => {
    router.replace('/(tabs)');
  };

  const handleGoogleLogin = async () => {
    try {
      const userInfo = await signInWithGoogle();
      if (userInfo && userInfo.idToken) {
        const success = await loginWithSocial('google', userInfo.idToken);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('登录失败', '无法完成 Google 登录');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('登录失败', 'Google 登录出错，请重试');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const userInfo = await signInWithFacebook();
      if (userInfo && (userInfo.idToken || userInfo.accessToken)) {
        const token = userInfo.idToken || userInfo.accessToken || '';
        const success = await loginWithSocial('facebook', token);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('登录失败', '无法完成 Facebook 登录');
        }
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert('登录失败', 'Facebook 登录出错，请重试');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo 和标题 */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>山海灵境</Text>
          <Text style={styles.subtitle}>探索你的命运之旅</Text>
        </View>

        {/* 标题 */}
        <Text style={styles.sectionTitle}>邮箱登录</Text>

        {/* 输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="请输入邮箱"
            placeholderTextColor="#6F6287"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="请输入验证码"
              placeholderTextColor="#6F6287"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.codeButton, (isCodeSent || countdown > 0) && styles.codeButtonDisabled]}
              onPress={handleSendCode}
              disabled={isCodeSent || countdown > 0 || isLoading}
            >
              <Text style={styles.codeButtonText}>
                {countdown > 0 ? `${countdown}s` : (isCodeSent ? '已发送' : '获取验证码')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 登录按钮 */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A0A18" />
          ) : (
            <Text style={styles.loginButtonText}>登录</Text>
          )}
        </TouchableOpacity>

        {/* 分割线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>或</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 第三方登录 */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <View style={styles.socialIconContainer}>
              <Text style={styles.socialIcon}>G</Text>
            </View>
            <Text style={styles.socialText}>Google 登录</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleFacebookLogin}
            disabled={isLoading}
          >
            <View style={[styles.socialIconContainer, styles.facebookIconContainer]}>
              <Text style={styles.socialIcon}>f</Text>
            </View>
            <Text style={styles.socialText}>Facebook 登录</Text>
          </TouchableOpacity>
        </View>

        {/* 游客模式 */}
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
          <Text style={styles.guestText}>暂不登录，先逛逛</Text>
        </TouchableOpacity>

        {/* 服务条款 */}
        <Text style={styles.terms}>
          登录即表示同意{' '}
          <Text style={styles.termsLink}>《用户协议》</Text>
          {' '}和{' '}
          <Text style={styles.termsLink}>《隐私政策》</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F8D05F',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F7F6F0',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 16,
    color: '#F7F6F0',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#322243',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  codeButton: {
    backgroundColor: '#4C2F80',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  codeButtonDisabled: {
    backgroundColor: '#3A3A5A',
  },
  codeButtonText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  loginButtonText: {
    color: '#1A0A18',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2F2342',
  },
  dividerText: {
    color: '#6F6287',
    paddingHorizontal: 16,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#322243',
  },
  socialIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DB4437',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  facebookIconContainer: {
    backgroundColor: '#4267B2',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  socialText: {
    color: '#F7F6F0',
    fontSize: 16,
  },
  guestButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  guestText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  terms: {
    color: '#6F6287',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  termsLink: {
    color: '#B2A0FF',
  },
});
