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
import { useI18nStore } from '../src/store/i18n';
import { localizeAuthMessage } from '../src/utils/authMessage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const language = useI18nStore((state) => state.language);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);

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
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入邮箱地址', 'Please enter your email address.', '請輸入郵箱地址'));
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入有效的邮箱地址', 'Please enter a valid email address.', '請輸入有效的郵箱地址'));
      return;
    }

    setIsLoading(true);
    try {
      // 调用后端 API 发送验证码
      const result = await authApi.sendCode({ email, purpose: 'reset' });

      if (result.success) {
        Alert.alert(
          tx('验证码已发送到您的邮箱', 'Verification code sent to your inbox', '驗證碼已發送到您的郵箱'),
          tx('请查收邮件', 'Please check your email.', '請查收郵件'),
        );
        setIsCodeSent(true);
        setCountdown(60);
        setStep('reset');
      } else {
        const msg = localizeAuthMessage({
          rawMessage: result.message,
          language,
          fallback: {
            zhCN: '请重试',
            enUS: 'Please try again.',
            zhTW: '請重試',
          },
        });
        Alert.alert(tx('发送失败', 'Send failed', '發送失敗'), msg);
      }
    } catch (error) {
      Alert.alert(
        tx('发送失败', 'Send failed', '發送失敗'),
        tx('网络错误，请重试', 'Network error. Please try again.', '網路錯誤，請重試'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入验证码', 'Please enter verification code.', '請輸入驗證碼'));
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入新密码', 'Please enter a new password.', '請輸入新密碼'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('密码至少需要6位', 'Password must be at least 6 characters.', '密碼至少需要 6 位'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('两次输入的密码不一致', 'Passwords do not match.', '兩次輸入的密碼不一致'));
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
        Alert.alert(
          tx('密码重置成功', 'Password reset successful', '密碼重置成功'),
          tx('请使用新密码登录', 'Please log in with your new password.', '請使用新密碼登入'),
          [
          {
            text: tx('去登录', 'Go to login', '去登入'),
            onPress: () => router.replace('/login'),
          },
        ]);
      } else {
        const msg = localizeAuthMessage({
          rawMessage: result.message,
          language,
          fallback: {
            zhCN: '验证码错误或已过期',
            enUS: 'Verification code is invalid or expired.',
            zhTW: '驗證碼錯誤或已過期',
          },
        });
        Alert.alert(
          tx('重置失败', 'Reset failed', '重置失敗'),
          msg,
        );
      }
    } catch (error) {
      Alert.alert(
        tx('重置失败', 'Reset failed', '重置失敗'),
        tx('网络错误，请重试', 'Network error. Please try again.', '網路錯誤，請重試'),
      );
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
          <Text style={styles.backButtonText}>{tx('← 返回', '← Back', '← 返回')}</Text>
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>{tx('找回密码', 'Reset Password', '找回密碼')}</Text>
          <Text style={styles.subtitle}>{tx('通过邮箱验证码重置密码', 'Reset password via email verification code', '透過郵箱驗證碼重置密碼')}</Text>
        </View>

        {/* 步骤1：输入邮箱 */}
        {step === 'email' && (
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>{tx('邮箱地址', 'Email Address', '郵箱地址')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('请输入注册邮箱', 'Enter your registered email', '請輸入註冊郵箱')}
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
                  {countdown > 0 ? `${countdown}s` : (isCodeSent ? tx('重新发送', 'Resend', '重新發送') : tx('发送验证码', 'Send Code', '發送驗證碼'))}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 步骤2：输入新密码 */}
        {step === 'reset' && (
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>{tx('验证码', 'Verification Code', '驗證碼')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('请输入邮箱收到的验证码', 'Enter the code sent to your email', '請輸入郵箱收到的驗證碼')}
              placeholderTextColor="#6F6287"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.inputLabel}>{tx('新密码', 'New Password', '新密碼')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('请输入新密码（至少6位）', 'Enter new password (at least 6 chars)', '請輸入新密碼（至少 6 位）')}
              placeholderTextColor="#6F6287"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>{tx('确认密码', 'Confirm Password', '確認密碼')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('请再次输入新密码', 'Re-enter new password', '請再次輸入新密碼')}
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
                <Text style={styles.resetButtonText}>{tx('重置密码', 'Reset Password', '重置密碼')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
              disabled={countdown > 0}
            >
              <Text style={styles.resendButtonText}>
                {countdown > 0
                  ? tx('重新发送验证码 ({countdown}s)', 'Resend code ({countdown}s)', '重新發送驗證碼（{countdown}s）').replace(
                      '{countdown}',
                      String(countdown),
                    )
                  : tx('重新发送验证码', 'Resend verification code', '重新發送驗證碼')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 登录链接 */}
        <View style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{tx('想起密码了？', 'Remembered your password?', '想起密碼了？')}</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLinkButton}>{tx('立即登录', 'Log In', '立即登入')}</Text>
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
