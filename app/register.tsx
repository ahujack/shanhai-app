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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../src/store/user';
import { useI18nStore } from '../src/store/i18n';
import { localizeAuthMessage } from '../src/utils/authMessage';
import { SiteComplianceFooter } from '../components/SiteComplianceFooter';
import { clearStoredReferralCode, getStoredReferralCode } from '../src/utils/referralAttribution';
import LanguageToggle from '../components/LanguageToggle';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register, sendCode, isLoading } = useUserStore();
  const language = useI18nStore((state) => state.language);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);
  
  // 从 URL 或已捕获的落地页 ref 获取推荐码
  const urlReferralCode = params.ref as string | undefined;
  const [storedReferralCode, setStoredReferralCode] = useState<string | null>(null);
  const referralCode = urlReferralCode || storedReferralCode || undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSendFeedback, setCodeSendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');

  React.useEffect(() => {
    let cancelled = false;
    getStoredReferralCode().then((code) => {
      if (!cancelled) setStoredReferralCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (isCodeSent) {
      setIsCodeSent(false);
    }
  }, [countdown, isCodeSent]);

  const openTerms = (type: 'terms' | 'privacy') => {
    setTermsType(type);
    setShowTermsModal(true);
  };

  const ensureTermsAgreed = (actionLabel: string): boolean => {
    if (agreedToTerms) {
      setTermsError('');
      return true;
    }
    const msg = tx(
      `请先勾选同意《用户协议》和《隐私政策》，再${actionLabel}`,
      `Please agree to Terms and Privacy Policy before ${actionLabel}.`,
      `請先勾選同意《用戶協議》和《隱私政策》，再${actionLabel}`,
    );
    setTermsError(msg);
    Alert.alert(tx('请先同意协议', 'Please agree first', '請先同意協議'), msg);
    return false;
  };

  const getFriendlySendCodeError = (rawMessage?: string) => {
    const msg = (rawMessage || '').toLowerCase();
    if (/已注册/.test(rawMessage || '')) {
      return tx(
        '该邮箱已注册，可直接去登录；如忘记密码可使用找回密码。',
        'This email is already registered. You can log in directly or reset your password.',
        '該郵箱已註冊，可直接登入；若忘記密碼可使用找回密碼。',
      );
    }
    if (/频繁|too many|limit|稍后/.test(msg)) {
      return tx(
        '请求过于频繁，请稍等 1 分钟后再试。',
        'Too many requests. Please wait 1 minute and try again.',
        '請求過於頻繁，請稍等 1 分鐘後再試。',
      );
    }
    if (/network|timeout|连接|网络|failed to fetch|load failed/.test(msg)) {
      return tx(
        '网络连接不稳定，建议切换网络后重试。',
        'Network seems unstable. Please switch network and retry.',
        '網路連線不穩定，建議切換網路後重試。',
      );
    }
    if (/resend_api_key|邮件服务|mail service|smtp|from|domain|发件/.test(msg)) {
      return tx(
        '邮件服务暂时异常，请稍后重试；若持续失败请联系管理员。',
        'Mail service is temporarily unavailable. Please try again later, or contact support if it persists.',
        '郵件服務暫時異常，請稍後重試；若持續失敗請聯繫管理員。',
      );
    }
    return tx(
      '验证码发送失败，请重试；也可检查垃圾邮箱/广告邮件。',
      'Failed to send verification code. Please retry and check spam/promotions inbox.',
      '驗證碼發送失敗，請重試；也可檢查垃圾郵件/廣告郵件。',
    );
  };

  const handleSendCode = async () => {
    if (!ensureTermsAgreed(tx('获取验证码', 'requesting code', '獲取驗證碼'))) {
      return;
    }
    
    if (!email.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入邮箱地址', 'Please enter your email address.', '請輸入郵箱地址'));
      setCodeSendFeedback({ type: 'error', text: tx('请先输入邮箱地址。', 'Please enter your email first.', '請先輸入郵箱地址。') });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入有效的邮箱地址', 'Please enter a valid email address.', '請輸入有效的郵箱地址'));
      setCodeSendFeedback({ type: 'error', text: tx('邮箱格式不正确，请检查后重试。', 'Invalid email format. Please check and retry.', '郵箱格式不正確，請檢查後重試。') });
      return;
    }

    // 调用后端 API 发送注册验证码
    const result = await sendCode(email, 'register');

    if (result?.success) {
      Alert.alert(
        tx('验证码已发送到您的邮箱', 'Verification code sent to your inbox', '驗證碼已發送到您的郵箱'),
        tx('请查收邮件', 'Please check your email.', '請查收郵件'),
      );
      setCodeSendFeedback({
        type: 'success',
        text: tx(
          '验证码已发送，若 1-2 分钟未收到，请检查垃圾邮箱/广告邮件。',
          'Code sent. If not received in 1-2 minutes, check spam/promotions.',
          '驗證碼已發送，若 1-2 分鐘未收到，請檢查垃圾郵件/廣告郵件。',
        ),
      });
      setIsCodeSent(true);
      setCountdown(60);
    } else {
      const friendly = localizeAuthMessage({
        rawMessage: result?.message,
        language,
        fallback: {
          zhCN: getFriendlySendCodeError(result?.message),
          enUS: 'Failed to send verification code. Please retry and check spam/promotions inbox.',
          zhTW: '驗證碼發送失敗，請重試；也可檢查垃圾郵件/廣告郵件。',
        },
      });
      setCodeSendFeedback({ type: 'error', text: friendly });
      Alert.alert(tx('发送失败', 'Send failed', '發送失敗'), friendly);
    }
  };

  const handleRegister = async () => {
    if (!ensureTermsAgreed(tx('注册', 'registering', '註冊'))) {
      return;
    }
    
    // 验证输入
    if (!email.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入邮箱地址', 'Please enter your email address.', '請輸入郵箱地址'));
      return;
    }
    if (!password.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入密码', 'Please enter your password.', '請輸入密碼'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('密码至少需要6位', 'Password must be at least 6 characters.', '密碼至少需要 6 位'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('两次输入的密码不一致', 'Passwords do not match.', '兩次輸入的密碼不一致'));
      return;
    }
    if (!code.trim()) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入验证码', 'Please enter verification code.', '請輸入驗證碼'));
      return;
    }

    const result = await register(email, password, code, name, referralCode);

    if (result?.success) {
      // 记住协议勾选状态
      await AsyncStorage.setItem('agreedToTerms', 'true');
      await clearStoredReferralCode();
      router.replace('/(tabs)');
    } else {
      const msg = localizeAuthMessage({
        rawMessage: result?.message,
        language,
        fallback: {
          zhCN: '请检查验证码是否正确',
          enUS: 'Please check whether your verification code is correct.',
          zhTW: '請檢查驗證碼是否正確',
        },
      });
      Alert.alert(
        tx('注册失败', 'Registration failed', '註冊失敗'),
        msg,
      );
    }
  };

  const handleLogin = () => {
    if (referralCode) {
      router.replace({ pathname: '/login', params: { ref: referralCode } });
      return;
    }
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo 和标题 */}
        <View style={styles.header}>
          <LanguageToggle compact style={styles.languageToggle} />
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>{tx('山海灵境', 'Shanhai Realm', '山海靈境')}</Text>
          <Text style={styles.subtitle}>{tx('保存你的解读，让下次追问接得上', 'Save readings and continue later', '保存你的解讀，讓下次追問接得上')}</Text>
          {referralCode ? (
            <Text style={styles.referralHint}>
              {tx('已带入邀请码：{code}', 'Referral code detected: {code}', '已帶入邀請碼：{code}').replace('{code}', referralCode)}
            </Text>
          ) : null}
        </View>

        {/* 输入框 */}
        <View style={styles.inputContainer}>
          {/* 用户名 */}
          <TextInput
            style={styles.input}
            placeholder={tx('昵称（可选）', 'Nickname (optional)', '暱稱（可選）')}
            placeholderTextColor="#6F6287"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            editable={!isLoading}
          />

          {/* 邮箱 */}
          <TextInput
            style={styles.input}
            placeholder={tx('邮箱地址', 'Email address', '郵箱地址')}
            placeholderTextColor="#6F6287"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (codeSendFeedback) setCodeSendFeedback(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          {/* 验证码 */}
          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder={tx('6 位验证码', '6-digit code', '6 位驗證碼')}
              placeholderTextColor="#6F6287"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.codeButton, (countdown > 0 || isLoading) && styles.codeButtonDisabled]}
              onPress={handleSendCode}
              disabled={countdown > 0 || isLoading}
            >
              <Text style={styles.codeButtonText}>
                {countdown > 0 ? `${countdown}s` : tx('获取验证码', 'Get Code', '獲取驗證碼')}
              </Text>
            </TouchableOpacity>
          </View>
          {!!codeSendFeedback && (
            <Text
              style={[
                styles.codeFeedbackText,
                codeSendFeedback.type === 'success' ? styles.codeFeedbackSuccess : styles.codeFeedbackError,
              ]}
            >
              {codeSendFeedback.text}
            </Text>
          )}

          {/* 密码 */}
          <TextInput
            style={styles.input}
            placeholder={tx('请输入密码（至少6位）', 'Enter password (at least 6 chars)', '請輸入密碼（至少 6 位）')}
            placeholderTextColor="#6F6287"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {/* 确认密码 */}
          <TextInput
            style={styles.input}
            placeholder={tx('请再次输入密码', 'Re-enter password', '請再次輸入密碼')}
            placeholderTextColor="#6F6287"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        {/* 协议勾选 */}
        <TouchableOpacity 
          style={[styles.termsContainer, !!termsError && styles.termsContainerError]}
          onPress={() => {
            setAgreedToTerms(!agreedToTerms);
            if (!agreedToTerms) setTermsError('');
          }}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            {tx('我已阅读并同意 ', 'I have read and agree to ', '我已閱讀並同意 ')}
            <Text style={styles.termsLink} onPress={() => openTerms('terms')}>
              {tx('《用户协议》', 'Terms of Service', '《用戶協議》')}
            </Text>
            {tx(' 和 ', ' and ', ' 和 ')}
            <Text style={styles.termsLink} onPress={() => openTerms('privacy')}>
              {tx('《隐私政策》', 'Privacy Policy', '《隱私政策》')}
            </Text>
          </Text>
        </TouchableOpacity>
        {!!termsError && <Text style={styles.termsErrorText}>{termsError}</Text>}

        {/* 注册按钮 */}
        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A0A18" />
          ) : (
            <Text style={styles.registerButtonText}>{tx('注册', 'Register', '註冊')}</Text>
          )}
        </TouchableOpacity>

        {/* 登录链接 */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{tx('已有账号？', 'Already have an account?', '已有帳號？')}</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>{tx('立即登录', 'Log In', '立即登入')}</Text>
          </TouchableOpacity>
        </View>

        {/* 服务条款 */}
        <Text style={styles.terms}>
          {tx('注册即表示同意 ', 'By registering you agree to ', '註冊即表示同意 ')}
          <Text style={styles.termsLink}>{tx('《用户协议》', 'Terms of Service', '《用戶協議》')}</Text>
          {tx(' 和 ', ' and ', ' 和 ')}
          <Text style={styles.termsLink}>{tx('《隐私政策》', 'Privacy Policy', '《隱私政策》')}</Text>
        </Text>

        <SiteComplianceFooter variant="full" />
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
  languageToggle: {
    marginBottom: 16,
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
  referralHint: {
    marginTop: 8,
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '600',
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
  codeFeedbackText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
  },
  codeFeedbackSuccess: {
    color: '#9CD9B0',
  },
  codeFeedbackError: {
    color: '#E9A5A5',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  termsContainerError: {
    borderWidth: 1,
    borderColor: '#E97878',
    borderRadius: 10,
    padding: 8,
    backgroundColor: 'rgba(233, 120, 120, 0.08)',
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
  termsErrorText: {
    color: '#E9A5A5',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
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
