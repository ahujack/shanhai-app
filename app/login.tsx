import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/user';
import { signInWithGoogle } from '../src/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { sendCode, loginWithPassword, loginWithCode, loginWithSocial, isLoading } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password');
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
    const success = await sendCode(email, 'login');

    if (success) {
      Alert.alert('验证码已发送到您的邮箱', '请查收邮件');
      setIsCodeSent(true);
      setCountdown(60); // 开始60秒倒计时
    } else {
      Alert.alert('发送失败', '请重试');
    }
  };

  const handleLogin = async () => {
    console.log('[LoginScreen] handleLogin called, loginMethod:', loginMethod, 'agreedToTerms:', agreedToTerms, 'email:', email, 'password:', password ? '***' : 'empty');
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    // 首次登录需要勾选协议
    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意用户协议和隐私政策');
      console.log('[LoginScreen] Login blocked: agreedToTerms is false');
      return;
    }

    if (loginMethod === 'password') {
      // 密码登录
      if (!password.trim()) {
        Alert.alert('提示', '请输入密码');
        return;
      }
      console.log('[LoginScreen] Attempting password login for:', email);
      const success = await loginWithPassword(email, password);
      console.log('[LoginScreen] Password login result:', success);
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('登录失败', '邮箱或密码错误');
      }
    } else {
      // 验证码登录
      if (!code.trim()) {
        Alert.alert('提示', '请输入验证码');
        return;
      }
      console.log('[LoginScreen] Attempting code login for:', email);
      const success = await loginWithCode(email, code);
      console.log('[LoginScreen] Code login result:', success);
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('登录失败', '验证码错误或已过期');
      }
    }
  };

  const handleGuestMode = () => {
    router.replace('/(tabs)');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const openTerms = (type: 'terms' | 'privacy') => {
    setTermsType(type);
    setShowTermsModal(true);
  };

  const handleGoogleLogin = async () => {
    console.log('[LoginScreen] handleGoogleLogin called');
    // 首次登录需要勾选协议
    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意用户协议和隐私政策');
      return;
    }

    try {
      console.log('[LoginScreen] Starting Google sign in...');
      const userInfo = await signInWithGoogle();
      console.log('[LoginScreen] Google sign in result:', userInfo);
      if (userInfo && userInfo.idToken) {
        console.log('[LoginScreen] Calling loginWithSocial with Google...');
        const success = await loginWithSocial('google', userInfo.idToken);
        console.log('[LoginScreen] Social login result:', success);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('登录失败', '无法完成 Google 登录');
        }
      } else {
        console.log('[LoginScreen] Google sign in returned null');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('登录失败', 'Google 登录出错，请重试');
    }
  };

  // 用户协议内容
  const termsContent = `【山海灵境用户服务协议】

欢迎使用山海灵境！

一、服务条款的确认和接纳
本服务条款所称的用户是指完全同意本服务条款的用户。用户在使用山海灵境提供的服务时，应遵守本服务条款。山海灵境保留根据法律法规及业务发展需要修改本服务条款的权利。

二、服务内容
山海灵境提供命运探索服务，包括但不限于：
- 命理分析
- 运势预测
- 解读服务

三、用户行为规范
用户不得利用本服务从事以下行为：
1. 反对宪法所确定的基本原则的
2. 危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的
3. 损害国家荣誉和利益的
4. 煽动民族仇恨、民族歧视，破坏民族团结的
5. 破坏国家宗教政策，宣扬邪教和封建迷信的
6. 散布谣言，扰乱社会秩序，破坏社会稳定的
7. 散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的
8. 侮辱或者诽谤他人，侵害他人合法权益的
9. 含有法律、行政法规禁止的其他内容的

四、知识产权
山海灵境服务中包含的任何内容（包括但不限于文字、图片、视频、软件等）的知识产权归山海灵境或相应权利人所有。用户在使用本服务时产生的任何内容，其知识产权归用户所有，但用户授予山海灵境免费使用的权利、中断或终止。

五、服务变更
如因系统维护或升级的需要而需暂停网络服务，山海灵境将尽可能事先进行通知。用户在接受山海灵境服务时，应遵守法律法规，不得发布违法违规内容。

六、免责声明
山海灵境不对用户发布的内容的准确性、完整性、合法性负责。用户在使用本服务时，需自行承担风险。山海灵境保留随时修改或终止服务的权利。

七、联系方式
如对本服务条款有任何疑问，请联系我们的客服。

生效日期：2024年1月1日`;

  // 隐私政策内容
  const privacyContent = `【山海灵境隐私政策】

感谢您使用山海灵境！

一、信息的收集和使用
我们收集您提供的信息以提供服务：
1. 账户信息：当您注册时，我们需要您提供邮箱地址用于账户创建和身份验证
2. 个人信息：您可以选择提供姓名、出生日期等信息以获得更精准的命理分析
3. 使用数据：我们会收集您使用服务的行为数据以改善服务质量

二、信息共享
我们不会出售您的个人信息。在以下情况下，我们可能会共享您的信息：
1. 征得您同意后
2. 法律法规要求时
3. 保护山海灵境或其他用户的权利时

三、信息安全
我们采取合理的安全措施保护您的个人信息，包括：
1. 数据加密传输
2. 安全的服务器存储
3. 访问权限控制

四、Cookie使用
我们使用Cookie改善用户体验，您可以管理Cookie设置。

五、用户权利
您有权：
1. 访问您的个人信息
2. 更正不准确的信息
3. 删除您的账户和数据
4. 撤回同意

六、未成年人保护
我们不为13岁以下用户提供服务。

七、政策的更新
我们可能会更新本政策，更新后会及时通知用户。

八、联系我们
如有任何隐私相关问题，请联系我们。

生效日期：2024年1月1日`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo 和标题 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>注册</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>🏔️</Text>
          <Text style={styles.title}>山海灵境</Text>
          <Text style={styles.subtitle}>探索你的命运之旅</Text>
        </View>

        {/* 标题 */}
        <Text style={styles.sectionTitle}>登录</Text>

        {/* 登录方式切换 */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'password' && styles.methodButtonActive]}
            onPress={() => setLoginMethod('password')}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'password' && styles.methodButtonTextActive]}>
              密码登录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'code' && styles.methodButtonActive]}
            onPress={() => setLoginMethod('code')}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'code' && styles.methodButtonTextActive]}>
              验证码登录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入框 */}
        <View style={styles.inputContainer}>
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

          {/* 密码登录 */}
          {loginMethod === 'password' && (
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="#6F6287"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          )}

          {/* 验证码登录 */}
          {loginMethod === 'code' && (
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
          )}

          {/* 忘记密码 */}
          {loginMethod === 'password' && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>
          )}
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
        </View>

        {/* 游客模式 */}
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
          <Text style={styles.guestText}>暂不登录，先逛逛</Text>
        </TouchableOpacity>

        {/* 服务条款 */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>我已阅读并同意</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openTerms('terms')}>
            <Text style={styles.termsLink}>《用户协议》</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}>和</Text>
          <TouchableOpacity onPress={() => openTerms('privacy')}>
            <Text style={styles.termsLink}>《隐私政策》</Text>
          </TouchableOpacity>
        </View>

        {/* 协议弹窗 */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTermsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {termsType === 'terms' ? '用户协议' : '隐私政策'}
                </Text>
                <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalText}>
                  {termsType === 'terms' ? termsContent : privacyContent}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>我已阅读并同意</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
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
  forgotPassword: {
    alignSelf: 'flex-end',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  registerLink: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4C2F80',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4C2F80',
  },
  checkmark: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#6F6287',
    fontSize: 12,
  },
  termsLink: {
    color: '#B2A0FF',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1328',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#322243',
  },
  modalTitle: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#8D8DAA',
    fontSize: 20,
  },
  modalScroll: {
    padding: 20,
  },
  modalText: {
    color: '#F7F6F0',
    fontSize: 14,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#4C2F80',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
