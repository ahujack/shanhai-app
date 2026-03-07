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
import { authApi } from '../src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isCodeSent]);

  // 发送验证码
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

    setIsLoading(true);
    try {
      // 调用后端 API 发送验证码
      const result = await authApi.sendCode({ email, purpose: 'reset' });

      if (result.success) {
        Alert.alert('验证码已发送到您的邮箱', '请查收邮件');
        setIsCodeSent(true);
        setCountdown(60);
        setStep('reset');
      } else {
        Alert.alert('发送失败', result.message || '请重试');
      }
    } catch (error) {
      Alert.alert('发送失败', '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('提示', '请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('提示', '密码至少需要6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.resetPassword({
        email,
        code,
        newPassword,
      });

      if (result.success) {
        Alert.alert('密码重置成功', '请使用新密码登录', [
          {
            text: '去登录',
            onPress: () => router.replace('/login'),
          },
        ]);
      } else {
        Alert.alert('重置失败', result.message || '验证码错误或已过期');
      }
    } catch (error) {
      Alert.alert('重置失败', '网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>找回密码</Text>
          <Text style={styles.subtitle}>通过邮箱验证码重置密码</Text>
        </View>

        {/* 步骤1：输入邮箱 */}
        {step === 'email' && (
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>邮箱地址</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入注册邮箱"
              placeholderTextColor="#6F6287"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.sendCodeButton, (countdown > 0 || isLoading) && styles.sendCodeButtonDisabled]}
              onPress={handleSendCode}
              disabled={countdown > 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1A0A18" />
              ) : (
                <Text style={styles.sendCodeButtonText}>
                  {countdown > 0 ? `${countdown}s` : (isCodeSent ? '重新发送' : '发送验证码')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 步骤2：输入新密码 */}
        {step === 'reset' && (
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>验证码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱收到的验证码"
              placeholderTextColor="#6F6287"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.inputLabel}>新密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入新密码（至少6位）"
              placeholderTextColor="#6F6287"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>确认密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请再次输入新密码"
              placeholderTextColor="#6F6287"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1A0A18" />
              ) : (
                <Text style={styles.resetButtonText}>重置密码</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
              disabled={countdown > 0}
            >
              <Text style={styles.resendButtonText}>
                {countdown > 0 ? `重新发送验证码 (${countdown}s)` : '重新发送验证码'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 登录链接 */}
        <View style={styles.loginLink}>
          <Text style={styles.loginLinkText}>想起密码了？</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLinkButton}>立即登录</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#F8D05F',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    marginTop: 8,
  },
  formContainer: {
    gap: 16,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  inputLabel: {
    color: '#B2B4C8',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 14,
    color: '#F7F6F0',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#322243',
  },
  sendCodeButton: {
    backgroundColor: '#4C2F80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#3A3A5A',
  },
  sendCodeButtonText: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resetButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  resetButtonText: {
    color: '#1A0A18',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    color: '#B2A0FF',
    fontSize: 14,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  loginLinkText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  loginLinkButton: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
});
