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
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../src/store/user';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register, sendCode, isLoading } = useUserStore();
  
  // 从 URL 获取推荐码
  const referralCode = params.ref as string | undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const openTerms = (type: 'terms' | 'privacy') => {
    setTermsType(type);
    setShowTermsModal(true);
  };

  const handleSendCode = async () => {
    // 检查是否同意协议
    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意用户协议和隐私政策');
      return;
    }
    
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

    // 调用后端 API 发送注册验证码
    const result = await sendCode(email, 'register');

    if (result?.success) {
      Alert.alert('验证码已发送到您的邮箱', '请查收邮件');
      setIsCodeSent(true);
      setCountdown(60);
    } else {
      Alert.alert('发送失败', result?.message || '该邮箱可能已注册，或稍后重试');
    }
  };

  const handleRegister = async () => {
    // 检查是否同意协议
    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意用户协议和隐私政策');
      return;
    }
    
    // 验证输入
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少需要6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    const result = await register(email, password, code, name, referralCode);

    if (result?.success) {
      Alert.alert('注册成功', '欢迎加入山海灵境！');
      router.replace('/(tabs)');
    } else {
      Alert.alert('注册失败', result?.message || '请检查验证码是否正确');
    }
  };

  const handleLogin = () => {
    router.back();
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
          <Text style={styles.subtitle}>创建您的账号</Text>
        </View>

        {/* 输入框 */}
        <View style={styles.inputContainer}>
          {/* 用户名 */}
          <TextInput
            style={styles.input}
            placeholder="请输入昵称（可选）"
            placeholderTextColor="#6F6287"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            editable={!isLoading}
          />

          {/* 邮箱 */}
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

          {/* 验证码 */}
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

          {/* 密码 */}
          <TextInput
            style={styles.input}
            placeholder="请输入密码（至少6位）"
            placeholderTextColor="#6F6287"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {/* 确认密码 */}
          <TextInput
            style={styles.input}
            placeholder="请再次输入密码"
            placeholderTextColor="#6F6287"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        {/* 协议勾选 */}
        <TouchableOpacity 
          style={styles.termsContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            我已阅读并同意 
            <Text style={styles.termsLink} onPress={() => openTerms('terms')}>《用户协议》</Text>
            和 
            <Text style={styles.termsLink} onPress={() => openTerms('privacy')}>《隐私政策》</Text>
          </Text>
        </TouchableOpacity>

        {/* 注册按钮 */}
        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A0A18" />
          ) : (
            <Text style={styles.registerButtonText}>注册</Text>
          )}
        </TouchableOpacity>

        {/* 登录链接 */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>已有账号？</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>立即登录</Text>
          </TouchableOpacity>
        </View>

        {/* 服务条款 */}
        <Text style={styles.terms}>
          注册即表示同意{' '}
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4C2F80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4C2F80',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#8D8DAA',
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
  },
  termsLink: {
    color: '#F8D05F',
    fontSize: 13,
  },
  registerButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  registerButtonText: {
    color: '#1A0A18',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  loginLink: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  terms: {
    color: '#6F6287',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
