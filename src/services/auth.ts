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
  return Platform.OS === 'web';
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
 * 生成随机 nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // 回退方案
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Google 登录 - Web 环境使用原生浏览器重定向
 */
export async function signInWithGoogle(): Promise<SocialUserInfo | null> {
  try {
    const redirectUri = getGoogleRedirectUri();
    console.log('[Auth] Google Redirect URI:', redirectUri);
    console.log('[Auth] Platform.OS:', Platform.OS);

    if (!redirectUri) {
      throw new Error('Invalid redirect URI');
    }

    // 生成 nonce 并保存到 sessionStorage
    const nonce = generateNonce();
    sessionStorage.setItem('google_oauth_nonce', nonce);
    sessionStorage.setItem('google_oauth_redirect_uri', redirectUri);

    // 构建授权 URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid profile email',
      nonce: nonce,
    });

    const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('[Auth] Full Authorize URL:', authorizeUrl);

    // Web 环境：直接使用浏览器重定向
    if (isWeb() && typeof window !== 'undefined') {
      window.location.href = authorizeUrl;
      return null;
    }

    // 原生环境：使用 expo-auth-session（这里其实不太会走到，因为 isWeb() 在 Expo 中会返回 true）
    // 为了兼容性，这里还是保留 expo-auth-session 的逻辑
    const { makeRedirectUri } = await import('expo-auth-session');
    const nativeRedirectUri = makeRedirectUri({
      scheme: 'shanhai',
      path: 'oauth/google',
    });

    const { AuthRequest } = await import('expo-auth-session');
    const authRequest = new AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: nativeRedirectUri,
      responseType: 'id_token',
      usePKCE: false,
      nonce: nonce,
    });

    const result = await authRequest.promptAsync({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

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
    }

    return null;
  } catch (error) {
    console.error('[Auth] Google Sign In Error:', error);
    Alert.alert('登录失败', '无法使用 Google 登录，请重试');
    return null;
  }
}

/**
 * Facebook 登录 - Web 环境使用原生浏览器重定向
 */
export async function signInWithFacebook(): Promise<SocialUserInfo | null> {
  try {
    const redirectUri = getFacebookRedirectUri();
    console.log('[Auth] Facebook Redirect URI:', redirectUri);

    // Web 环境：直接使用浏览器重定向
    if (isWeb() && typeof window !== 'undefined') {
      const state = generateNonce();
      sessionStorage.setItem('facebook_oauth_state', state);
      sessionStorage.setItem('facebook_oauth_redirect_uri', redirectUri);

      const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'public_profile,email',
        state: state,
      });

      const authorizeUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
      window.location.href = authorizeUrl;
      return null;
    }

    // 原生环境
    const { makeRedirectUri, AuthRequest } = await import('expo-auth-session');
    const nativeRedirectUri = makeRedirectUri({
      scheme: 'shanhai',
      path: 'oauth/facebook',
    });

    const state = generateNonce();
    const authRequest = new AuthRequest({
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri: nativeRedirectUri,
      responseType: 'code',
      usePKCE: false,
      state: state,
    });

    const result = await authRequest.promptAsync({
      authorizeUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
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

/**
 * 处理 OAuth 回调 - 从 URL 中提取 id_token 并解析用户信息
 * 这个函数在 OAuth 回调页面调用
 */
export async function handleGoogleCallback(): Promise<SocialUserInfo | null> {
  try {
    if (typeof window === 'undefined' || !window.location) {
      return null;
    }

    const urlParams = new URLSearchParams(window.location.hash.substring(1)); // # 后面的参数
    const idToken = urlParams.get('id_token');
    const error = urlParams.get('error');

    if (error) {
      console.error('[Auth] Google callback error:', error);
      return null;
    }

    if (idToken) {
      // 验证 nonce
      const savedNonce = sessionStorage.getItem('google_oauth_nonce');
      const userInfo = parseJwt(idToken);
      
      // nonce 验证（如果需要更安全的话可以启用）
      // if (savedNonce !== userInfo.nonce) {
      //   console.error('[Auth] Nonce mismatch');
      //   return null;
      // }

      // 清理 sessionStorage
      sessionStorage.removeItem('google_oauth_nonce');
      sessionStorage.removeItem('google_oauth_redirect_uri');

      return {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        idToken: idToken,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] Handle Google callback error:', error);
    return null;
  }
}
