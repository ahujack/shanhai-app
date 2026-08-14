import { useEffect } from 'react';
import { Platform } from 'react-native';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&display=swap';

/** Web 异步注入衬线字体，不挡首屏 */
export default function WebFonts() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('shanhai-serif-font')) return;

    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';

    const preconnectGoogle = document.createElement('link');
    preconnectGoogle.rel = 'preconnect';
    preconnectGoogle.href = 'https://fonts.googleapis.com';

    const stylesheet = document.createElement('link');
    stylesheet.id = 'shanhai-serif-font';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = FONT_HREF;

    document.head.appendChild(preconnectGoogle);
    document.head.appendChild(preconnectGstatic);
    document.head.appendChild(stylesheet);
  }, []);

  return null;
}
