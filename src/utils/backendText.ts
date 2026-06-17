import type { AppLanguage } from '../i18n/translations';

const WUXING_LABEL: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 词组优先，避免单字误伤 */
const ZH_TW_PHRASE_PAIRS: Array<[string, string]> = [
  ['这几年', '這幾年'],
  ['当前', '當前'],
  ['解读', '解讀'],
  ['详细', '詳細'],
  ['简版', '簡版'],
  ['完整', '完整'],
  ['升级', '升級'],
  ['解锁', '解鎖'],
  ['窗口', '窗口'],
  ['关键', '關鍵'],
  ['事业', '事業'],
  ['运势', '運勢'],
  ['财运', '財運'],
  ['财务', '財務'],
  ['适合', '適合'],
  ['创业', '創業'],
  ['较好', '較好'],
  ['善于', '善於'],
  ['理财', '理財'],
  ['建议', '建議'],
  ['扩展', '擴展'],
  ['机会', '機會'],
  ['稳住', '穩住'],
  ['节奏', '節奏'],
  ['这份', '這份'],
  ['肝胆', '肝膽'],
  ['领导', '領導'],
  ['气质', '氣質'],
  ['加强', '加強'],
  ['颜色', '顏色'],
  ['环境', '環境'],
  ['职业', '職業'],
  ['锻炼', '鍛鍊'],
  ['来源', '來源'],
  ['说明', '說明'],
  ['加载', '載入'],
  ['异体', '異體'],
  ['开源', '開源'],
  ['样本', '樣本'],
  ['边界', '邊界'],
  ['离合法', '離合法'],
  ['技法', '技法'],
  ['投射', '投射'],
  ['生成', '生成'],
  ['结构', '結構'],
  ['稳定', '穩定'],
  ['连贯', '連貫'],
  ['情感', '情感'],
  ['健康', '健康'],
  ['综合', '綜合'],
  ['识别', '識別'],
  ['资料', '資料'],
  ['个人', '個人'],
  ['会员', '會員'],
  ['积分', '積分'],
  ['网络', '網路'],
  ['连接', '連線'],
];

const ZH_TW_CHAR_PAIRS: Array<[string, string]> = [
  ['运', '運'],
  ['势', '勢'],
  ['财', '財'],
  ['关', '關'],
  ['键', '鍵'],
  ['议', '議'],
  ['体', '體'],
  ['态', '態'],
  ['阶', '階'],
  ['节', '節'],
  ['业', '業'],
  ['宫', '宮'],
  ['线', '線'],
  ['发', '發'],
  ['稳', '穩'],
  ['险', '險'],
  ['压', '壓'],
  ['这', '這'],
  ['测', '測'],
  ['汉', '漢'],
  ['画', '畫'],
  ['气', '氣'],
  ['后', '後'],
  ['离', '離'],
  ['边', '邊'],
  ['样', '樣'],
  ['图', '圖'],
  ['说', '說'],
  ['应', '應'],
  ['发', '發'],
  ['创', '創'],
  ['实', '實'],
  ['现', '現'],
  ['经', '經'],
  ['历', '歷'],
  ['门', '門'],
  ['问', '問'],
  ['语', '語'],
  ['术', '術'],
  ['师', '師'],
  ['评', '評'],
  ['点', '點'],
  ['击', '擊'],
  ['显', '顯'],
  ['示', '示'],
];

function fixWuxingEnglish(text: string): string {
  return text
    .replace(/(wood|fire|earth|metal|water)性偏旺/gi, (_, wx: string) => {
      const key = String(wx).toLowerCase();
      return `${WUXING_LABEL[key] || wx}性偏旺`;
    })
    .replace(/(wood|fire|earth|metal|water)性偏弱/gi, (_, wx: string) => {
      const key = String(wx).toLowerCase();
      return `${WUXING_LABEL[key] || wx}性偏弱`;
    });
}

function toTraditionalChinese(text: string): string {
  let output = text;
  for (const [from, to] of ZH_TW_PHRASE_PAIRS) {
    output = output.replaceAll(from, to);
  }
  for (const [from, to] of ZH_TW_CHAR_PAIRS) {
    output = output.replaceAll(from, to);
  }
  return output;
}

/**
 * 后端/LLM 动态文案展示归一化：清理异常前缀，并按当前语言做兜底转换。
 */
export function normalizeBackendText(
  value: string | number | null | undefined,
  language: AppLanguage,
): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const cleaned = raw.replace(/meta\|/gi, '').replace(/\s{2,}/g, ' ').trim();
  const wuxingFixed = fixWuxingEnglish(cleaned);
  if (language === 'zh-TW') {
    return toTraditionalChinese(wuxingFixed);
  }
  return wuxingFixed;
}
