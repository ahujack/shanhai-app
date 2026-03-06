import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

// 初始化 Web 浏览器重定向
WebBrowser.maybeCompleteAuthSession();

// Google 配置
const GOOGLE_CLIENT_ID = '737727918661-m4sk7shhlk7t5s5jk9b1e8rmov9saop4.apps.googleusercontent.com';

// Web 环境的重定向 URI (生产环境)
const GOOGLE_WEB_REDIRECT_URI = 'https://shanhai-app.vercel.app/oauth/google';

// 开发环境 Web 重定向 URI
const GOOGLE_WEB_DEV_REDIRECT_URI = 'http://localhost:8081/oauth/google';

// 检测是否为 Web 环境
const isWeb = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Platform.OS === 'web' || window.location.protocol === 'file:' || window.location.protocol === 'http:';
};

// 动态获取重定向 URI
const getGoogleRedirectUri = (): string => {
  // Web 环境
  if (isWeb()) {
    // 开发环境使用 localhost
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      return GOOGLE_WEB_DEV_REDIRECT_URI;
    }
    // 生产环境使用 Vercel URL
    return GOOGLE_WEB_REDIRECT_URI;
  }
  
  // 原生平台使用自定义 scheme
  return 'shanhai://oauth/google';
};

// Facebook 配置
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';

const getFacebookRedirectUri = (): string => {
  if (isWeb()) {
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      return 'http://localhost:8081/oauth/facebook';
    }
    return 'https://shanhai-app.vercel.app/oauth/facebook';
  }
  return 'shanhai://oauth/facebook';
};

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
    // 获取重定向 URI
    const redirectUri = getGoogleRedirectUri();
    console.log('[Auth] Google Redirect URI:', redirectUri);
    console.log('[Auth] Platform.OS:', Platform.OS);
    console.log('[Auth] Is Web:', isWeb());

    // 验证 redirectUri 是否有效
    if (!redirectUri || redirectUri.trim() === '') {
      throw new Error('Invalid redirect URI');
    }

    // 验证 redirectUri 是有效的 URL
    try {
      const testUrl = new URL(redirectUri);
      console.log('[Auth] Redirect URI is valid URL, protocol:', testUrl.protocol);
    } catch (e) {
      console.error('[Auth] Invalid redirectUri:', redirectUri);
      throw new Error(`Invalid redirect URI: ${redirectUri}`);
    }

    // 创建认证请求
    const authRequest = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: true,
    });

    // 构建授权 URL
    const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizeUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_type', 'id_token');
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('nonce', authRequest.nonce || '');
    
    // 如果有 PKCE，使用 code_challenge
    if (authRequest.codeChallenge) {
      authorizeUrl.searchParams.set('code_challenge', authRequest.codeChallenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    }

    console.log('[Auth] Full Authorize URL:', authorizeUrl.toString());

    // 发起认证请求
    const result = await authRequest.promptAsync({
      authorizeUrl: authorizeUrl.toString(),
    });

    console.log('[Auth] Auth result type:', result.type);

    if (result.type === 'success' && result.params) {
      const { id_token, access_token } = result.params;

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
    } else if (result.type === 'cancel') {
      console.log('[Auth] User cancelled Google sign in');
      return null;
    }

    return null;
  } catch (error) {
    console.error('[Auth] Google Sign In Error:', error);
    Alert.alert('登录失败', '无法使用 Google 登录，请重试');
    return null;
  }
}

/**
 * Facebook 登录
 */
export async function signInWithFacebook(): Promise<SocialUserInfo | null> {
  try {
    const redirectUri = getFacebookRedirectUri();
    console.log('[Auth] Facebook Redirect URI:', redirectUri);

    const authRequest = new AuthSession.AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    // 构建授权 URL
    const authorizeUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authorizeUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', 'public_profile,email');
    authorizeUrl.searchParams.set('state', authRequest.state || '');
    
    if (authRequest.codeChallenge) {
      authorizeUrl.searchParams.set('code_challenge', authRequest.codeChallenge);
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    }

    // 发起认证请求
    const result = await authRequest.promptAsync({
      authorizeUrl: authorizeUrl.toString(),
    });

    if (result.type === 'success' && result.params) {
      const { code } = result.params;

      return {
        id: `fb_${Date.now()}`,
        idToken: code,
        accessToken: code,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] Facebook Sign In Error:', error);
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
    console.error('[Auth] Failed to parse JWT:', error);
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
    console.error('[Auth] Failed to open URL:', error);
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
