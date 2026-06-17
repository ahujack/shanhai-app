import React, { useEffect, useRef, useState, createElement } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../constants/Colors';
import { ziApi, ZiResult, handwritingApi, pointsApi } from '../../src/services/api';
import { trackFeature } from '../../src/services/analytics';
import AccuracyFeedback from '../../components/AccuracyFeedback';
import ResultShareCard from '../../components/ResultShareCard';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { usePersonaStore } from '../../src/store/persona';
import { useUserStore } from '../../src/store/user';
import { isMembershipActive } from '../../src/utils/membership';
import { localizeAuthMessage } from '../../src/utils/authMessage';
import HandwritingCanvas from '../../components/HandwritingCanvas';
import { useI18nStore } from '../../src/store/i18n';

/** Web 上 RN Image 对 raw.githubusercontent.com 等外链偶发不显示，用原生 img + no-referrer 更稳 */
function OracleGlyphImage({ uri, ziChar, style }: { uri: string; ziChar: string; style: { width: number; height: number } }) {
  if (Platform.OS === 'web') {
    return createElement('img', {
      src: uri,
      alt: `「${ziChar}」甲骨字形示意`,
      referrerPolicy: 'no-referrer',
      style: { width: style.width, height: style.height, objectFit: 'contain' as const },
    });
  }
  return <Image source={{ uri }} style={style} resizeMode="contain" />;
}

export default function ZiScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillZi?: string; fromChat?: string; userQuestion?: string }>();
  const fromChat = (Array.isArray(params.fromChat) ? params.fromChat[0] : params.fromChat) === '1';
  const [inputZi, setInputZi] = useState('');
  const [result, setResult] = useState<ZiResult | null>(null);
  const [resultStage, setResultStage] = useState<'idle' | 'preview' | 'full'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [handwritingStage, setHandwritingStage] = useState<'idle' | 'recognizing' | 'analyzing'>('idle');
  const [ritualReady, setRitualReady] = useState(false);
  const [ritualCountdown, setRitualCountdown] = useState(0);
  const [showColdReading, setShowColdReading] = useState(true);
  const [ziPointsCost, setZiPointsCost] = useState(10);
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [showSmartCta, setShowSmartCta] = useState(false);
  // 新增：手写模式
  const [isHandwritingMode, setIsHandwritingMode] = useState(false);
  /** 手写识别成功后的预览（手写 Tab 无输入框，需单独展示；积分不足时仍有字可看） */
  const [handwritingPreview, setHandwritingPreview] = useState<{ zi: string; confidence: number } | null>(null);
  // 用户选择的测字方向（单选）
  const [selectedAspect, setSelectedAspect] = useState('');
  const [customAspect, setCustomAspect] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const oracleUnlockAnim = useRef(new Animated.Value(0)).current;
  
  // 可选的测字方面
  const aspectOptions = ['事业', '财运', '婚姻', '学业', '健康', '人际关系'];
  
  // 切换方向（单选，再次点击可取消）
  const toggleAspect = (aspect: string) => {
    setSelectedAspect((prev) => (prev === aspect ? '' : aspect));
  };

  const getFocusAspect = (): string | undefined => {
    const custom = customAspect.trim();
    if (custom) return custom;
    if (selectedAspect) return selectedAspect;
    return undefined;
  };

  const getWuxingTheme = (wuxing?: string) => {
    const map: Record<string, { bg: string; glow: string }> = {
      木: { bg: '#102317', glow: 'rgba(76, 175, 80, 0.16)' },
      火: { bg: '#2A1515', glow: 'rgba(244, 67, 54, 0.16)' },
      土: { bg: '#231B15', glow: 'rgba(141, 110, 99, 0.18)' },
      金: { bg: '#262315', glow: 'rgba(255, 193, 7, 0.18)' },
      水: { bg: '#121E2D', glow: 'rgba(33, 150, 243, 0.18)' },
    };
    return map[wuxing || ''] || { bg: '#1a1a2e', glow: 'rgba(255,255,255,0.06)' };
  };
  
  // 聊天相关
  const { messages, sendMessage } = useChatStore();
  const { active: persona } = usePersonaStore();
  const { user } = useUserStore();
  const language = useI18nStore((state) => state.language);
  const t = useI18nStore((state) => state.t);
  const tx = (zh: string, en: string, tw: string) => (language === 'en-US' ? en : language === 'zh-TW' ? tw : zh);
  const aspectOptionLabels = React.useMemo<Record<string, string>>(
    () => ({
      事业: tx('事业', 'Career', '事業'),
      财运: tx('财运', 'Wealth', '財運'),
      婚姻: tx('婚姻', 'Marriage', '婚姻'),
      学业: tx('学业', 'Study', '學業'),
      健康: tx('健康', 'Health', '健康'),
      人际关系: tx('人际关系', 'Relationships', '人際關係'),
    }),
    [language],
  );
  const normalizeZiText = React.useCallback(
    (value: string | number | null | undefined) => {
      const raw = String(value ?? '').trim();
      if (!raw) return '';
      const cleaned = raw.replace(/meta\|/gi, '').replace(/\s{2,}/g, ' ').trim();
      if (language !== 'zh-TW') return cleaned;
      const replacements: Array<[RegExp, string]> = [
        [/测/g, '測'],
        [/汉/g, '漢'],
        [/运/g, '運'],
        [/势/g, '勢'],
        [/财/g, '財'],
        [/关/g, '關'],
        [/键/g, '鍵'],
        [/议/g, '議'],
        [/体/g, '體'],
        [/态/g, '態'],
        [/阶/g, '階'],
        [/节/g, '節'],
        [/业/g, '業'],
        [/画/g, '畫'],
        [/气/g, '氣'],
        [/稳/g, '穩'],
        [/后/g, '後'],
        [/这/g, '這'],
      ];
      return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), cleaned);
    },
    [language],
  );
  const wuxingTheme = getWuxingTheme(result?.zi?.wuxing);
  const shouldShowOracleUnlock = !!(
    result?.zi.oracleBone?.previewLocked &&
    (result.zi.oracleBone.totalImages || 0) > (result.zi.oracleBone.shownImages || 0)
  );
  const lockedImageCount = shouldShowOracleUnlock
    ? (result?.zi.oracleBone?.totalImages || 0) - (result?.zi.oracleBone?.shownImages || 0)
    : 0;
  const ziStateStorageKey = `zi_screen_state_${user?.id || 'guest'}`;

  useEffect(() => {
    if (!shouldShowOracleUnlock) {
      oracleUnlockAnim.setValue(0);
      return;
    }
    oracleUnlockAnim.setValue(0);
    Animated.sequence([
      Animated.timing(oracleUnlockAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(oracleUnlockAnim, {
        toValue: 0.85,
        duration: 240,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(oracleUnlockAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [oracleUnlockAnim, shouldShowOracleUnlock, result?.zi.zi]);

  const oracleUnlockAnimStyle = {
    opacity: oracleUnlockAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 1],
    }),
    transform: [
      {
        scale: oracleUnlockAnim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.96, 1.03, 1],
        }),
      },
    ],
  };

  const hasMembershipTier = user?.membership === 'vip' || user?.membership === 'premium';
  const isVip = isMembershipActive(user);
  const displayZiCost = isVip ? 0 : ziPointsCost;
  const membershipExpiredHint = hasMembershipTier && !isVip ? t('reading.form.membershipExpired', '会员权益已过期，当前按积分扣费。') : '';
  const ziTierLabel = !result
    ? isVip
      ? tx('深度版（会员）', 'Deep (Member)', '深度版（會員）')
      : tx('简版（免费）', 'Lite (Free)', '簡版（免費）')
    : result.interpretation?.premiumHint
    ? tx('简版（可升级）', 'Lite (Upgradeable)', '簡版（可升級）')
    : isVip
    ? tx('深度版（会员）', 'Deep (Member)', '深度版（會員）')
    : tx('完整版（积分解锁）', 'Full (Points Unlock)', '完整版（積分解鎖）');
  const ziTierDesc = result?.interpretation?.premiumHint
    ? tx('你当前看到的是可用精华版，升级后可直接解锁老师傅深批与行动建议。', 'You are viewing a lite preview. Upgrade to unlock full expert guidance.', '你目前看到的是精華版，升級後可解鎖完整深度建議。')
    : isVip
    ? tx('已解锁：部件拆解 + 方向深挖 + 老师傅批注 + 避坑提醒。', 'Unlocked: component analysis + deep focus guidance + expert notes.', '已解鎖：部件拆解 + 方向深挖 + 老師傅批注 + 避坑提醒。')
    : tx('当前已是完整版，升级会员可继续解锁更深层的年度批注与持续追问。', 'Current version is full. Upgrade membership for deeper annual notes and follow-up guidance.', '目前已是完整版，升級會員可解鎖更深層批注與持續追問。');

  useEffect(() => {
    let alive = true;
    pointsApi
      .getRules()
      .then((rules) => {
        if (alive && Number.isFinite(rules?.costs?.zi)) {
          setZiPointsCost(Math.max(1, Number(rules.costs.zi)));
        }
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setAvailablePoints(null);
      return () => {
        alive = false;
      };
    }
    pointsApi
      .getSummary()
      .then((summary) => {
        if (alive && Number.isFinite(summary?.availablePoints)) {
          setAvailablePoints(Math.max(0, Number(summary.availablePoints)));
        }
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const refreshPointsBalance = async () => {
    if (!user) return;
    try {
      const summary = await pointsApi.getSummary();
      if (Number.isFinite(summary?.availablePoints)) {
        setAvailablePoints(Math.max(0, Number(summary.availablePoints)));
      }
    } catch {
      // ignore
    }
  };

  const goPointsMall = () => router.push({ pathname: '/(tabs)/points', params: { tab: 'mall' } });
  const goVipPlan = () => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } });
  const projectedMonthlyRuns = 20;
  const projectedMonthlyPoints = ziPointsCost * projectedMonthlyRuns;
  const projectedCheckinDays = Math.ceil(projectedMonthlyPoints / 10);

  const buildPreviewResult = (zi: string, focusLabel?: string): ZiResult => {
    const cleanZi = zi.trim().charAt(0);
    const focus = (focusLabel || '').trim() || tx('综合', 'General', '綜合');
    return {
      handwriting: {
        pressure: 'medium',
        pressureInterpretation: tx(
          `你写的「${cleanZi}」已收到，正在生成笔迹细节解读…`,
          `Received "${cleanZi}". Generating handwriting detail...`,
          `你寫的「${cleanZi}」已收到，正在生成筆跡細節解讀…`,
        ),
        stability: 'average',
        stabilityInterpretation: tx(
          '先给你看核心结构，稳定性细节正在补全。',
          'Showing core structure first. Stability details are being completed.',
          '先給你看核心結構，穩定性細節正在補全。',
        ),
        structure: 'balanced',
        structureInterpretation: tx(
          '结构解析已启动，正在结合语境深挖。',
          'Structure analysis started. Deep interpretation is in progress.',
          '結構解析已啟動，正在結合語境深挖。',
        ),
        continuity: 'average',
        continuityInterpretation: tx(
          '连贯性需要结合完整模型结果，马上返回。',
          'Continuity needs full-model context and will return shortly.',
          '連貫性需要結合完整模型結果，馬上返回。',
        ),
        overallStyle: tx('快速预览', 'Quick preview', '快速預覽'),
        personalityInsights: [tx('分析中', 'Analyzing', '分析中'), tx('请稍候', 'Please wait', '請稍候')],
      },
      zi: {
        zi: cleanZi,
        bushou: tx('解析中', 'Analyzing', '解析中'),
        bihua: 0,
        wuxing: tx('待定', 'Pending', '待定'),
        yinyang: tx('待定', 'Pending', '待定'),
        jixiong: tx('待定', 'Pending', '待定'),
        yijing: tx('待定', 'Pending', '待定'),
        guaXiang: tx(
          '已进入深度推演，先为你呈现速览结果。',
          'Deep inference started. Showing quick preview first.',
          '已進入深度推演，先為你呈現速覽結果。',
        ),
        components: [cleanZi],
        componentMeanings: [tx('基础结构解析中', 'Base structure is being analyzed', '基礎結構解析中')],
        associativeMeaning: tx(
          `先给你看「${cleanZi}」的首轮结果，完整结论正在生成。`,
          `Showing the first-pass result of "${cleanZi}" first. Full conclusion is generating.`,
          `先給你看「${cleanZi}」的首輪結果，完整結論正在生成。`,
        ),
        lihefa: [tx('离合法细化生成中…', 'Split-combine details generating…', '離合法細化生成中…')],
        tianziGe: [tx('填字格细化生成中…', 'Grid-mapping details generating…', '填字格細化生成中…')],
        imageryInference: tx('象形投射生成中…', 'Imagery projection generating…', '象形投射生成中…'),
        probingQuestion: tx(
          `围绕「${focus}」，你最在意的真实问题是什么？`,
          `Around "${focus}", what is your most important real question right now?`,
          `圍繞「${focus}」，你最在意的真實問題是什麼？`,
        ),
        oracleBone: {
          exists: false,
          source: tx('加载中', 'Loading', '載入中'),
          imageUrls: [],
          totalImages: 0,
          shownImages: 0,
          previewLocked: false,
          interpretation: tx(
            `「${cleanZi}」的甲骨字形与意象正在整理中…`,
            `Oracle glyphs and imagery for "${cleanZi}" are being prepared...`,
            `「${cleanZi}」的甲骨字形與意象正在整理中…`,
          ),
          note: tx('完整字形与差异解读稍后展示。', 'Full glyph variations and differences will appear soon.', '完整字形與差異解讀稍後展示。'),
        },
      },
      interpretation: {
        overall: tx(
          `你这次重点想看「${focus}」，我先把字形和主线给你，完整方向解读正在生成。`,
          `You want to focus on "${focus}". Showing structure and main line first; full focused reading is generating.`,
          `你這次重點想看「${focus}」，我先把字形和主線給你，完整方向解讀正在生成。`,
        ),
        career: tx('事业向解读生成中…', 'Career reading generating…', '事業向解讀生成中…'),
        love: tx('情感向解读生成中…', 'Love reading generating…', '情感向解讀生成中…'),
        wealth: tx('财运向解读生成中…', 'Wealth reading generating…', '財運向解讀生成中…'),
        health: tx('健康向解读生成中…', 'Health reading generating…', '健康向解讀生成中…'),
        advice: [tx('先看上方基础结果，完整版会自动补全。', 'Check the base result first; full version will auto-complete soon.', '先看上方基礎結果，完整版會自動補全。')],
      },
      coldReadings: [
        tx(
          '收到这个字了，正在按你的方向做深度推演。',
          'Character received. Running deeper inference by your focus.',
          '收到這個字了，正在按你的方向做深度推演。',
        ),
      ],
      followUpQuestions: [
        tx(
          `围绕「${focus}」，你现在最希望先解决哪一步？`,
          `For "${focus}", which step do you want to solve first?`,
          `圍繞「${focus}」，你現在最希望先解決哪一步？`,
        ),
      ],
      metadata: {
        method: '测字有术 - AI笔迹与语义分析',
        generatedAt: new Date().toISOString(),
      },
    };
  };

  const analyzeZiInput = async (rawZi: string, focusAspect?: string, questionText?: string): Promise<boolean> => {
    const zi = rawZi.trim().charAt(0);
    const normalizedQuestion = (questionText ?? userQuestion).trim();
    if (!/[\u4e00-\u9fa5]/.test(zi)) {
      Alert.alert(t('common.notice', '提示'), tx('请输入一个有效的汉字', 'Please input a valid Chinese character', '請輸入一個有效的漢字'));
      return false;
    }
    if (user && !isVip) {
      try {
        const checkRes = await pointsApi.check(ziPointsCost);
        // 仅当明确 false 才拦截；避免 hasEnough 缺失或与门闸关闭时后端行为不一致导致误判
        if (checkRes.hasEnough === false) {
          setShowSmartCta(true);
          await refreshPointsBalance();
          Alert.alert(
            tx('积分不足', 'Insufficient points', '積分不足'),
            tx(`测字需要 ${ziPointsCost} 积分，请使用下方快捷入口补充权益`, `This reading needs ${ziPointsCost} points. Please use the quick actions below.`, `測字需要 ${ziPointsCost} 積分，請使用下方快捷入口補充權益`),
          );
          return false;
        }
      } catch {
        // 检查失败时仍尝试请求，由后端决定
      }
    }

    const previousResult = result;
    setIsLoading(true);
    setResult(buildPreviewResult(zi, focusAspect));
    setResultStage('preview');
    try {
      const data = await ziApi.analyze(zi, focusAspect, undefined, normalizedQuestion || undefined);
      setResult(data);
      setResultStage('full');
      trackFeature('zi_analyze_complete', { zi: data?.zi?.zi, aspect: focusAspect || null });
      setHandwritingPreview(null);
      setShowSmartCta(false);
      await refreshPointsBalance();
      return true;
    } catch (err: any) {
      console.error('测字失败:', err);
      const rawMsg = String(err?.message || '');
      const msg = localizeAuthMessage({
        rawMessage: rawMsg,
        language,
        fallback: {
          zhCN: tx('连接出现问题，请检查网络后重试', 'Network issue, please retry', '連線出現問題，請檢查網路後重試'),
          enUS: tx('连接出现问题，请检查网络后重试', 'Network issue, please retry', '連線出現問題，請檢查網路後重試'),
          zhTW: tx('连接出现问题，请检查网络后重试', 'Network issue, please retry', '連線出現問題，請檢查網路後重試'),
        },
      });
      if (/(积分不足|積分不足|insufficient points)/i.test(rawMsg || msg)) {
        setShowSmartCta(true);
        await refreshPointsBalance();
        Alert.alert(tx('积分不足', 'Insufficient points', '積分不足'), msg || tx('请使用下方快捷入口补充权益', 'Please use quick actions below to top up', '請使用下方快捷入口補充權益'));
      } else if (rawMsg.includes('请输入一个有效的汉字') || rawMsg.toLowerCase().includes('valid chinese character')) {
        Alert.alert(tx('输入无效', 'Invalid input', '輸入無效'), msg);
      } else {
        Alert.alert(
          tx('测字失败', 'Character reading failed', '測字失敗'),
          msg || tx('连接出现问题，请检查网络后重试', 'Network issue, please retry', '連線出現問題，請檢查網路後重試'),
          [
            { text: tx('知道了', 'OK', '知道了'), style: 'cancel' },
            { text: t('common.retry', '重试'), onPress: () => analyzeZiInput(rawZi, focusAspect, normalizedQuestion) },
          ]
        );
      }
      const previousZi = previousResult?.zi?.zi?.trim().charAt(0) || '';
      const shouldRestorePrevious = !!(previousResult && previousZi && previousZi === zi);
      setResultStage(shouldRestorePrevious ? 'full' : 'idle');
      setResult(shouldRestorePrevious ? previousResult : null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const prefill = (params.prefillZi || '').trim();
    if (!prefill) return;
    const zi = prefill.charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) return;
    setInputZi(zi);
    analyzeZiInput(zi).catch(() => null);
  }, [params.prefillZi]);

  React.useEffect(() => {
    const fromQuery = Array.isArray(params.userQuestion) ? params.userQuestion[0] : params.userQuestion;
    if (fromQuery?.trim()) {
      setUserQuestion(fromQuery.trim().slice(0, 120));
    }
  }, [params.userQuestion]);

  React.useEffect(() => {
    const prefill = (params.prefillZi || '').trim();
    if (prefill) return;
    let cancelled = false;
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(ziStateStorageKey);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw) as {
          inputZi?: string;
          result?: ZiResult | null;
          handwritingPreview?: { zi: string; confidence: number } | null;
          selectedAspect?: string;
          customAspect?: string;
          userQuestion?: string;
          isHandwritingMode?: boolean;
          showColdReading?: boolean;
        };
        if (parsed.inputZi) setInputZi(parsed.inputZi);
        if (parsed.result) setResult(parsed.result);
        if (parsed.handwritingPreview?.zi) setHandwritingPreview(parsed.handwritingPreview);
        if (parsed.selectedAspect) setSelectedAspect(parsed.selectedAspect);
        if (parsed.customAspect) setCustomAspect(parsed.customAspect);
        if (parsed.userQuestion) setUserQuestion(parsed.userQuestion);
        if (typeof parsed.isHandwritingMode === 'boolean') setIsHandwritingMode(parsed.isHandwritingMode);
        if (typeof parsed.showColdReading === 'boolean') setShowColdReading(parsed.showColdReading);
      } catch {
        // ignore restore failure
      }
    };
    loadState();
    return () => {
      cancelled = true;
    };
  }, [params.prefillZi, ziStateStorageKey]);

  React.useEffect(() => {
    const persistedResult = resultStage === 'preview' ? null : result;
    const payload = {
      inputZi,
      result: persistedResult,
      handwritingPreview,
      selectedAspect,
      customAspect,
      userQuestion,
      isHandwritingMode,
      showColdReading,
    };
    AsyncStorage.setItem(ziStateStorageKey, JSON.stringify(payload)).catch(() => null);
  }, [ziStateStorageKey, inputZi, result, resultStage, handwritingPreview, selectedAspect, customAspect, userQuestion, isHandwritingMode, showColdReading]);

  React.useEffect(() => {
    if (!isHandwritingMode) return;
    setRitualReady(false);
    setRitualCountdown(0);
  }, [isHandwritingMode]);

  React.useEffect(() => {
    if (ritualCountdown <= 0) return;
    const timer = setTimeout(() => {
      setRitualCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setRitualReady(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [ritualCountdown]);

  // 打字模式测字
  const handleAnalyze = async () => {
    if (!inputZi.trim()) {
      Alert.alert(t('common.notice', '提示'), tx('请输入一个汉字', 'Please input one Chinese character', '請輸入一個漢字'));
      return;
    }
    await analyzeZiInput(inputZi.trim(), getFocusAspect(), userQuestion);
  };

  // 手写模式识别并测字
  const handleHandwritingRecognize = async (svgString: string) => {
    console.log('开始手写识别，SVG长度:', svgString.length);
    // 清除上一轮解读，避免识别超时/失败时界面仍显示上一字（如「测」）
    setResult(null);
    setHandwritingPreview(null);
    setIsLoading(true);
    setHandwritingStage('recognizing');
    try {
      console.log('调用 handwritingApi.recognize...');
      const recognized = await handwritingApi.recognize(svgString);
      const recognizedZi = recognized.recognizedZi?.trim().charAt(0);
      if (!recognizedZi || !/[\u4e00-\u9fa5]/.test(recognizedZi)) {
        setResult(null);
        setHandwritingPreview(null);
        Alert.alert(tx('😔 识别失败', '😔 Recognition Failed', '😔 識別失敗'), tx('未能识别出汉字，请重新书写', 'Could not recognize a valid Chinese character, please retry.', '未能識別出漢字，請重新書寫'));
        return;
      }
      const conf = typeof recognized.confidence === 'number' ? recognized.confidence : 0.9;
      setHandwritingPreview({ zi: recognizedZi, confidence: conf });
      setInputZi(recognizedZi);
      setHandwritingStage('analyzing');
      const ok = await analyzeZiInput(recognizedZi, getFocusAspect(), userQuestion);
      if (ok)
        Alert.alert(
          tx('🎉 识别成功', '🎉 Recognized', '🎉 識別成功'),
          tx(`识别到汉字：${recognizedZi}\n\n当前已完成首轮解读，你可以继续做方向深挖。`, `Recognized: ${recognizedZi}\n\nFirst-pass reading is ready. You can continue with deeper focus.`, `識別到漢字：${recognizedZi}\n\n目前已完成首輪解讀，你可以繼續做方向深挖。`),
        );
    } catch (error: any) {
      console.error('手写识别失败:', error);
      setResult(null);
      setHandwritingPreview(null);
      Alert.alert(t('common.error', '错误'), error?.message || tx('手写识别失败，请稍后重试', 'Handwriting recognition failed, please retry later.', '手寫識別失敗，請稍後重試'));
    } finally {
      setHandwritingStage('idle');
      setIsLoading(false);
    }
  };

  const startRitualCountdown = () => {
    if (isLoading) return;
    setRitualReady(false);
    setRitualCountdown(3);
  };

  const skipRitual = () => {
    setRitualCountdown(0);
    setRitualReady(true);
  };

  const getWuxingColor = (wuxing: string) => {
    const colors: Record<string, string> = {
      木: '#4CAF50',
      火: '#F44336',
      土: '#8D6E63',
      金: '#FFC107',
      水: '#2196F3',
    };
    return colors[wuxing] || '#999';
  };

  const getJixiongColor = (jixiong: string) => {
    return jixiong === '吉' ? '#4CAF50' : jixiong === '凶' ? '#F44336' : '#FF9800';
  };

  const parseGuaDetail = (text?: string) => {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return {
        core: tx('卦义主线：当前卦象偏中性，先稳态观察。', 'Core pattern: current hexagram is neutral; stabilize first.', '卦義主線：當前卦象偏中性，先穩態觀察。'),
        reminder: tx('当下提醒：先把关键变量看清，再决定推进节奏。', 'Reminder: clarify key variables before deciding pace.', '當下提醒：先把關鍵變量看清，再決定推進節奏。'),
        action: tx('可执行动作：先做一件最小可执行动作，24小时内验证反馈。', 'Action: do one smallest executable step and validate within 24h.', '可執行動作：先做一件最小可執行動作，24小時內驗證反饋。'),
      };
    }
    const parts = normalized
      .split(/[。！？]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const core = parts[0] || normalized;
    const reminder =
      parts.find((item) => /当前|宜|忌|建议|窗口|风险|收敛|推进/.test(item)) ||
      parts[1] ||
      tx('先稳住节奏，再看外部反馈。', 'Stabilize pace first, then observe external feedback.', '先穩住節奏，再看外部反饋。');
    const action =
      parts.find((item) => /先|再|可以|适合|行动|执行|步骤|复盘/.test(item)) ||
      parts[2] ||
      tx('先做一件最小可执行动作，并在48小时内复盘。', 'Do one smallest executable action and review within 48h.', '先做一件最小可執行動作，並在48小時內復盤。');
    return {
      core: `${tx('卦义主线：', 'Core pattern: ', '卦義主線：')}${core}`,
      reminder: `${tx('当下提醒：', 'Reminder: ', '當下提醒：')}${reminder}`,
      action: `${tx('可执行动作：', 'Action: ', '可執行動作：')}${action}`,
    };
  };

  const handleFocusedReanalyze = async () => {
    const zi = (result?.zi?.zi || inputZi || '').trim().charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) {
      Alert.alert(t('common.notice', '提示'), tx('请先识别或输入一个字', 'Please recognize or input one character first', '請先識別或輸入一個字'));
      return;
    }
    const focus = getFocusAspect();
    if (!focus) {
      Alert.alert(t('common.notice', '提示'), tx('请先选择一个解读方向', 'Please select a reading direction first', '請先選擇一個解讀方向'));
      return;
    }
    await analyzeZiInput(zi, focus, userQuestion);
  };

  const goChatWithZiCooldown = () => {
    const cooldownUntil = Date.now() + 15 * 60 * 1000;
    router.push({
      pathname: '/',
      params: { skipZiNudgeUntil: String(cooldownUntil) },
    });
  };

  const goProbingChat = () => {
    if (!result) return;
    const focus = getFocusAspect() || result.interpretation.focusReading?.focus || tx('综合', 'General', '綜合');
    const probing = result.zi.probingQuestion || tx(`围绕「${focus}」，你最想先解决哪一步？`, `For "${focus}", which step do you want to solve first?`, `圍繞「${focus}」，你最想先解決哪一步？`);
    const aiMessage: ChatMessage = {
      id: `ai_probe_${Date.now()}`,
      role: 'assistant',
      content: tx(`我们围绕「${focus}」继续深聊。\n${probing}`, `Let's continue around "${focus}".\n${probing}`, `我們圍繞「${focus}」繼續深聊。\n${probing}`),
      timestamp: new Date(),
    };
    goChatWithZiCooldown();
    setTimeout(() => {
      useChatStore.setState((state) => ({
        messages: [...state.messages, aiMessage],
      }));
    }, 450);
  };
  const goActionPlanChat = () => {
    if (!result?.interpretation.focusReading) return;
    const focus = result.interpretation.focusReading.focus;
    const action = result.interpretation.focusReading.actionPlan[0] || tx('先从一件最小动作开始。', 'Start with one smallest action.', '先從一件最小動作開始。');
    const aiMessage: ChatMessage = {
      id: `ai_action_${Date.now()}`,
      role: 'assistant',
      content: tx(
        `我们围绕「${focus}」把行动计划落地。\n第一步建议：${action}\n你做完这一步后告诉我，我继续给你下一步。`,
        `Let's execute the plan for "${focus}".\nStep 1: ${action}\nTell me after you finish it and I will give the next step.`,
        `我們圍繞「${focus}」把行動計畫落地。\n第一步建議：${action}\n你做完這一步後告訴我，我繼續給你下一步。`,
      ),
      timestamp: new Date(),
    };
    goChatWithZiCooldown();
    setTimeout(() => {
      useChatStore.setState((state) => ({
        messages: [...state.messages, aiMessage],
      }));
    }, 450);
  };
  const guaDetail = parseGuaDetail(result?.zi?.guaXiang);
  const isPreviewStage = resultStage === 'preview';
  const handwritingProgress = handwritingStage === 'recognizing' ? 42 : handwritingStage === 'analyzing' ? 86 : 0;
  const handwritingProgressText =
    handwritingStage === 'recognizing'
      ? tx('识别中（1/2）', 'Recognizing (1/2)', '識別中（1/2）')
      : handwritingStage === 'analyzing'
      ? tx('解读中（2/2）', 'Reading (2/2)', '解讀中（2/2）')
      : '';
  const ritualBreathHint =
    ritualCountdown <= 0
      ? tx('准备好了就落笔。', 'Write when you are ready.', '準備好了就落筆。')
      : ritualCountdown >= 2
      ? tx(`吸气... ${ritualCountdown}`, `Inhale... ${ritualCountdown}`, `吸氣... ${ritualCountdown}`)
      : tx('呼气... 1', 'Exhale... 1', '呼氣... 1');
  
  // 点击继续聊聊，AI自动发送一个问题，等待用户回答
  const handleFollowUpQuestion = async (_question: string) => {
    const zi = result?.zi?.zi || '';
    const followUpQuestions = [
      tx(`你写的"${zi}"字，中间的部分你想表达什么？`, `In "${zi}", what does the middle part express for you?`, `你寫的"${zi}"字，中間的部分你想表達什麼？`),
      tx(`对于"${zi}"这个字，你首先想到的是什么？`, `When you see "${zi}", what comes to mind first?`, `對於"${zi}"這個字，你首先想到的是什麼？`),
      tx(`为什么选择写"${zi}"这个字？有什么特别的意义吗？`, `Why did you choose "${zi}"? Does it carry a special meaning?`, `為什麼選擇寫"${zi}"這個字？有什麼特別的意義嗎？`),
      tx(`写"${zi}"字的时候，你的心情是怎样的？`, `How did you feel when writing "${zi}"?`, `寫"${zi}"字的時候，你的心情是怎樣的？`),
      tx(`如果让你用"${zi}"字来形容最近的生活，你会怎么解释？`, `If "${zi}" describes your recent life, how would you explain it?`, `如果讓你用"${zi}"字來形容最近的生活，你會怎麼解釋？`),
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    
    // 跳转到聊天界面
    goChatWithZiCooldown();
    
    // 直接添加AI消息（不是用户消息）
    setTimeout(() => {
      // 模拟AI发送问题
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: randomQuestion,
        timestamp: new Date(),
      };
      // 添加到聊天记录
      useChatStore.setState((state) => ({ 
        messages: [...state.messages, aiMessage] 
      }));
    }, 500);
  };
  
  // 打字模式测字完成后自动发送后续问题
  const autoSendFollowUpQuestion = async (zi: string) => {
    const followUpQuestions = [
      tx(`你写的"${zi}"字，中间的部分你想表达什么？`, `In "${zi}", what does the middle part express for you?`, `你寫的"${zi}"字，中間的部分你想表達什麼？`),
      tx(`对于"${zi}"这个字，你首先想到的是什么？`, `When you see "${zi}", what comes to mind first?`, `對於"${zi}"這個字，你首先想到的是什麼？`),
      tx(`为什么选择写"${zi}"这个字？有什么特别的意义吗？`, `Why did you choose "${zi}"? Does it carry a special meaning?`, `為什麼選擇寫"${zi}"這個字？有什麼特別的意義嗎？`),
      tx(`写"${zi}"字的时候，你的心情是怎样的？`, `How did you feel when writing "${zi}"?`, `寫"${zi}"字的時候，你的心情是怎樣的？`),
      tx(`如果让你用"${zi}"字来形容最近的生活，你会怎么解释？`, `If "${zi}" describes your recent life, how would you explain it?`, `如果讓你用"${zi}"字來形容最近的生活，你會怎麼解釋？`),
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    
    // 跳转到聊天界面并发送问题
    goChatWithZiCooldown();
    
    setTimeout(() => {
      // 模拟AI发送问题
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: randomQuestion,
        timestamp: new Date(),
      };
      // 添加到聊天记录
      useChatStore.setState((state) => ({ 
        messages: [...state.messages, aiMessage] 
      }));
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: wuxingTheme.bg }]}>
      <View pointerEvents="none" style={[styles.wuxingAura, { backgroundColor: wuxingTheme.glow }]} />
      <View style={styles.header}>
        <Text style={styles.title}>{tx('🔮 测字问心', '🔮 Character Insight', '🔮 測字問心')}</Text>
        <Text style={styles.subtitle}>{tx('字是心画，写一字可窥心', 'A single character mirrors your inner state', '字是心畫，寫一字可窺心')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 输入模式切换 - 精简置顶 */}
        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isHandwritingMode && styles.modeButtonActive,
            ]}
            onPress={() => setIsHandwritingMode(false)}
          >
            <Text style={[
              styles.modeButtonText,
              !isHandwritingMode && styles.modeButtonTextActive,
            ]}>
              {tx('⌨️ 打字输入', '⌨️ Type Input', '⌨️ 打字輸入')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              isHandwritingMode && styles.modeButtonActive,
            ]}
            onPress={() => setIsHandwritingMode(true)}
          >
            <Text style={[
              styles.modeButtonText,
              isHandwritingMode && styles.modeButtonTextActive,
            ]}>
              {tx('✍️ 手写输入', '✍️ Handwriting', '✍️ 手寫輸入')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入区域 - 书写框优先展示 */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {isHandwritingMode ? tx('请在手写板写字', 'Write a character on board', '請在手寫板寫字') : tx('请写一字', 'Write one character', '請寫一字')}
          </Text>
          <Text style={styles.hint}>
            {isHandwritingMode 
              ? tx('在下方手写板上写下你想测的汉字', 'Write the character you want to read below', '在下方手寫板寫下你想測的漢字')
              : tx('根据《测字有术》，字如其人。心有所想，字有所现。', 'A character reveals your present focus and rhythm.', '根據《測字有術》，字如其人。心有所想，字有所現。')}
          </Text>
          <View style={styles.billingPreviewBar}>
            <Text style={styles.billingPreviewText}>
              {t('reading.form.billingPreview', '本次将扣：{cost} 积分{memberFree} · 当前余额：{balance}')
                .replace('{cost}', String(displayZiCost))
                .replace('{memberFree}', isVip ? t('reading.form.memberFreeSuffix', '（会员免扣）') : '')
                .replace('{balance}', String(availablePoints ?? '--'))}
            </Text>
          </View>
          {!!membershipExpiredHint && <Text style={styles.membershipExpiredHint}>{membershipExpiredHint}</Text>}
          {showSmartCta && !isVip && (
            <View style={styles.smartCtaWrap}>
              <Text style={styles.smartCtaTitle}>{tx('余额不足，建议优先补充权益', 'Low balance, top up first', '餘額不足，建議優先補充權益')}</Text>
                <Text style={styles.smartCtaHint}>
                  {tx(
                    `按每周约 5 次测算，测字本月约需 ${projectedMonthlyPoints} 积分（约 ${projectedCheckinDays} 天签到）。`,
                    `At about 5 readings/week, this month needs around ${projectedMonthlyPoints} points (about ${projectedCheckinDays} check-in days).`,
                    `按每週約 5 次測算，測字本月約需 ${projectedMonthlyPoints} 積分（約 ${projectedCheckinDays} 天簽到）。`,
                  )}
                </Text>
              <View style={styles.smartCtaActions}>
                <TouchableOpacity style={styles.smartCtaPrimary} onPress={goPointsMall}>
                  <Text style={styles.smartCtaPrimaryText}>{tx('去充值积分', 'Top up points', '去儲值積分')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smartCtaSecondary} onPress={goVipPlan}>
                  <Text style={styles.smartCtaSecondaryText}>{tx('开会员更划算', 'Upgrade membership', '開會員更划算')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {isHandwritingMode ? (
            // 手写模式 - 书写框在上，静心提示在下
            <View style={styles.handwritingSection}>
              <View
                style={styles.handwritingCanvasWrap}
              >
                <HandwritingCanvas 
                  onRecognize={handleHandwritingRecognize}
                  isRecognizing={isLoading}
                  wuxing={result?.zi?.wuxing}
                />
              </View>
              {/* 静心提示 - 放在书写框下方 */}
              {!ritualReady && (
                <View style={styles.ritualCountdownCard}>
                  <Text style={styles.ritualCountdownTitle}>{tx('🫧 写字前先静心', '🫧 Center yourself first', '🫧 寫字前先靜心')}</Text>
                  <Text style={styles.ritualCountdownText}>
                    {tx(
                      '把注意力放在你此刻最想问的一件事上，再落笔，解读会更聚焦。你也可以直接写，不受限制。',
                      'Focus on one question first, then write. This makes the reading more accurate.',
                      '把注意力放在你此刻最想問的一件事上，再落筆，解讀會更聚焦。你也可以直接寫，不受限制。',
                    )}
                  </Text>
                  {ritualCountdown > 0 && (
                    <Text style={styles.ritualBreathHint}>{ritualBreathHint}</Text>
                  )}
                  <View style={styles.ritualCountdownActions}>
                    <TouchableOpacity
                      style={[
                        styles.ritualCountdownPrimary,
                        ritualCountdown > 0 && styles.ritualCountdownPrimaryDisabled,
                      ]}
                      onPress={startRitualCountdown}
                      disabled={ritualCountdown > 0}
                    >
                      <Text style={styles.ritualCountdownPrimaryText}>
                        {ritualCountdown > 0 ? tx(`静心中 ${ritualCountdown}s`, `Centering ${ritualCountdown}s`, `靜心中 ${ritualCountdown}s`) : tx('开始3秒静心', 'Start 3s centering', '開始3秒靜心')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ritualCountdownSecondary} onPress={skipRitual}>
                      <Text style={styles.ritualCountdownSecondaryText}>{tx('跳过，直接写字', 'Skip and write now', '跳過，直接寫字')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {handwritingStage !== 'idle' && (
                <View style={styles.progressWrap}>
                  <Text style={styles.progressText}>{handwritingProgressText}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${handwritingProgress}%` }]} />
                  </View>
                </View>
              )}
              {handwritingPreview && !result && (
                <View style={styles.handwritingPreviewCard}>
                  <Text style={styles.handwritingPreviewLabel}>{tx('识别结果', 'Recognition', '識別結果')}</Text>
                  <Text style={styles.handwritingPreviewZi}>「{handwritingPreview.zi}」</Text>
                  <Text style={styles.handwritingPreviewMeta}>
                    {tx('置信度约', 'Confidence', '置信度約')} {Math.round(Math.min(1, Math.max(0, handwritingPreview.confidence)) * 100)}%
                  </Text>
                  <Text style={styles.handwritingPreviewHint}>
                    {tx(
                      `下方「深度解读」需消耗积分（当前 ${ziPointsCost} 积分/次）。若刚才提示积分不足，请先签到或前往「灵石」获取积分，再点按钮重试。`,
                      `The deep reading below costs points (currently ${ziPointsCost} points/time). If you saw low balance, check in or get points first, then retry.`,
                      `下方「深度解讀」需消耗積分（目前 ${ziPointsCost} 積分/次）。若剛才提示積分不足，請先簽到或前往「靈石」取得積分，再點按鈕重試。`,
                    )}
                  </Text>
                  <TouchableOpacity
                    style={[styles.handwritingPreviewBtn, isLoading && styles.handwritingPreviewBtnDisabled]}
                    onPress={() => analyzeZiInput(handwritingPreview.zi, getFocusAspect())}
                    disabled={isLoading}
                  >
                    <Text style={styles.handwritingPreviewBtnText}>
                      {isLoading ? tx('解读中…', 'Reading...', '解讀中…') : tx('生成深度解读', 'Generate Deep Reading', '生成深度解讀')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            // 打字模式
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputZi}
                onChangeText={setInputZi}
                placeholder={tx('输入一个汉字', 'Type one Chinese character', '輸入一個漢字')}
                placeholderTextColor="#999"
                maxLength={1}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.dark.tint }]}
                onPress={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{tx('开始测字', 'Start Reading', '開始測字')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {isLoading ? (
            <Text style={styles.loadingHint}>
              {tx(
                'AI 深度解读约需 30 秒～2 分钟，请保持网络畅通、勿关闭页面',
                'Deep reading usually takes 30s-2min. Keep network stable and stay on this page.',
                'AI 深度解讀約需 30 秒～2 分鐘，請保持網路暢通、勿關閉頁面',
              )}
            </Text>
          ) : null}
        </View>

        {/* 结果展示 */}
        {result && (
          <>
            {isPreviewStage && (
              <View style={styles.previewBanner}>
                <Text style={styles.previewBannerText}>{tx('已为你先展示首轮结果，深度解读正在补全中…', 'First-pass result is ready. Deep reading is still completing…', '已先為你展示首輪結果，深度解讀正在補全中…')}</Text>
              </View>
            )}
            <View style={styles.tierCard}>
              <Text style={styles.tierTitle}>{tx('当前解读档位：', 'Current tier: ', '當前解讀檔位：')}{ziTierLabel}</Text>
              <Text style={styles.tierDesc}>{ziTierDesc}</Text>
              {!isVip && (
                <TouchableOpacity
                  style={styles.tierUpgradeBtn}
                  onPress={() => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } })}
                >
                  <Text style={styles.tierUpgradeBtnText}>{tx('立即解锁当前结果（老师傅深度版）', 'Unlock current result now (Deep Master tier)', '立即解鎖當前結果（老師傅深度版）')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* 冷读话术 - 首先展示 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.collapseHeader, { backgroundColor: theme.dark.card }]}
                onPress={() => setShowColdReading(!showColdReading)}
              >
                <Text style={styles.collapseTitle}>{tx('💫 AI直觉解读', '💫 AI Intuitive Reading', '💫 AI直覺解讀')}</Text>
                <Text style={styles.collapseIcon}>{showColdReading ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              
              {showColdReading && (
                <View style={[styles.collapseContent, { backgroundColor: theme.dark.card }]}>
                  {result.coldReadings.map((reading, index) => (
                    <Text key={index} style={styles.coldReadingText}>
                      {normalizeZiText(reading)}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* 汉字解析 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('📦 字形拆解', '📦 Character Structure', '📦 字形拆解')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.ziDisplay}>
                  <Text style={styles.ziText}>{result.zi.zi}</Text>
                </View>
                
                <View style={styles.ziInfo}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>{tx('笔画', 'Strokes', '筆畫')}</Text>
                      <Text style={styles.infoValue}>{isPreviewStage ? tx('解析中', 'Analyzing', '解析中') : `${result.zi.bihua} ${tx('画', 'strokes', '畫')}`}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>{tx('部首', 'Radical', '部首')}</Text>
                      <Text style={styles.infoValue}>{normalizeZiText(result.zi.bushou)}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>{tx('五行', 'Element', '五行')}</Text>
                      <Text style={[styles.infoValue, { color: getWuxingColor(result.zi.wuxing) }]}>
                        {isPreviewStage ? tx('待定', 'Pending', '待定') : normalizeZiText(result.zi.wuxing)}
                      </Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>{tx('阴阳', 'Yin-Yang', '陰陽')}</Text>
                      <Text style={styles.infoValue}>{isPreviewStage ? tx('待定', 'Pending', '待定') : normalizeZiText(result.zi.yinyang)}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>{tx('吉凶', 'Auspice', '吉凶')}</Text>
                      <Text style={[styles.infoValue, { color: getJixiongColor(result.zi.jixiong) }]}>
                        {isPreviewStage ? tx('待定', 'Pending', '待定') : normalizeZiText(result.zi.jixiong)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ziMetaSource}>
                  {tx(
                    '数据来源：笔画/部首-汉典；五行-部首五行归属；阴阳-笔画奇偶；吉凶-字义传统分类',
                    'Data source: Han dictionary strokes/radicals, element mapping, yin-yang parity, and traditional semantics.',
                    '資料來源：筆畫/部首-漢典；五行-部首五行歸屬；陰陽-筆畫奇偶；吉凶-字義傳統分類',
                  )}
                </Text>
              </View>
            </View>

            {/* 我想测哪方面 - 放在识别结果下面 */}
            <View style={styles.aspectSection}>
              <Text style={styles.aspectTitle}>{tx('💭 我想测：', '💭 Focus on:', '💭 我想測：')}</Text>
              <View style={styles.aspectTags}>
                {aspectOptions.map((aspect) => (
                  <TouchableOpacity
                    key={aspect}
                    style={[
                      styles.aspectTag,
                      selectedAspect === aspect && styles.aspectTagSelected
                    ]}
                    onPress={() => toggleAspect(aspect)}
                  >
                    <Text style={[
                      styles.aspectTagText,
                      selectedAspect === aspect && styles.aspectTagTextSelected
                    ]}>
                      {aspectOptionLabels[aspect] || (language === 'zh-TW' ? normalizeZiText(aspect) : aspect)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.customAspectInput}
                value={customAspect}
                onChangeText={setCustomAspect}
                placeholder={tx('或输入其他方面...', 'Or enter another focus...', '或輸入其他方面...')}
                placeholderTextColor="#666"
              />
              <TextInput
                style={styles.customAspectInput}
                value={userQuestion}
                onChangeText={setUserQuestion}
                placeholder={tx('可选：你现在最想问的具体问题（如：我要不要离职）', 'Optional: your most specific question now', '可選：你現在最想問的具體問題')}
                placeholderTextColor="#666"
                maxLength={120}
              />
              <View style={styles.refineInlineWrap}>
                <Text style={styles.refineInlineHint}>
                  {tx('已识别', 'Recognized ', '已識別')}「{result.zi.zi}」，{tx('选择方向后可重解读', 'choose a focus to re-read', '選擇方向後可重解讀')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.refineInlineBtn,
                    (!result || isLoading) && styles.refineInlineBtnDisabled,
                  ]}
                  onPress={handleFocusedReanalyze}
                  disabled={!result || isLoading}
                >
                  <Text style={styles.refineInlineBtnText}>
                    {isLoading
                      ? (result?.interpretation.focusReading ? tx('重解读中...', 'Re-reading...', '重解讀中...') : tx('解读中...', 'Reading...', '解讀中...'))
                      : tx('按方向重解读', 'Re-read by focus', '按方向重解讀')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 部件拆解 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('🧩 部件拆解', '🧩 Component Breakdown', '🧩 部件拆解')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.componentsRow}>
                  {result.zi.components.map((comp, index) => (
                    <View key={index} style={styles.componentBox}>
                      <Text style={styles.componentText}>{comp}</Text>
                      <Text style={styles.componentMeaning}>
                        {normalizeZiText(result.zi.componentMeanings[index])}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.associativeText}>
                  💡 {normalizeZiText(result.zi.associativeMeaning)}
                </Text>
              </View>
            </View>

            {/* 甲骨文象形：紧接部件，图片置顶便于第一眼看到字形 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('🪨 甲骨文·字形示意', '🪨 Oracle Script · Glyph Reference', '🪨 甲骨文·字形示意')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                {!!result.zi.oracleBone?.imageUrls?.length && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.oracleImageRow}
                  >
                    {result.zi.oracleBone.imageUrls.map((url, idx) => (
                      <View key={`${url}_${idx}`} style={styles.oracleImageBox}>
                        <OracleGlyphImage uri={url} ziChar={result.zi.zi} style={styles.oracleImage} />
                      </View>
                    ))}
                  </ScrollView>
                )}
                {!result.zi.oracleBone?.imageUrls?.length && (
                  <View style={styles.oracleEmptyHint}>
                    <Text style={styles.oracleEmptyHintText}>
                      {tx(
                        `字表暂未收录「${result.zi.zi}」独体甲骨图，已用部件检索或文字说明辅助；常见字会逐渐补全。`,
                        `No standalone oracle glyph found for "${result.zi.zi}" yet. Using component hints and text explanation for now.`,
                        `字表暫未收錄「${result.zi.zi}」獨體甲骨圖，已用部件檢索或文字說明輔助；常見字會逐漸補全。`,
                      )}
                    </Text>
                  </View>
                )}
                <Text style={styles.oracleInterpretLead}>
                  {normalizeZiText(result.zi.oracleBone?.interpretation) || tx('暂以部件与意象做辅助解读。', 'Using components and imagery as auxiliary reading for now.', '暫以部件與意象做輔助解讀。')}
                </Text>
                <Text style={styles.oracleTip}>
                  {normalizeZiText(result.zi.oracleBone?.note) || tx('说明：甲骨字形来源为开源字表，仅作文化示意，非书法范本。', 'Note: oracle glyphs come from open-source lexicons and are for cultural reference only.', '說明：甲骨字形來源為開源字表，僅作文化示意，非書法範本。')}
                </Text>
                {!!result.zi.oracleBone?.totalImages && (
                  <Text style={styles.oracleCounter}>
                    {tx('已展示', 'Shown', '已展示')} {result.zi.oracleBone.shownImages}/{result.zi.oracleBone.totalImages} {tx('张字形样本', 'glyph samples', '張字形樣本')}
                  </Text>
                )}
                {shouldShowOracleUnlock && (
                  <>
                    <Text style={styles.oracleRemainText}>{tx('还差', 'Still ', '還差')} {lockedImageCount} {tx('张未解锁', 'locked', '張未解鎖')}</Text>
                    <Animated.View style={oracleUnlockAnimStyle}>
                      <TouchableOpacity
                        style={styles.oracleUnlockBtn}
                        onPress={() => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } })}
                      >
                        <Text style={styles.oracleUnlockText}>{tx('查看完整异体图与差异解读', 'View all variants and differences', '查看完整異體圖與差異解讀')}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                )}
                <Text style={styles.oracleSource}>
                  {tx('图源：', 'Source: ', '圖源：')}{normalizeZiText(result.zi.oracleBone?.source || 'JiaGuWen 开源字表')}
                </Text>
              </View>
            </View>

            {!isPreviewStage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{tx('🧠 技法细化（离合 / 填字 / 投射）', '🧠 Technique Refinement (Split / Grid / Projection)', '🧠 技法細化（離合 / 填字 / 投射）')}</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  <View style={styles.skillGroup}>
                    <Text style={styles.skillHead}>{tx('离合法', 'Split-Combine', '離合法')}</Text>
                    <Text style={styles.skillHint}>{tx('把字拆开看意象，再合起来看整体', 'Split the character for imagery, then combine for whole-pattern reading.', '把字拆開看意象，再合起來看整體')}</Text>
                    {(result.zi.lihefa || []).map((line, index) => (
                      <Text key={`lihefa_${index}`} style={styles.skillText}>
                        {normalizeZiText(line)}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.skillDivider} />
                  <View style={styles.skillGroup}>
                    <Text style={styles.skillHead}>{tx('填字格', 'Grid Mapping', '填字格')}</Text>
                    <Text style={styles.skillHint}>{tx('中心 / 边界 / 落点，对应你心里最在意的位置', 'Center / boundary / landing point mirror your current concerns.', '中心 / 邊界 / 落點，對應你心裡最在意的位置')}</Text>
                    {(result.zi.tianziGe || []).map((line, index) => (
                      <Text key={`tianzi_${index}`} style={styles.skillText}>
                        {normalizeZiText(line)}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.skillDivider} />
                  <View style={styles.skillGroup}>
                    <Text style={styles.skillHead}>{tx('象形投射', 'Imagery Projection', '象形投射')}</Text>
                    <Text style={styles.skillTextBlock}>{normalizeZiText(result.zi.imageryInference) || tx('当前暂无象形投射结果。', 'No imagery projection result yet.', '目前暫無象形投射結果。')}</Text>
                  </View>
                  <View style={styles.skillDivider} />
                  <View style={styles.skillGroup}>
                    <Text style={styles.skillHead}>{tx('反问引导', 'Reflective Prompt', '反問引導')}</Text>
                    <Text style={styles.skillTextEmphasis}>{normalizeZiText(result.zi.probingQuestion) || tx('这个字里你最在意哪一部分？', 'Which part of this character matters to you most?', '這個字裡你最在意哪一部分？')}</Text>
                  </View>
                  <TouchableOpacity style={styles.probingChatBtn} onPress={goProbingChat}>
                    <Text style={styles.probingChatText}>{tx('💬 去对话里深聊这个反问', '💬 Discuss this reflective prompt in chat', '💬 去對話裡深聊這個反問')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {result.interpretation.focusReading && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{tx('🧭 方向详解 · ', '🧭 Focus Deep Dive · ', '🧭 方向詳解 · ')}{normalizeZiText(result.interpretation.focusReading.focus)}</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  <View style={styles.focusSummaryBox}>
                    <Text style={styles.focusSummaryLabel}>{tx('核心结论', 'Core Conclusion', '核心結論')}</Text>
                    <Text style={styles.focusSummary}>{normalizeZiText(result.interpretation.focusReading.summary)}</Text>
                  </View>
                  <Text style={styles.focusSubhead}>{tx('关键锚点', 'Key Anchors', '關鍵錨點')}</Text>
                  {result.interpretation.focusReading.anchors.map((item, idx) => (
                    <View key={`anchor_${idx}`} style={styles.focusBulletRow}>
                      <Text style={styles.focusBulletDot}>●</Text>
                      <Text style={styles.focusItem}>{normalizeZiText(item)}</Text>
                    </View>
                  ))}
                  <Text style={styles.focusSubhead}>{tx('风险信号', 'Risk Signals', '風險信號')}</Text>
                  {result.interpretation.focusReading.riskSignals.map((item, idx) => (
                    <View key={`risk_${idx}`} style={styles.focusBulletRow}>
                      <Text style={styles.focusBulletDotWarn}>!</Text>
                      <Text style={styles.focusItem}>{normalizeZiText(item)}</Text>
                    </View>
                  ))}
                  <Text style={styles.focusSubhead}>{tx('行动计划', 'Action Plan', '行動計畫')}</Text>
                  {result.interpretation.focusReading.actionPlan.map((item, idx) => (
                    <View key={`plan_${idx}`} style={styles.focusBulletRow}>
                      <Text style={styles.focusBulletNum}>{idx + 1}</Text>
                      <Text style={styles.focusItem}>{normalizeZiText(item)}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.focusChatBtn} onPress={goActionPlanChat}>
                    <Text style={styles.focusChatBtnText}>{tx('💬 去对话里执行行动计划', '💬 Execute action plan in chat', '💬 去對話裡執行行動計畫')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {!!result.interpretation.premiumHint && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.premiumHintCard}
                  onPress={() => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } })}
                >
                  <Text style={styles.premiumHintText}>🔓 {normalizeZiText(result.interpretation.premiumHint)}</Text>
                  <Text style={styles.premiumHintLink}>{tx('点击升级，本次解读立即升级为老师傅深度版', 'Upgrade now to unlock deep master reading immediately', '點擊升級，本次解讀立即升級為老師傅深度版')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 易经对应 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('📜 易经对应', '📜 I Ching Mapping', '📜 易經對應')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.yijingRow}>
                  <View style={styles.yijingBox}>
                    <Text style={styles.yijingLabel}>{tx('卦象', 'Hexagram', '卦象')}</Text>
                    <Text style={styles.yijingValue}>{normalizeZiText(result.zi.yijing)}</Text>
                  </View>
                  <View style={styles.yijingBox}>
                    <Text style={styles.yijingLabel}>{tx('五行', 'Element', '五行')}</Text>
                    <Text style={[styles.yijingValue, { color: getWuxingColor(result.zi.wuxing) }]}>
                      {normalizeZiText(result.zi.wuxing)}
                    </Text>
                  </View>
                </View>
                <View style={styles.guaDetailWrap}>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>🧭</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.core}</Text>
                  </View>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>⚠️</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.reminder}</Text>
                  </View>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>✅</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.action}</Text>
                  </View>
                </View>
              </View>
            </View>

            {!isPreviewStage && (
              <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('✍️ 笔迹心理学', '✍️ Handwriting Psychology', '✍️ 筆跡心理學')}</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  <View style={styles.handwritingItem}>
                    <Text style={styles.handwritingLabel}>{tx('力度', 'Pressure', '力度')}</Text>
                    <Text style={styles.handwritingValue}>
                      {result.handwriting.pressure === 'heavy'
                        ? tx('较重', 'Heavy', '較重')
                        : result.handwriting.pressure === 'light'
                        ? tx('较轻', 'Light', '較輕')
                        : tx('适中', 'Balanced', '適中')}
                    </Text>
                  </View>
                  <Text style={styles.handwritingInterpretation}>
                    {normalizeZiText(result.handwriting.pressureInterpretation)}
                  </Text>

                  <View style={styles.handwritingItem}>
                    <Text style={styles.handwritingLabel}>{tx('稳定性', 'Stability', '穩定性')}</Text>
                    <Text style={styles.handwritingValue}>
                      {result.handwriting.stability === 'stable'
                        ? tx('稳定', 'Stable', '穩定')
                        : result.handwriting.stability === 'shaky'
                        ? tx('波动', 'Shaky', '波動')
                        : tx('一般', 'Average', '一般')}
                    </Text>
                  </View>
                  <Text style={styles.handwritingInterpretation}>
                    {normalizeZiText(result.handwriting.stabilityInterpretation)}
                  </Text>

                  <View style={styles.handwritingItem}>
                    <Text style={styles.handwritingLabel}>{tx('结构', 'Structure', '結構')}</Text>
                    <Text style={styles.handwritingValue}>
                      {result.handwriting.structure === 'compact'
                        ? tx('紧凑', 'Compact', '緊湊')
                        : result.handwriting.structure === 'loose'
                        ? tx('松散', 'Loose', '鬆散')
                        : tx('均衡', 'Balanced', '均衡')}
                    </Text>
                  </View>
                  <Text style={styles.handwritingInterpretation}>
                    {normalizeZiText(result.handwriting.structureInterpretation)}
                  </Text>
                </View>
              </View>
            )}

            {!isPreviewStage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{tx('👤 性格画像', '👤 Personality Profile', '👤 性格畫像')}</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  <View style={styles.traitsRow}>
                    {result.handwriting.personalityInsights.map((trait, index) => (
                      <View key={index} style={[styles.traitTag, { backgroundColor: '#FFD700' }]}>
                        <Text style={[styles.traitText, { color: '#1a1a2e' }]}>{normalizeZiText(trait)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* 运势解读 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('🌟 运势解读', '🌟 Fortune Reading', '🌟 運勢解讀')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>{tx('💼 事业', '💼 Career', '💼 事業')}</Text>
                  <Text style={styles.fortuneText}>{normalizeZiText(result.interpretation.career)}</Text>
                </View>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>{tx('💕 感情', '💕 Love', '💕 感情')}</Text>
                  <Text style={styles.fortuneText}>{normalizeZiText(result.interpretation.love)}</Text>
                </View>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>{tx('💰 财运', '💰 Wealth', '💰 財運')}</Text>
                  <Text style={styles.fortuneText}>{normalizeZiText(result.interpretation.wealth)}</Text>
                </View>
                <View style={[styles.fortuneItem, styles.fortuneItemLast]}>
                  <Text style={styles.fortuneLabel}>{tx('🏥 健康', '🏥 Health', '🏥 健康')}</Text>
                  <Text style={styles.fortuneText}>{normalizeZiText(result.interpretation.health)}</Text>
                </View>
              </View>
            </View>

            {/* 建议 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tx('💡 建议', '💡 Suggestions', '💡 建議')}</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                {result.interpretation.advice.map((advice, index) => (
                  <Text key={index} style={styles.adviceText}>
                    {index + 1}. {normalizeZiText(advice)}
                  </Text>
                ))}
              </View>
            </View>

            {!isPreviewStage && (
              <ResultShareCard
                kind="zi"
                headline={`「${result.zi.zi}」${getFocusAspect() ? ` · ${getFocusAspect()}` : ''}`}
                summary={
                  result.interpretation.focusReading?.summary ||
                  result.coldReadings?.[0] ||
                  result.interpretation.advice?.[0] ||
                  ''
                }
                badge={ziTierLabel}
                referralCode={user?.referralCode || (user?.id ?? null)}
              />
            )}

            <AccuracyFeedback
              category="zi_analysis"
              context={{ zi: result.zi?.zi, aspect: getFocusAspect() }}
            />

            {/* 后续问题 - 可点击跳转聊天 */}
            {result.followUpQuestions.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.continueChatButton}
                  onPress={() => handleFollowUpQuestion('')}
                >
                  <Text style={styles.continueChatText}>{tx('💬 继续聊聊这个字', '💬 Continue chatting about this character', '💬 繼續聊聊這個字')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  wuxingAura: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  loadingHint: {
    fontSize: 12,
    color: '#A89EBE',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  previewBanner: {
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 208, 95, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.35)',
  },
  previewBannerText: {
    color: '#F8DFA1',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  tierCard: {
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1B1430',
    borderWidth: 1,
    borderColor: '#5A417F',
  },
  tierTitle: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  tierDesc: {
    color: '#CFC6DE',
    fontSize: 12,
    lineHeight: 18,
  },
  tierUpgradeBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F8D05F',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8D05F',
  },
  tierUpgradeBtnText: {
    color: '#1A0A18',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ritualHintCard: {
    backgroundColor: '#1A2238',
    borderWidth: 1,
    borderColor: '#3A4670',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ritualHintTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  ritualHintText: {
    color: '#C8D0E8',
    fontSize: 13,
    lineHeight: 20,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFD700',
  },
  modeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#1a1a2e',
  },
  inputSection: {
    marginBottom: 20,
  },
  aspectSection: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  aspectTitle: {
    fontSize: 15,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 10,
  },
  aspectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  aspectTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  aspectTagSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  aspectTagText: {
    color: '#999',
    fontSize: 14,
  },
  aspectTagTextSelected: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  customAspectInput: {
    height: 40,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  handwritingSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  ritualCountdownCard: {
    width: '92%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334B7C',
    padding: 12,
    marginTop: 12,
  },
  ritualCountdownTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  ritualCountdownText: {
    color: '#BFC8E8',
    fontSize: 13,
    lineHeight: 19,
  },
  ritualBreathHint: {
    marginTop: 8,
    color: '#FFD88A',
    fontSize: 13,
    fontWeight: '700',
  },
  ritualCountdownActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  ritualCountdownPrimary: {
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ritualCountdownPrimaryDisabled: {
    backgroundColor: '#4B3A75',
  },
  ritualCountdownPrimaryText: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '700',
  },
  ritualCountdownSecondary: {
    borderWidth: 1,
    borderColor: '#4E5E88',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ritualCountdownSecondaryText: {
    color: '#BFC8E8',
    fontSize: 12,
    fontWeight: '600',
  },
  handwritingCanvasWrap: {
    width: '100%',
    alignItems: 'center',
  },
  progressWrap: {
    marginTop: 10,
    width: '92%',
  },
  progressText: {
    color: '#C7CBE3',
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#2A2D44',
    overflow: 'hidden',
  },
  handwritingPreviewCard: {
    width: '92%',
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1B1530',
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.35)',
  },
  handwritingPreviewLabel: {
    color: '#C8A6FF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  handwritingPreviewZi: {
    color: '#F8D05F',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  handwritingPreviewMeta: {
    color: '#8D8DAA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  handwritingPreviewHint: {
    color: '#BFC8E8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  handwritingPreviewBtn: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  handwritingPreviewBtnDisabled: {
    opacity: 0.55,
  },
  handwritingPreviewBtnText: {
    color: '#1A0A18',
    fontSize: 15,
    fontWeight: '700',
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#6D50A6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  billingPreviewBar: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#3A2A55',
  },
  billingPreviewText: {
    color: '#CFC6DE',
    fontSize: 13,
    lineHeight: 20,
  },
  membershipExpiredHint: {
    marginBottom: 10,
    color: '#F7B267',
    fontSize: 12,
    lineHeight: 18,
  },
  smartCtaWrap: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5A417F',
    backgroundColor: '#1B1430',
  },
  smartCtaTitle: {
    color: '#E4D8FF',
    fontSize: 13,
    marginBottom: 6,
  },
  smartCtaHint: {
    color: '#B9ACD3',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  smartCtaActions: {
    flexDirection: 'row',
    gap: 10,
  },
  smartCtaPrimary: {
    flex: 1,
    backgroundColor: '#F8D05F',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smartCtaPrimaryText: {
    color: '#1A0A18',
    fontSize: 13,
    fontWeight: '700',
  },
  smartCtaSecondary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8D70C0',
    backgroundColor: '#2A1E45',
  },
  smartCtaSecondaryText: {
    color: '#E9DCFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  refineInlineWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2B2E45',
  },
  refineInlineHint: {
    color: '#AEB3CE',
    fontSize: 12,
    marginBottom: 8,
  },
  refineInlineBtn: {
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  refineInlineBtnDisabled: {
    backgroundColor: '#5A5870',
  },
  refineInlineBtnText: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '700',
  },
  focusSummaryBox: {
    backgroundColor: 'rgba(248, 208, 95, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#F8D05F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  focusSummaryLabel: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  focusSummary: {
    color: '#E6E7F2',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  focusSubhead: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  focusBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    paddingRight: 4,
  },
  focusBulletDot: {
    color: '#8BE38B',
    fontSize: 10,
    marginTop: 4,
    width: 14,
  },
  focusBulletDotWarn: {
    color: '#FF8A65',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 0,
    width: 14,
  },
  focusBulletNum: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    width: 18,
  },
  focusItem: {
    color: '#D0D2E3',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  focusChatBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(72, 134, 244, 0.18)',
    borderColor: 'rgba(72, 134, 244, 0.45)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  focusChatBtnText: {
    color: '#BFD8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  premiumHintCard: {
    backgroundColor: '#241B3B',
    borderColor: '#4D3A7A',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  premiumHintText: {
    color: '#E8D4FF',
    fontSize: 13,
    lineHeight: 20,
  },
  premiumHintLink: {
    marginTop: 6,
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    padding: 15,
  },
  ziDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  ziText: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  ziInfo: {
    alignItems: 'center',
  },
  infoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  infoCard: {
    width: 104,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ziMetaSource: {
    marginTop: 12,
    color: '#6F6287',
    fontSize: 11,
    lineHeight: 16,
  },
  componentsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  },
  componentBox: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
  },
  componentText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  componentMeaning: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  associativeText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  skillGroup: {
    marginBottom: 4,
  },
  skillHead: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  skillHint: {
    color: '#8D8DAA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  skillText: {
    color: '#E2E3ED',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 2,
  },
  skillTextBlock: {
    color: '#E2E3ED',
    fontSize: 14,
    lineHeight: 23,
  },
  skillTextEmphasis: {
    color: '#F0E6FF',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  skillDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },
  probingChatBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(109,80,166,0.22)',
    borderColor: 'rgba(109,80,166,0.55)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  probingChatText: {
    color: '#D7C8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  oracleInterpretLead: {
    color: '#E2E3ED',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  oracleEmptyHint: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  oracleEmptyHintText: {
    color: '#AEB3CE',
    fontSize: 13,
    lineHeight: 20,
  },
  oracleTip: {
    color: '#8D8DAA',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 6,
  },
  oracleImageRow: {
    gap: 10,
    paddingVertical: 4,
  },
  oracleImageBox: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d45',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  oracleImage: {
    width: 100,
    height: 100,
  },
  oracleSource: {
    color: '#777',
    fontSize: 12,
    marginTop: 10,
  },
  oracleCounter: {
    color: '#C7C7D2',
    fontSize: 12,
    marginTop: 8,
  },
  oracleUnlockBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderColor: 'rgba(255, 215, 0, 0.45)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  oracleUnlockText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  oracleRemainText: {
    color: '#BDBDCA',
    fontSize: 12,
    marginTop: 6,
  },
  yijingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  yijingBox: {
    alignItems: 'center',
  },
  yijingLabel: {
    color: '#999',
    fontSize: 12,
  },
  yijingValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  guaXiangText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guaDetailWrap: {
    marginTop: 4,
    gap: 8,
  },
  guaDetailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  guaDetailIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  guaDetailItem: {
    color: '#C9CBDD',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  collapseTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  collapseIcon: {
    color: '#FFD700',
    fontSize: 12,
  },
  collapseContent: {
    padding: 15,
    borderRadius: 10,
  },
  coldReadingText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  handwritingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  handwritingLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  handwritingValue: {
    color: '#fff',
    fontSize: 14,
  },
  handwritingInterpretation: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  traitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fortuneItem: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  fortuneItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  fortuneLabel: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  fortuneText: {
    color: '#D8D9E5',
    fontSize: 14,
    lineHeight: 23,
  },
  adviceText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  questionText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 5,
  },
  questionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  continueChatButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  continueChatText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
