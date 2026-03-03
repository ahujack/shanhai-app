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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/user';

export default function LoginScreen() {
  const router = useRouter();
  const { createUser, isLoading } = useUserStore();
  
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSendCode = () => {
    if (loginType === 'phone' && !phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (loginType === 'email' && !email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    
    // 模拟发送验证码
    Alert.alert('验证码已发送', '验证码: 123456 (测试用)');
    setIsCodeSent(true);
  };

  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    // 模拟登录 - 创建临时用户
    try {
      const loginId = loginType === 'phone' ? phone : email;
      await createUser({
        name: loginType === 'phone' ? `用户${phone.slice(-4)}` : email.split('@')[0],
        birthDate: '1990-01-01',
        birthTime: '00:00',
        gender: 'male',
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('登录失败', '请重试');
    }
  };

  const handleGuestMode = () => {
    router.replace('/(tabs)');
  };

  const handleGoogleLogin = () => {
    Alert.alert('提示', '谷歌登录功能开发中');
  };

  const handleFacebookLogin = () => {
    Alert.alert('提示', 'Facebook 登录功能开发中');
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

        {/* 登录方式切换 */}
        <View style={styles.switchContainer}>
          <TouchableOpacity 
            style={[styles.switchButton, loginType === 'phone' && styles.switchButtonActive]}
            onPress={() => setLoginType('phone')}
          >
            <Text style={[styles.switchText, loginType === 'phone' && styles.switchTextActive]}>
              手机号登录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.switchButton, loginType === 'email' && styles.switchButtonActive]}
            onPress={() => setLoginType('email')}
          >
            <Text style={[styles.switchText, loginType === 'email' && styles.switchTextActive]}>
              邮箱登录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入框 */}
        <View style={styles.inputContainer}>
          {loginType === 'phone' ? (
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#6F6287"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              placeholderTextColor="#6F6287"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          
          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="请输入验证码"
              placeholderTextColor="#6F6287"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity 
              style={[styles.codeButton, isCodeSent && styles.codeButtonDisabled]}
              onPress={handleSendCode}
              disabled={isCodeSent}
            >
              <Text style={styles.codeButtonText}>
                {isCodeSent ? '已发送' : '获取验证码'}
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
          <Text style={styles.loginButtonText}>
            {isLoading ? '登录中...' : '登录'}
          </Text>
        </TouchableOpacity>

        {/* 分割线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>或</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 第三方登录 */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Google 登录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
            <Text style={styles.socialIcon}>f</Text>
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
    marginBottom: 40,
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
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#4C2F80',
  },
  switchText: {
    color: '#8D8DAA',
    fontSize: 14,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#F8D05F',
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
  socialIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
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
