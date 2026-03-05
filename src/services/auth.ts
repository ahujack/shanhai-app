import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

// 初始化 Web 浏览器重定向
WebBrowser.maybeCompleteAuthSession();

// Google 配置
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '737727918661-m4sk7shhlk7t5s5jk9b1e8rmov9saop4.apps.googleusercontent.com';

// 动态生成重定向 URI，根据平台不同使用不同的地址
const getGoogleRedirectUri = (): string => {
  // 首先尝试获取 scheme，如果失败则使用默认值
  let scheme = 'shanhai';
  
  try {
    // Web 平台使用 Vercel 部署的地址
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
      return 'https://shanhai-app.vercel.app/oauth/google';
    }
  } catch (e) {
    // 在 React Native 环境中 window 可能不可访问，忽略错误
  }
  
  // 原生平台使用自定义 scheme
  try {
    const uri = AuthSession.makeRedirectUri({
      scheme: scheme,
      path: 'oauth/google',
    });
    
    // 验证返回的 URI 是否有效
    if (uri && uri.startsWith('http')) {
      return uri;
    }
    
    // 如果返回的不是有效的 URL，构建一个
    return `${scheme}://oauth/google`;
  } catch (error) {
    console.error('Error creating redirect URI:', error);
    // 提供一个 fallback
    return `${scheme}://oauth/google`;
  }
};

// Facebook 配置
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'shanhai',
  path: 'oauth/facebook',
});

export interface SocialUserInfo {
  email?: string;
  name?: string;
  avatar?: string;
  id: string;
  idToken?: string;
  accessToken?: string;
}

/**
 * Google 登录
 */
export async function signInWithGoogle(): Promise<SocialUserInfo | null> {
  try {
    // 动态获取重定向 URI
    const redirectUri = getGoogleRedirectUri();
    console.log('Google Redirect URI:', redirectUri);

    // 验证 redirectUri 是否有效
    if (!redirectUri || redirectUri.trim() === '') {
      throw new Error('Invalid redirect URI');
    }

    const authRequest = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: true,
    });

    // 发起认证请求
    const result = await authRequest.promptAsync({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      // @ts-ignore - expo-auth-session 类型定义可能不完整
      windowFeatures: {
        width: 600,
        height: 700,
      },
    });

    if (result.type === 'success' && result.params) {
      const { id_token, access_token } = result.params;

      // 获取用户信息
      if (id_token) {
        // 解析 JWT token 获取用户信息
        const userInfo = parseJwt(id_token);
        return {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          idToken: id_token,
          accessToken: access_token,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    Alert.alert('登录失败', '无法使用 Google 登录，请重试');
    return null;
  }
}

/**
 * Facebook 登录
 */
export async function signInWithFacebook(): Promise<SocialUserInfo | null> {
  try {
    const redirectUri = FACEBOOK_REDIRECT_URI;
    console.log('Facebook Redirect URI:', redirectUri);

    const authRequest = new AuthSession.AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    // 构建授权 URL
    const authorizeUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public_profile,email&state=${authRequest.state}`;

    // 发起认证请求
    const result = await authRequest.promptAsync({
      authorizeUrl,
      // @ts-ignore
      windowFeatures: {
        width: 600,
        height: 700,
      },
    });

    if (result.type === 'success' && result.params) {
      const { code } = result.params;

      // 使用 code 换取 access token（需要在后端完成，这里简化处理）
      // 实际项目中应该将 code 发送到后端，由后端换取 access token
      return {
        id: `fb_${Date.now()}`,
        idToken: code,
        accessToken: code,
      };
    }

    return null;
  } catch (error) {
    console.error('Facebook Sign In Error:', error);
    Alert.alert('登录失败', '无法使用 Facebook 登录，请重试');
    return null;
  }
}

/**
 * 解析 JWT Token
 */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return {};
  }
}

/**
 * 打开外部链接
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('错误', '无法打开链接');
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
  }
}

/**
 * 获取应用的深链接 URL
 */
export function getDeepLinkUrl(): string {
  return Platform.OS === 'ios'
    ? 'shanhai://oauth/google'
    : 'shanhai://oauth/google';
}
