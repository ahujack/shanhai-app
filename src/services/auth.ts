import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

// 初始化 Web 浏览器重定向
WebBrowser.maybeCompleteAuthSession();

// Google 配置
const GOOGLE_CLIENT_ID = '737727918661-m4sk7shhlk7t5s5jk9b1e8rmov9saop4.apps.googleusercontent.com';

// 生产环境 Web 重定向 URI
const GOOGLE_WEB_REDIRECT_URI = 'https://shanhai-app.vercel.app/oauth/google';

// 开发环境 Web 重定向 URI
const GOOGLE_WEB_DEV_REDIRECT_URI = 'http://localhost:8081/oauth/google';

// 检测是否为 Web 环境
const isWeb = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Platform.OS === 'web' || window.location.protocol === 'file:' || window.location.protocol === 'http:' || window.location.protocol === 'https:';
};

// 动态获取重定向 URI
const getGoogleRedirectUri = (): string => {
  if (isWeb()) {
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      return GOOGLE_WEB_DEV_REDIRECT_URI;
    }
    return GOOGLE_WEB_REDIRECT_URI;
  }
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
    const redirectUri = getGoogleRedirectUri();
    console.log('[Auth] Google Redirect URI:', redirectUri);
    console.log('[Auth] Platform.OS:', Platform.OS);

    if (!redirectUri) {
      throw new Error('Invalid redirect URI');
    }

    // 构建授权 URL
    const nonce = Math.random().toString(36).substring(2, 15);
    const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizeUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_type', 'id_token');
    authorizeUrl.searchParams.set('scope', 'openid profile email');
    authorizeUrl.searchParams.set('nonce', nonce);

    console.log('[Auth] Full Authorize URL:', authorizeUrl.toString());

    // Web 环境：直接使用浏览器重定向
    if (isWeb() && typeof window !== 'undefined') {
      // 保存 nonce 到 sessionStorage，供回调时验证
      sessionStorage.setItem('google_oauth_nonce', nonce);
      
      // 重定向到 Google 授权页面
      window.location.href = authorizeUrl.toString();
      return null;
    }

    // 原生环境：使用 expo-auth-session
    const authRequest = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    });

    const result = await authRequest.promptAsync({
      authorizeUrl: authorizeUrl.toString(),
    });

    console.log('[Auth] Auth result type:', result.type);

    if (result.type === 'success' && result.params) {
      const { id_token, access_token } = result.params;

      if (id_token) {
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

    // Web 环境：直接使用浏览器重定向
    if (isWeb() && typeof window !== 'undefined') {
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('facebook_oauth_state', state);

      const authorizeUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      authorizeUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('scope', 'public_profile,email');
      authorizeUrl.searchParams.set('state', state);

      window.location.href = authorizeUrl.toString();
      return null;
    }

    // 原生环境
    const authRequest = new AuthSession.AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
    });

    const authorizeUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authorizeUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', 'public_profile,email');
    authorizeUrl.searchParams.set('state', authRequest.state || '');

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
