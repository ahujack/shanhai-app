import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUserStore } from '../src/store/user';
import { signInWithGoogle } from '../src/services/auth';
import { SiteComplianceFooter } from '../components/SiteComplianceFooter';
import { useI18nStore } from '../src/store/i18n';
import { localizeAuthMessage } from '../src/utils/authMessage';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { sendCode, loginWithPassword, loginWithCode, loginWithSocial, isLoading } = useUserStore();
  const language = useI18nStore((state) => state.language);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);

  // 从 URL 获取推荐码
  const referralCode = params.ref as string | undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Toast 显示（带淡入淡出动画）
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ visible: true, message, type });
    Animated.timing(toastOpacity, { toValue: 1, useNativeDriver: true, duration: 200 }).start();
    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, useNativeDriver: true, duration: 200 }).start(({ finished }) => {
        if (finished) {
          setToast({ visible: false, message: '', type: 'info' });
          toastOpacity.setValue(0);
        }
      });
      toastTimeoutRef.current = null;
    }, 2500);
  };
  // 输入错误状态
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isCodeSent]);

  // 切换登录方式时重置验证码相关状态
  React.useEffect(() => {
    if (loginMethod === 'password') {
      setCode('');
      setCodeError('');
    }
  }, [loginMethod]);

  // 组件卸载时清理 Toast 定时器
  React.useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  // 邮箱验证
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError(tx('请输入邮箱地址', 'Please enter your email', '請輸入郵箱地址'));
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError(tx('请输入有效的邮箱地址', 'Please enter a valid email', '請輸入有效的郵箱地址'));
      return false;
    }
    setEmailError('');
    return true;
  };

  // 密码验证
  const validatePassword = (value: string): boolean => {
    if (!value.trim()) {
      setPasswordError(tx('请输入密码', 'Please enter password', '請輸入密碼'));
      return false;
    }
    if (value.length < 6) {
      setPasswordError(tx('密码至少需要6位', 'Password must be at least 6 characters', '密碼至少需要6位'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  // 验证码验证
  const validateCode = (value: string): boolean => {
    if (!value.trim()) {
      setCodeError(tx('请输入验证码', 'Please enter verification code', '請輸入驗證碼'));
      return false;
    }
    if (value.length !== 6) {
      setCodeError(tx('验证码为6位数字', 'Code must be 6 digits', '驗證碼為6位數字'));
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) return;
    if (isSendingCode) return;

    setIsSendingCode(true);
    setCodeError('');
    const result = await sendCode(email, 'login');
    setIsSendingCode(false);

    if (result?.success) {
      showToast(tx('验证码已发送，请查收邮件（含垃圾邮件箱）', 'Code sent. Please check your inbox/spam.', '驗證碼已發送，請查收郵件（含垃圾郵件箱）'), 'success');
      setIsCodeSent(true);
      setCountdown(60);
    } else {
      const msg = localizeAuthMessage({
        rawMessage: result?.message,
        language,
        fallback: {
          zhCN: '发送失败，请确认邮箱已注册或稍后重试',
          enUS: 'Send failed. Please verify your email or retry later.',
          zhTW: '發送失敗，請確認郵箱已註冊或稍後重試',
        },
      });
      showToast(msg, 'error');
      setCodeError(/邮箱|郵箱|email/i.test(msg) ? tx('请确认该邮箱已注册', 'Please confirm this email is registered', '請確認該郵箱已註冊') : '');
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;
    if (!validateEmail(email)) return;

    if (loginMethod === 'password') {
      if (!validatePassword(password)) return;
      const result = await loginWithPassword(email, password);
      if (result.success) {
        showToast(tx('登录成功，欢迎回来！', 'Login successful, welcome back!', '登入成功，歡迎回來！'), 'success');
        setTimeout(() => router.replace('/(tabs)'), 500);
      } else {
        const msg = localizeAuthMessage({
          rawMessage: result.message,
          language,
          fallback: {
            zhCN: '邮箱或密码错误，请检查后重试',
            enUS: 'Email or password is incorrect, please retry.',
            zhTW: '郵箱或密碼錯誤，請檢查後重試',
          },
        });
        showToast(msg, 'error');
        setPasswordError(/密码|密碼|password|credential/i.test(msg) ? msg : '');
      }
    } else {
      if (!validateCode(code)) return;
      const result = await loginWithCode(email, code);
      if (result.success) {
        showToast(tx('登录成功，欢迎回来！', 'Login successful, welcome back!', '登入成功，歡迎回來！'), 'success');
        setTimeout(() => router.replace('/(tabs)'), 500);
      } else {
        const msg = localizeAuthMessage({
          rawMessage: result.message,
          language,
          fallback: {
            zhCN: '验证码错误或已过期，请重新获取',
            enUS: 'Code invalid or expired. Please request a new one.',
            zhTW: '驗證碼錯誤或已過期，請重新獲取',
          },
        });
        showToast(msg, 'error');
        setCodeError(/验证码|驗證碼|code|otp/i.test(msg) ? msg : '');
      }
    }
  };

  const handleGuestMode = () => {
    router.replace('/(tabs)/profile');
  };

  const handleRegister = () => {
    if (referralCode) {
      router.push({ pathname: '/register', params: { ref: referralCode } });
      return;
    }
    router.push('/register');
  };

  // 忘记密码
  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;

    try {
      const userInfo = await signInWithGoogle();
      if (userInfo && userInfo.idToken) {
        const result = await loginWithSocial('google', userInfo.idToken, referralCode);
        if (result.success) {
          showToast(tx('登录成功，欢迎回来！', 'Login successful, welcome back!', '登入成功，歡迎回來！'), 'success');
          setTimeout(() => router.replace('/(tabs)'), 500);
        } else {
          const msg = localizeAuthMessage({
            rawMessage: result.message,
            language,
            fallback: {
              zhCN: 'Google 登录失败，请重试',
              enUS: 'Google login failed, please retry.',
              zhTW: 'Google 登入失敗，請重試',
            },
          });
          showToast(msg, 'error');
        }
      }
      // Web 环境下会跳转，不返回；原生环境可能取消授权
    } catch (error) {
      console.error('Google login error:', error);
      showToast(tx('Google 登录失败，请检查网络后重试', 'Google login failed. Please check network and retry.', 'Google 登入失敗，請檢查網路後重試'), 'error');
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={isWeb ? 'height' : Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Toast 提示（带淡入淡出） */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { top: insets.top + 12 },
            toast.type === 'error' && styles.toastError,
            toast.type === 'success' && styles.toastSuccess,
            { opacity: toastOpacity },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24 },
          isWeb && styles.scrollContentWeb,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={isWeb ? styles.formWrapperWeb : undefined}>
        {/* Logo 和标题 */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.registerButton, styles.webCursor]} onPress={handleRegister} activeOpacity={0.7}>
            <Text style={styles.registerButtonText}>{tx('注册', 'Register', '註冊')}</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>{tx('山海灵境', 'Shanhai Realm', '山海靈境')}</Text>
          <Text style={styles.subtitle}>{tx('探索你的命运之旅', 'Explore your destiny journey', '探索你的命運之旅')}</Text>
        </View>

        {/* 登录方式切换 */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'password' && styles.methodButtonActive]}
            onPress={() => {
              setLoginMethod('password');
              setEmailError('');
              setPasswordError('');
              setCodeError('');
            }}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'password' && styles.methodButtonTextActive]}>
              {tx('密码登录', 'Password Login', '密碼登入')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'code' && styles.methodButtonActive]}
            onPress={() => {
              setLoginMethod('code');
              setEmailError('');
              setPasswordError('');
              setCodeError('');
            }}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'code' && styles.methodButtonTextActive]}>
              {tx('验证码登录', 'Code Login', '驗證碼登入')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入框区域 */}
        <View style={styles.inputContainer}>
          {/* 邮箱输入 */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{tx('邮箱', 'Email', '郵箱')}</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder={tx('请输入邮箱地址', 'Enter your email', '請輸入郵箱地址')}
              placeholderTextColor="#6F6287"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              onBlur={() => email && validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* 密码登录 */}
          {loginMethod === 'password' && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{tx('密码', 'Password', '密碼')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]}
                  placeholder={tx('请输入密码（至少 6 位）', 'Enter password (min 6 chars)', '請輸入密碼（至少 6 位）')}
                  placeholderTextColor="#6F6287"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  onBlur={() => password && validatePassword(password)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#8D8DAA"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>{tx('忘记密码？', 'Forgot password?', '忘記密碼？')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 验证码登录 */}
          {loginMethod === 'code' && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{tx('验证码', 'Verification Code', '驗證碼')}</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.input, styles.codeInput, codeError ? styles.inputError : null]}
                  placeholder={tx('请输入 6 位数字验证码', 'Enter 6-digit code', '請輸入 6 位數字驗證碼')}
                  placeholderTextColor="#6F6287"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                    if (codeError) validateCode(text);
                  }}
                  onBlur={() => code && validateCode(code)}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.codeButton,
                    (countdown > 0 || isSendingCode) && styles.codeButtonDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || isLoading}
                >
                  {isSendingCode ? (
                    <ActivityIndicator size="small" color="#F8D05F" />
                  ) : (
                    <Text style={styles.codeButtonText}>
                      {countdown > 0
                        ? tx(`${countdown}s 后重发`, `Resend in ${countdown}s`, `${countdown}s 後重發`)
                        : isCodeSent
                        ? tx('重新发送', 'Resend', '重新發送')
                        : tx('获取验证码', 'Get Code', '獲取驗證碼')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
              {isCodeSent && (
                <Text style={styles.hintText}>
                  {tx('未收到？请检查垃圾邮件箱，或 ', 'Not received? Check spam, or ', '未收到？請檢查垃圾郵件箱，或 ')}
                  {countdown > 0 ? tx(`${countdown}s 后`, `after ${countdown}s`, `${countdown}s 後`) : tx('点击上方', 'tap above', '點擊上方')}
                  {tx('重新发送', ' to resend', '重新發送')}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 登录按钮 */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled, styles.webCursor]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A0A18" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>{tx('登录', 'Log In', '登入')}</Text>
          )}
        </TouchableOpacity>

        {/* 分割线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{tx('或', 'OR', '或')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 第三方登录 */}
        <TouchableOpacity
          style={[styles.socialButton, styles.webCursor]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <View style={styles.socialIconContainer}>
            <Text style={styles.socialIcon}>G</Text>
          </View>
          <Text style={styles.socialText}>{tx('Google 登录', 'Google Login', 'Google 登入')}</Text>
        </TouchableOpacity>

        {/* 游客模式 */}
        <TouchableOpacity style={[styles.guestButton, styles.webCursor]} onPress={handleGuestMode} activeOpacity={0.7}>
          <Text style={styles.guestText}>{tx('暂不登录，先逛逛', 'Skip for now', '暫不登入，先逛逛')}</Text>
        </TouchableOpacity>

        <SiteComplianceFooter variant="full" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Toast提示样式
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 47, 128, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B2A0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(178, 160, 255, 0.3)',
  },
  toastError: {
    backgroundColor: '#D32F2F',
  },
  toastSuccess: {
    backgroundColor: '#388E3C',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentWeb: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  formWrapperWeb: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  registerButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4C2F80',
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8D8DAA',
    marginTop: 6,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#4C2F80',
  },
  methodButtonText: {
    color: '#8D8DAA',
    fontSize: 14,
    fontWeight: '600',
  },
  methodButtonTextActive: {
    color: '#F8D05F',
  },
  inputContainer: {
    gap: 4,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
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
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    color: '#6F6287',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
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
    minWidth: 110,
  },
  codeButtonDisabled: {
    backgroundColor: '#3A3A5A',
  },
  codeButtonText: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '600',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showPasswordText: {
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#B2A0FF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
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
  webCursor: Platform.select({
    web: { cursor: 'pointer' as const },
    default: {},
  }),
});
