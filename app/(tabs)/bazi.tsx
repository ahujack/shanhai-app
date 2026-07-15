import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { userApi, chartApi, BaziChart } from '../../src/services/api';
import { useI18nStore } from '../../src/store/i18n';
import { normalizeBackendText } from '../../src/utils/backendText';
import ResultShareCard from '../../components/ResultShareCard';
import DeliveryNextStepCard from '../../components/DeliveryNextStepCard';

const colors = theme.dark;

type TenGodMetaMap = Record<
  string,
  {
    title: string;
    psych: string;
    strengths: string;
    risks: string;
    empathy: string;
  }
>;

const tenGodMetaZh: TenGodMetaMap = {
  比肩: {
    title: '比肩',
    psych: '自我边界清晰，强调独立与平等关系',
    strengths: '执行力、独立性、抗压能力较好',
    risks: '容易过度自扛，不愿求助',
    empathy: '你可能习惯自己扛着，不太愿意麻烦别人。其实你已经很努力了。',
  },
  劫财: {
    title: '劫财',
    psych: '竞争驱动力强，容易在关系中追求主导',
    strengths: '行动快、开拓性强、社交破冰能力好',
    risks: '冲动决策、资源分配失衡',
    empathy: '你内在有很强的冲劲，但也可能因此一直处在“紧绷推进”状态。',
  },
  食神: {
    title: '食神',
    psych: '表达与创造倾向明显，偏向温和输出',
    strengths: '内容生产、沟通表达、审美与创造力',
    risks: '舒服区停留太久，行动节奏偏慢',
    empathy: '你在表达和创造上很有天赋，也许最近更想被温柔理解而不是被催促。',
  },
  伤官: {
    title: '伤官',
    psych: '思辨与批判意识强，重视自我观点',
    strengths: '洞察问题本质、创新、反常规能力',
    risks: '容易犀利过头，造成沟通摩擦',
    empathy: '你看问题很深，也因此更容易感到“没人真正懂我”。',
  },
  正印: {
    title: '正印',
    psych: '安全感来自知识、秩序与稳定关系',
    strengths: '学习力、系统性、同理和照顾能力',
    risks: '过度保守，难以快速切换策略',
    empathy: '你在寻找可依靠的秩序感，这不是脆弱，而是一种自我保护。',
  },
  偏印: {
    title: '偏印',
    psych: '内在敏感，偏向深度思考与独处加工',
    strengths: '研究力、抽象思维、复杂问题处理',
    risks: '想得过多，行动启动慢',
    empathy: '你并不是拖延，而是脑子里同时在处理太多层信息。',
  },
  正财: {
    title: '正财',
    psych: '务实稳健，重视长期可持续积累',
    strengths: '资源管理、稳定推进、责任感强',
    risks: '过度现实，忽略情绪需求',
    empathy: '你一直在为“稳定”负责，久了也会累，情绪也需要被照顾。',
  },
  偏财: {
    title: '偏财',
    psych: '机会感强，善于外部链接与资源整合',
    strengths: '拓展能力、商业嗅觉、谈判能力',
    risks: '节奏过快，风险控制不足',
    empathy: '你很会抓机会，但可能也因此很少给自己停下来喘气的空间。',
  },
  正官: {
    title: '正官',
    psych: '规则感和秩序感强，重视角色责任',
    strengths: '管理力、规范执行、可信赖',
    risks: '自我压力偏大，容易过于谨慎',
    empathy: '你习惯把“该做的都做好”，但你不需要一直完美才值得被肯定。',
  },
  七杀: {
    title: '七杀',
    psych: '危机应对和决断力突出，适合高压场景',
    strengths: '果断、抗压、关键时刻扛事',
    risks: '紧绷与控制感过强，容易疲惫',
    empathy: '你总能在关键时刻扛住局面，但“总是扛住”本身也很辛苦。',
  },
  日主: {
    title: '日主',
    psych: '核心人格驱动力，代表你的“内核操作系统”',
    strengths: '自我认同和人生主轴',
    risks: '当内核过载时，外部选择会失衡',
    empathy: '你现在的状态值得被认真看见，不需要立刻有标准答案。',
  },
};

const tenGodMetaEn: TenGodMetaMap = {
  比肩: {
    title: 'Peer Star',
    psych: 'Clear self-boundary and independence-oriented mindset.',
    strengths: 'Execution, independence, pressure tolerance.',
    risks: 'Over-carrying burdens and under-asking for support.',
    empathy: 'You may be used to carrying things alone. You have already done a lot.',
  },
  劫财: {
    title: 'Rival Star',
    psych: 'Strong competitive drive and control tendency in relationships.',
    strengths: 'Fast action, pioneering spirit, social activation.',
    risks: 'Impulsive decisions and resource imbalance.',
    empathy: 'Your inner drive is strong, but it may keep you in constant tension.',
  },
  食神: {
    title: 'Expression Star',
    psych: 'Creative and expressive tendency with gentle output style.',
    strengths: 'Content creation, communication, aesthetics, creativity.',
    risks: 'Staying too long in comfort zone.',
    empathy: 'You are naturally gifted in expression and creativity.',
  },
  伤官: {
    title: 'Insight Star',
    psych: 'Strong critical thinking and self-opinion emphasis.',
    strengths: 'Root-cause insight, innovation, unconventional thinking.',
    risks: 'Over-sharp expression may create friction.',
    empathy: 'You see deeply, which can also make you feel misunderstood.',
  },
  正印: {
    title: 'Support Star',
    psych: 'Security comes from order, knowledge and stable ties.',
    strengths: 'Learning ability, system thinking, empathy and care.',
    risks: 'Over-conservative strategy switching.',
    empathy: 'Seeking order is not weakness, it is a protective strength.',
  },
  偏印: {
    title: 'Reflection Star',
    psych: 'Sensitive inner world with deep reflective processing.',
    strengths: 'Research depth, abstraction, complex problem handling.',
    risks: 'Overthinking and slow launch.',
    empathy: 'It is not procrastination; your mind is processing multiple layers.',
  },
  正财: {
    title: 'Wealth Star',
    psych: 'Pragmatic and sustainable accumulation orientation.',
    strengths: 'Resource management, steady progress, responsibility.',
    risks: 'Over-pragmatism and emotional neglect.',
    empathy: 'You have been carrying the burden of stability for long.',
  },
  偏财: {
    title: 'Opportunity Star',
    psych: 'Strong opportunity sensing and resource integration.',
    strengths: 'Expansion, business instinct, negotiation.',
    risks: 'Fast rhythm with weak risk control.',
    empathy: 'You are good at catching opportunities, but may forget to pause.',
  },
  正官: {
    title: 'Order Star',
    psych: 'Strong rule-awareness and role responsibility.',
    strengths: 'Management, reliable execution, trustworthiness.',
    risks: 'High self-pressure and over-caution.',
    empathy: 'You do not need perfection at all times to be valuable.',
  },
  七杀: {
    title: 'Decisive Star',
    psych: 'Strong crisis response and high-pressure decisiveness.',
    strengths: 'Decisiveness, resilience, key-moment ownership.',
    risks: 'Sustained tension and fatigue.',
    empathy: 'You can always hold the line, and that itself is exhausting.',
  },
  日主: {
    title: 'Day Master',
    psych: 'Core personality driver and internal operating system.',
    strengths: 'Self-identity and life-axis clarity.',
    risks: 'When overloaded, external decisions may drift.',
    empathy: 'Your current state deserves to be seen without forcing quick answers.',
  },
};

const tenGodMetaTw: TenGodMetaMap = {
  比肩: {
    title: '比肩',
    psych: '自我邊界清晰，重視獨立與平等關係。',
    strengths: '執行力、獨立性、抗壓能力較好。',
    risks: '容易過度自扛，不願求助。',
    empathy: '你可能習慣自己扛著，其實你已經很努力了。',
  },
  劫财: {
    title: '劫財',
    psych: '競爭驅動力強，關係中易追求主導。',
    strengths: '行動快、開拓性強、社交破冰能力好。',
    risks: '衝動決策、資源分配失衡。',
    empathy: '你內在衝勁很強，也可能因此長期緊繃。',
  },
  食神: {
    title: '食神',
    psych: '表達與創造傾向明顯，偏向溫和輸出。',
    strengths: '內容生產、溝通表達、審美與創造力。',
    risks: '舒適圈停留過久，行動節奏偏慢。',
    empathy: '你在表達與創造上很有天賦。',
  },
  伤官: {
    title: '傷官',
    psych: '思辨與批判意識強，重視自我觀點。',
    strengths: '洞察本質、創新、反常規能力。',
    risks: '過於犀利時，容易產生溝通摩擦。',
    empathy: '你看問題很深，也更容易感到不被理解。',
  },
  正印: {
    title: '正印',
    psych: '安全感來自知識、秩序與穩定關係。',
    strengths: '學習力、系統性、同理與照顧能力。',
    risks: '過度保守，策略切換較慢。',
    empathy: '你尋找秩序感，不是脆弱，而是保護自己。',
  },
  偏印: {
    title: '偏印',
    psych: '內在敏感，偏向深度思考與獨處加工。',
    strengths: '研究力、抽象思維、複雜問題處理。',
    risks: '想得過多，行動啟動偏慢。',
    empathy: '這不是拖延，你其實在處理多層資訊。',
  },
  正财: {
    title: '正財',
    psych: '務實穩健，重視長期可持續積累。',
    strengths: '資源管理、穩定推進、責任感強。',
    risks: '過度現實，忽略情緒需求。',
    empathy: '你一直在為穩定負責，久了也會累。',
  },
  偏财: {
    title: '偏財',
    psych: '機會感強，善於外部連結與資源整合。',
    strengths: '拓展能力、商業嗅覺、談判能力。',
    risks: '節奏過快，風險控制不足。',
    empathy: '你很會抓機會，也需要留出喘息空間。',
  },
  正官: {
    title: '正官',
    psych: '規則感與秩序感強，重視角色責任。',
    strengths: '管理力、規範執行、可信賴。',
    risks: '自我壓力偏大，容易過度謹慎。',
    empathy: '你不需要一直完美，才值得被肯定。',
  },
  七杀: {
    title: '七殺',
    psych: '危機應對與決斷力突出，適合高壓場景。',
    strengths: '果斷、抗壓、關鍵時刻扛事。',
    risks: '緊繃與控制感過強，容易疲憊。',
    empathy: '你總能扛住局面，但這本身也很辛苦。',
  },
  日主: {
    title: '日主',
    psych: '核心人格驅動力，代表你的內核系統。',
    strengths: '自我認同與人生主軸。',
    risks: '內核過載時，外部選擇易失衡。',
    empathy: '你當下的狀態值得被認真看見。',
  },
};

function resolveTenGodMeta(language: 'zh-CN' | 'en-US' | 'zh-TW'): TenGodMetaMap {
  if (language === 'en-US') return tenGodMetaEn;
  if (language === 'zh-TW') return tenGodMetaTw;
  return tenGodMetaZh;
}

const normalizeBirthDate = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) return null;
  const compact = raw
    .replace(/[年./]/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, '');
  const m = compact.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || year < 1900 || year > 2099) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const normalizeBirthTime = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) return null;
  const compact = raw
    .replace(/[点时]/g, ':')
    .replace(/分/g, '')
    .replace(/\./g, ':')
    .replace(/\s+/g, '');
  let hour = -1;
  let minute = -1;
  const hm = compact.match(/^(\d{1,2}):(\d{1,2})$/);
  const hOnly = compact.match(/^(\d{1,2})$/);
  const hhmm = compact.match(/^(\d{3,4})$/);
  if (hm) {
    hour = Number(hm[1]);
    minute = Number(hm[2]);
  } else if (hOnly) {
    hour = Number(hOnly[1]);
    minute = 0;
  } else if (hhmm) {
    const str = hhmm[1].padStart(4, '0');
    hour = Number(str.slice(0, 2));
    minute = Number(str.slice(2, 4));
  } else {
    return null;
  }
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const toDateInputValue = (value: string): string => normalizeBirthDate(value) || '';
const toTimeInputValue = (value: string): string => normalizeBirthTime(value) || '';

type ReadingTier = 'lite' | 'full' | 'deep';
type UserAccessTier = 'guest' | 'free' | 'premium' | 'vip';

const readingTierMeta: Record<ReadingTier, { label: string; description: string }> = {
  lite: {
    label: '简版',
    description: '先给你关键结论与年度提点，适合快速判断方向。',
  },
  full: {
    label: '完整版',
    description: '包含完整老师傅点评，给到更细的年度宜忌和窗口月。',
  },
  deep: {
    label: '深度版',
    description: '在完整版基础上追加深度批注，含关键词、行动一招和避坑提醒。',
  },
};

const resolveReadingTier = (chart: BaziChart): ReadingTier => {
  const annual = chart.detailedReading?.annualForecast || [];
  const commentaries = annual
    .map((item) => item.masterCommentary || '')
    .filter(Boolean)
    .join(' ');
  if (/深度版/.test(commentaries)) return 'deep';
  if (annual.some((item) => !!item.masterCommentary) && !chart.detailedReading?.paywallHint) return 'full';
  return 'lite';
};

const resolveUserAccessTier = (
  user: { membership?: 'free' | 'premium' | 'vip'; membershipExpiryAt?: string | null } | null,
): UserAccessTier => {
  if (!user) return 'guest';
  const tier = user.membership || 'free';
  if (tier === 'premium' || tier === 'vip') {
    if (!user.membershipExpiryAt) return tier;
    const expiryTs = Date.parse(user.membershipExpiryAt);
    if (!Number.isNaN(expiryTs) && expiryTs > Date.now()) return tier;
  }
  return 'free';
};

export default function BaziScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ highlight?: string; fromPayment?: string }>();
  const language = useI18nStore((state) => state.language);
  const languageRevision = useI18nStore((state) => state.languageRevision);
  const tx = useI18nStore((state) => state.tx);
  const normalizeChartText = React.useCallback(
    (value: string | number | null | undefined) => normalizeBackendText(value, language),
    [language],
  );
  const tenGodMeta = React.useMemo(() => resolveTenGodMeta(language), [language]);
  const { user, chart, hasChart, generateChart, isLoading } = useUserStore();
  const [godClicks, setGodClicks] = React.useState<Record<string, number>>({});
  const [activeGod, setActiveGod] = React.useState<string>('日主');
  const [storedGod, setStoredGod] = React.useState<string>('日主');
  const [viewMode, setViewMode] = React.useState<'compact' | 'pro'>('compact');
  const [highlightMaster, setHighlightMaster] = React.useState(false);
  const [showUnlockTip, setShowUnlockTip] = React.useState(false);
  const [annualSectionY, setAnnualSectionY] = React.useState(0);
  const [genError, setGenError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  const [guestChart, setGuestChart] = React.useState<BaziChart | null>(null);
  const [guestBirthDate, setGuestBirthDate] = React.useState('');
  const [guestBirthTime, setGuestBirthTime] = React.useState('');
  const [guestGender, setGuestGender] = React.useState<'male' | 'female'>('male');
  const [guestCalendarType, setGuestCalendarType] = React.useState<'solar' | 'lunar'>('solar');
  const [guestLeap, setGuestLeap] = React.useState(false);
  const [guestPreviewLoading, setGuestPreviewLoading] = React.useState(false);
  const [showInlineBirthForm, setShowInlineBirthForm] = React.useState(false);
  const [inlineBirthDate, setInlineBirthDate] = React.useState('');
  const [inlineBirthTime, setInlineBirthTime] = React.useState('');
  const [inlineGender, setInlineGender] = React.useState<'male' | 'female'>('male');
  const [inlineCalendarType, setInlineCalendarType] = React.useState<'solar' | 'lunar'>('solar');
  const [inlineLeap, setInlineLeap] = React.useState(false);
  const [inlineSaving, setInlineSaving] = React.useState(false);

  const effectiveChart = chart ?? guestChart;
  const showWebDatePicker = Platform.OS === 'web';

  const trackGodClick = React.useCallback((god: string) => {
    setActiveGod(god);
    setGodClicks((prev) => ({
      ...prev,
      [god]: (prev[god] || 0) + 1,
    }));
  }, []);

  const dominantGod = React.useMemo(() => {
    const entries = Object.entries(godClicks);
    if (!entries.length) return storedGod || activeGod || '日主';
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }, [godClicks, activeGod, storedGod]);

  React.useEffect(() => {
    if (!user?.id) return;
    const key = `bazi_focus_god_${user.id}`;
    Promise.all([AsyncStorage.getItem(key), Promise.resolve(user.focusGod || null)])
      .then(([localValue, remoteValue]) => {
        const preferred = remoteValue || localValue;
        if (preferred) {
          setStoredGod(preferred);
          if (activeGod === '日主') setActiveGod(preferred);
        }
      })
      .catch(() => null);
  }, [user?.id, user?.focusGod]);

  React.useEffect(() => {
    if (!user?.id) return;
    const modeKey = `bazi_view_mode_${user.id}`;
    AsyncStorage.getItem(modeKey)
      .then((value) => {
        if (value === 'compact' || value === 'pro') {
          setViewMode(value);
        }
      })
      .catch(() => null);
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;
    const modeKey = `bazi_view_mode_${user.id}`;
    AsyncStorage.setItem(modeKey, viewMode).catch(() => null);
  }, [user?.id, viewMode]);

  React.useEffect(() => {
    if (!user?.id || !dominantGod) return;
    const key = `bazi_focus_god_${user.id}`;
    AsyncStorage.setItem(key, dominantGod).catch(() => null);

    if (user.focusGod === dominantGod) return;

    userApi
      .update(user.id, { focusGod: dominantGod })
      .then((updatedUser) => {
        useUserStore.setState((state) => ({
          user: state.user ? { ...state.user, focusGod: updatedUser.focusGod || dominantGod } : state.user,
        }));
      })
      .catch(() => null);
  }, [user?.id, dominantGod]);

  React.useEffect(() => {
    if (params.highlight === 'master') {
      setHighlightMaster(true);
      setShowUnlockTip(true);
      const timer = setTimeout(() => setHighlightMaster(false), 8000);
      const tipTimer = setTimeout(() => setShowUnlockTip(false), 5000);
      return () => {
        clearTimeout(timer);
        clearTimeout(tipTimer);
      };
    }
  }, [params.highlight]);

  React.useEffect(() => {
    if (!user?.id) return;
    setInlineBirthDate((user.birthDate || '').slice(0, 10));
    setInlineBirthTime((user.birthTime || '').slice(0, 5));
    setInlineGender(user.gender === 'female' ? 'female' : 'male');
    setInlineCalendarType(user.calendarType === 'lunar' ? 'lunar' : 'solar');
    setInlineLeap(!!user.isLeapMonth);
  }, [user?.id, user?.birthDate, user?.birthTime, user?.gender, user?.calendarType, user?.isLeapMonth]);

  React.useEffect(() => {
    if (!highlightMaster || !annualSectionY) return;
    scrollRef.current?.scrollTo({ y: Math.max(annualSectionY - 24, 0), animated: true });
  }, [highlightMaster, annualSectionY]);

  const goBaziDeepChat = () => {
    const c = chart ?? guestChart;
    if (!c) return;
    const conciseCycles = (c.detailedReading?.luckCycles?.cycles || []).slice(0, 2);
    const conciseYears = (c.detailedReading?.annualForecast || []).slice(0, 2);
    const summaryMessage =
      `我们基于你的八字继续深聊：\n` +
      `- 一句话总论：${c.conclusion?.overall || '先稳后进。'}\n` +
      `- 当前关注十神：${activeGod}\n` +
      `- 近期大运参考：${conciseCycles.map((cycle) => `${cycle.ageRange}${cycle.ganZhi}`).join('、') || '暂无'}\n` +
      `- 近两年流年：${conciseYears.map((y) => `${y.year}${y.ganZhi}`).join('、') || '暂无'}\n\n` +
      `你可以告诉我：你最想先聊事业、感情、财务，还是当下最困扰你的情绪？`;

    const chatMessage: ChatMessage = {
      id: `bazi_followup_${Date.now()}`,
      role: 'assistant',
      content: summaryMessage,
      timestamp: new Date(),
    };

    useChatStore.setState((state) => ({
      messages: [...state.messages, chatMessage],
    }));
    router.push('/');
  };

  const handleGenerate = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    setGenError(null);
    const gender = user.gender === 'female' ? 'female' : 'male';
    try {
      await generateChart(gender);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/请先在个人资料中完善出生日期和时间/.test(msg)) {
        setGenError(tx('请先补全出生日期与出生时间，再生成命盘。', 'Please complete birth date and time before generating chart.', '請先補全出生日期與出生時間，再生成命盤。'));
        setShowInlineBirthForm(true);
        return;
      }
      setGenError(
        /请先登录|登录/.test(msg)
          ? tx('登录状态无效或已过期，请重新登录后再生成命盘', 'Session expired. Please log in again.', '登入狀態無效或已過期，請重新登入後再生成命盤')
          : msg || tx('生成命盘失败，请检查网络后重试', 'Generate chart failed, please retry.', '生成命盤失敗，請檢查網路後重試'),
      );
    }
  };

  const handleInlineSaveAndGenerate = async () => {
    if (!user?.id) return;
    const bd = normalizeBirthDate(inlineBirthDate);
    const bt = normalizeBirthTime(inlineBirthTime);
    if (!bd || !bt) {
      setGenError(tx('请填写有效时间：日期支持 1999.7.22 / 1999-07-22，时间支持 20.45 / 20:45 / 2045', 'Please enter a valid date/time.', '請填寫有效時間：日期支持 1999.7.22 / 1999-07-22，時間支持 20.45 / 20:45 / 2045'));
      return;
    }
    setInlineSaving(true);
    setGenError(null);
    try {
      const updatedUser = await userApi.update(user.id, {
        birthDate: bd,
        birthTime: bt,
        gender: inlineGender,
        calendarType: inlineCalendarType,
        isLeapMonth: inlineLeap,
        timezone: user.timezone || 'Asia/Shanghai',
      });
      useUserStore.setState((state) => ({
        user: state.user ? { ...state.user, ...updatedUser } : state.user,
      }));
      await generateChart(inlineGender);
      setShowInlineBirthForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tx('保存失败，请稍后重试', 'Save failed, please retry later.', '保存失敗，請稍後重試');
      setGenError(msg);
    } finally {
      setInlineSaving(false);
    }
  };

  const handleGuestPreview = async () => {
    const bd = normalizeBirthDate(guestBirthDate);
    const bt = normalizeBirthTime(guestBirthTime);
    if (!bd || !bt) {
      Alert.alert(tx('提示', 'Notice', '提示'), tx('请输入有效时间（如 1999.7.22 + 20.45 或 1999-07-22 + 20:45）', 'Please input a valid date/time.', '請輸入有效時間（如 1999.7.22 + 20.45 或 1999-07-22 + 20:45）'));
      return;
    }
    setGuestPreviewLoading(true);
    setGenError(null);
    try {
      const data = await chartApi.preview({
        birthDate: bd,
        birthTime: bt,
        gender: guestGender,
        calendarType: guestCalendarType,
        isLeapMonth: guestLeap,
        timezone: 'Asia/Shanghai',
      });
      setGuestChart(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tx('试算失败', 'Preview failed', '試算失敗');
      setGenError(msg);
    } finally {
      setGuestPreviewLoading(false);
    }
  };

  const prevLanguageRevisionRef = React.useRef(languageRevision);
  React.useEffect(() => {
    if (languageRevision === prevLanguageRevisionRef.current) return;
    prevLanguageRevisionRef.current = languageRevision;
    if (languageRevision === 0 || !guestChart) return;

    const bd = normalizeBirthDate(guestBirthDate);
    const bt = normalizeBirthTime(guestBirthTime);
    if (!bd || !bt) return;

    chartApi
      .preview({
        birthDate: bd,
        birthTime: bt,
        gender: guestGender,
        calendarType: guestCalendarType,
        isLeapMonth: guestLeap,
        timezone: 'Asia/Shanghai',
      })
      .then(setGuestChart)
      .catch(() => null);
  }, [languageRevision, guestChart, guestBirthDate, guestBirthTime, guestGender, guestCalendarType, guestLeap]);

  const handleGuestDatePick = (nextValue: string) => {
    if (!nextValue) return;
    setGuestBirthDate(nextValue);
  };

  const handleGuestTimePick = (nextValue: string) => {
    if (!nextValue) return;
    setGuestBirthTime(nextValue);
  };

  const handleInlineDatePick = (nextValue: string) => {
    if (!nextValue) return;
    setInlineBirthDate(nextValue);
  };

  const handleInlineTimePick = (nextValue: string) => {
    if (!nextValue) return;
    setInlineBirthTime(nextValue);
  };

  if (!effectiveChart) {
    if (!user) {
      return (
        <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <Text style={styles.title}>{tx('📜 八字看盘', '📜 Bazi Chart', '📜 八字看盤')}</Text>
          <Text style={styles.sub}>{tx('未登录也能先试算。登录后可保存命盘，并在对话里继续追问。', 'Preview as a guest. Log in to save the chart and continue in chat.', '未登入也能先試算。登入後可保存命盤，並在對話裡繼續追問。')}</Text>
          <Text style={styles.fieldLabel}>{tx('出生日期', 'Birth Date', '出生日期')}</Text>
          <TextInput
            style={styles.input}
            placeholder={tx('如 1999-07-22 / 1999.7.22', 'e.g. 1999-07-22 / 1999.7.22', '如 1999-07-22 / 1999.7.22')}
            placeholderTextColor="#6F6287"
            value={guestBirthDate}
            onChangeText={setGuestBirthDate}
          />
          {showWebDatePicker && (
            <View style={styles.webPickerRow}>
              {React.createElement('input', {
                type: 'date',
                value: toDateInputValue(guestBirthDate),
                onChange: (e: any) => handleGuestDatePick(e?.target?.value || ''),
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #3A2B5A',
                  backgroundColor: '#1B1430',
                  color: '#F2EEF9',
                  fontSize: '14px',
                  padding: '0 10px',
                  outline: 'none',
                },
              })}
            </View>
          )}
          <Text style={styles.fieldLabel}>{tx('出生时间', 'Birth Time', '出生時間')}</Text>
          <TextInput
            style={styles.input}
            placeholder={tx('如 20:45 / 20.45 / 2045', 'e.g. 20:45 / 20.45 / 2045', '如 20:45 / 20.45 / 2045')}
            placeholderTextColor="#6F6287"
            value={guestBirthTime}
            onChangeText={setGuestBirthTime}
          />
          {showWebDatePicker && (
            <View style={styles.webPickerRow}>
              {React.createElement('input', {
                type: 'time',
                value: toTimeInputValue(guestBirthTime),
                onChange: (e: any) => handleGuestTimePick(e?.target?.value || ''),
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #3A2B5A',
                  backgroundColor: '#1B1430',
                  color: '#F2EEF9',
                  fontSize: '14px',
                  padding: '0 10px',
                  outline: 'none',
                },
              })}
            </View>
          )}
          <Text style={styles.inputHint}>{tx('支持多种输入：`YYYY-MM-DD`、`YYYY/MM/DD`、`YYYY.MM.DD`、`YYYY年M月D日`', 'Accepted: YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD', '支持多種輸入：`YYYY-MM-DD`、`YYYY/MM/DD`、`YYYY.MM.DD`、`YYYY年M月D日`')}</Text>
          <Text style={styles.inputHint}>{tx('时间支持：`20:45`、`20.45`、`2045`、`20点45`', 'Time: 20:45 / 20.45 / 2045', '時間支持：`20:45`、`20.45`、`2045`、`20點45`')}</Text>
          <Text style={styles.fieldLabel}>{tx('历法', 'Calendar', '曆法')}</Text>
          <View style={styles.guestRow}>
            <TouchableOpacity
              style={[styles.guestChip, guestCalendarType === 'solar' && styles.guestChipActive]}
              onPress={() => setGuestCalendarType('solar')}
            >
              <Text style={[styles.guestChipText, guestCalendarType === 'solar' && styles.guestChipTextActive]}>{tx('阳历', 'Solar', '陽曆')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.guestChip, guestCalendarType === 'lunar' && styles.guestChipActive]}
              onPress={() => setGuestCalendarType('lunar')}
            >
              <Text style={[styles.guestChipText, guestCalendarType === 'lunar' && styles.guestChipTextActive]}>{tx('农历', 'Lunar', '農曆')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.guestChip, guestLeap && styles.guestChipActive]}
              onPress={() => setGuestLeap((v) => !v)}
            >
              <Text style={[styles.guestChipText, guestLeap && styles.guestChipTextActive]}>{tx('闰月', 'Leap Month', '閏月')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>{tx('性别', 'Gender', '性別')}</Text>
          <View style={styles.guestRow}>
            <TouchableOpacity
              style={[styles.guestChip, guestGender === 'male' && styles.guestChipActive]}
              onPress={() => setGuestGender('male')}
            >
              <Text style={[styles.guestChipText, guestGender === 'male' && styles.guestChipTextActive]}>{tx('男', 'Male', '男')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.guestChip, guestGender === 'female' && styles.guestChipActive]}
              onPress={() => setGuestGender('female')}
            >
              <Text style={[styles.guestChipText, guestGender === 'female' && styles.guestChipTextActive]}>{tx('女', 'Female', '女')}</Text>
            </TouchableOpacity>
          </View>
          {genError ? <Text style={styles.errorText}>{genError}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 8 }]}
            onPress={handleGuestPreview}
            disabled={guestPreviewLoading}
          >
            {guestPreviewLoading ? (
              <ActivityIndicator color="#1A0A18" />
            ) : (
              <Text style={styles.primaryBtnText}>{tx('先试算一次', 'Preview once', '先試算一次')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 16 }}>
            <Text style={styles.link}>{tx('登录保存命盘', 'Log in to save chart', '登入保存命盤')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={styles.title}>{tx('📜 八字看盘', '📜 Bazi Chart', '📜 八字看盤')}</Text>
        <Text style={styles.sub}>{tx('先生成命盘，再看格局、近期节奏和可追问方向。', 'Generate your chart first, then view pattern, rhythm, and follow-up directions.', '先生成命盤，再看格局、近期節奏和可追問方向。')}</Text>
        {genError && <Text style={styles.errorText}>{genError}</Text>}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} disabled={isLoading}>
          <Text style={styles.primaryBtnText}>{isLoading ? tx('生成中...', 'Generating...', '生成中...') : tx('生成并查看命盘', 'Generate and view chart', '生成並查看命盤')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowInlineBirthForm((v) => !v)}>
          <Text style={styles.link}>{showInlineBirthForm ? tx('收起填写表单', 'Hide form', '收起填寫表單') : tx('在当前页填写出生信息', 'Fill birth info here', '在當前頁填寫出生資訊')}</Text>
        </TouchableOpacity>
        {showInlineBirthForm ? (
          <View style={styles.inlineFormCard}>
            <Text style={styles.inlineFormHint}>{tx('填写后将自动保存到你的资料，并立即生成命盘', 'Saved to profile and generate chart immediately', '填寫後將自動保存到你的資料，並立即生成命盤')}</Text>
            <Text style={styles.fieldLabel}>{tx('出生日期', 'Birth Date', '出生日期')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('如 1999-07-22 / 1999.7.22', 'e.g. 1999-07-22 / 1999.7.22', '如 1999-07-22 / 1999.7.22')}
              placeholderTextColor="#6F6287"
              value={inlineBirthDate}
              onChangeText={setInlineBirthDate}
            />
            {showWebDatePicker && (
              <View style={styles.webPickerRow}>
                {React.createElement('input', {
                  type: 'date',
                  value: toDateInputValue(inlineBirthDate),
                  onChange: (e: any) => handleInlineDatePick(e?.target?.value || ''),
                  style: {
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid #3A2B5A',
                    backgroundColor: '#1B1430',
                    color: '#F2EEF9',
                    fontSize: '14px',
                    padding: '0 10px',
                    outline: 'none',
                  },
                })}
              </View>
            )}
            <Text style={styles.fieldLabel}>{tx('出生时间', 'Birth Time', '出生時間')}</Text>
            <TextInput
              style={styles.input}
              placeholder={tx('如 20:45 / 20.45 / 2045', 'e.g. 20:45 / 20.45 / 2045', '如 20:45 / 20.45 / 2045')}
              placeholderTextColor="#6F6287"
              value={inlineBirthTime}
              onChangeText={setInlineBirthTime}
            />
            {showWebDatePicker && (
              <View style={styles.webPickerRow}>
                {React.createElement('input', {
                  type: 'time',
                  value: toTimeInputValue(inlineBirthTime),
                  onChange: (e: any) => handleInlineTimePick(e?.target?.value || ''),
                  style: {
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid #3A2B5A',
                    backgroundColor: '#1B1430',
                    color: '#F2EEF9',
                    fontSize: '14px',
                    padding: '0 10px',
                    outline: 'none',
                  },
                })}
              </View>
            )}
            <Text style={styles.inputHint}>支持多种输入：`YYYY-MM-DD`、`YYYY/MM/DD`、`YYYY.MM.DD`、`YYYY年M月D日`</Text>
            <Text style={styles.inputHint}>时间支持：`20:45`、`20.45`、`2045`、`20点45`</Text>
            <Text style={styles.fieldLabel}>历法</Text>
            <View style={styles.guestRow}>
              <TouchableOpacity
                style={[styles.guestChip, inlineCalendarType === 'solar' && styles.guestChipActive]}
                onPress={() => setInlineCalendarType('solar')}
              >
                <Text style={[styles.guestChipText, inlineCalendarType === 'solar' && styles.guestChipTextActive]}>阳历</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestChip, inlineCalendarType === 'lunar' && styles.guestChipActive]}
                onPress={() => setInlineCalendarType('lunar')}
              >
                <Text style={[styles.guestChipText, inlineCalendarType === 'lunar' && styles.guestChipTextActive]}>农历</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestChip, inlineLeap && styles.guestChipActive]}
                onPress={() => setInlineLeap((v) => !v)}
              >
                <Text style={[styles.guestChipText, inlineLeap && styles.guestChipTextActive]}>闰月</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>性别</Text>
            <View style={styles.guestRow}>
              <TouchableOpacity
                style={[styles.guestChip, inlineGender === 'male' && styles.guestChipActive]}
                onPress={() => setInlineGender('male')}
              >
                <Text style={[styles.guestChipText, inlineGender === 'male' && styles.guestChipTextActive]}>男</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestChip, inlineGender === 'female' && styles.guestChipActive]}
                onPress={() => setInlineGender('female')}
              >
                <Text style={[styles.guestChipText, inlineGender === 'female' && styles.guestChipTextActive]}>女</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.inlineSubmitBtn]}
              onPress={handleInlineSaveAndGenerate}
              disabled={inlineSaving || isLoading}
            >
              {inlineSaving || isLoading ? (
                <ActivityIndicator color="#1A0A18" />
              ) : (
                <Text style={styles.primaryBtnText}>保存并生成命盘</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.link}>{tx('去个人资料页完善', 'Complete profile', '去個人資料頁完善')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const c = effectiveChart;
  const readingTier = resolveReadingTier(c);
  const userAccessTier = resolveUserAccessTier(user);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.title}>{tx('📜 八字看盘', '📜 Bazi Chart', '📜 八字看盤')}</Text>
      {!user && guestChart ? (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>
            {tx('试算模式：登录后可保存命盘，下次继续追问', 'Trial mode: log in to save and continue later', '試算模式：登入後可保存命盤，下次繼續追問')}
          </Text>
        </View>
      ) : null}
      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'compact' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('compact')}
        >
          <Text style={[styles.modeToggleText, viewMode === 'compact' && styles.modeToggleTextActive]}>
            {tx('简洁模式', 'Compact', '簡潔模式')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'pro' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('pro')}
        >
          <Text style={[styles.modeToggleText, viewMode === 'pro' && styles.modeToggleTextActive]}>
            {tx('专业模式', 'Pro', '專業模式')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tx('一屏总论', 'Overview', '一屏總論')}</Text>
        <Text style={styles.personalizedLead}>
          {tx('近期关注主题：', 'Current focus: ', '近期關注主題：')}
          {tenGodMeta[storedGod]?.title || storedGod}
        </Text>
        <Text style={styles.bodyMuted}>{tenGodMeta[storedGod]?.empathy || tx('我们先从你最在意的感受聊起。', 'Let us start from what you care most.', '我們先從你最在意的感受聊起。')}</Text>
        <Text style={styles.body}>{normalizeChartText(c.conclusion?.overall) || tx('你的命盘呈现稳中有进的结构。', 'Your chart shows a steady-upward pattern.', '你的命盤呈現穩中有進的結構。')}</Text>
        <Text style={styles.bodyMuted}>{normalizeChartText(c.conclusion?.mindset) || tx('建议先稳住内在节奏，再扩展外部机会。', 'Stabilize inner rhythm first, then expand externally.', '建議先穩住內在節奏，再擴展外部機會。')}</Text>
      </View>

      <DeliveryNextStepCard
        title={tx('接下来做什么', 'Next step', '接下來做什麼')}
        summary={normalizeChartText(c.conclusion?.mindset) || tx('先从最影响你当下判断的一件事继续聊。', 'Continue with the one issue affecting your decisions most.', '先從最影響你當下判斷的一件事繼續聊。')}
        primary={{
          label: tx('去对话深入探讨这份八字', 'Discuss this chart in chat', '去對話深入探討這份八字'),
          onPress: goBaziDeepChat,
        }}
        secondary={
          !user
            ? {
                label: tx('登录保存命盘', 'Log in to save chart', '登入保存命盤'),
                onPress: () => router.push('/login'),
              }
            : userAccessTier !== 'vip'
            ? {
                label: tx('升级深度版', 'Upgrade to deep tier', '升級深度版'),
                onPress: () => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } }),
              }
            : null
        }
        tertiary={{
          label: viewMode === 'compact' ? tx('看专业模式', 'View pro mode', '看專業模式') : tx('看简洁模式', 'View compact mode', '看簡潔模式'),
          onPress: () => setViewMode(viewMode === 'compact' ? 'pro' : 'compact'),
        }}
      />

      <ResultShareCard
        kind="bazi"
        headline={`${c.yearGanZhi} ${c.monthGanZhi} ${c.dayGanZhi} ${c.hourGanZhi}`}
        summary={normalizeChartText(c.conclusion?.overall) || normalizeChartText(c.conclusion?.mindset) || ''}
        badge={tx('八字命盘', 'BaZi Chart', '八字命盤')}
        referralCode={user?.referralCode || (user?.id ?? null)}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tx('四柱八字', 'Four Pillars', '四柱八字')}</Text>
        <View style={styles.pillarRow}>
          <Text style={styles.pillar}>{tx('年柱', 'Year', '年柱')} {c.yearGanZhi}</Text>
          <Text style={styles.pillar}>{tx('月柱', 'Month', '月柱')} {c.monthGanZhi}</Text>
          <Text style={styles.pillar}>{tx('日柱', 'Day', '日柱')} {c.dayGanZhi}</Text>
          <Text style={styles.pillar}>{tx('时柱', 'Hour', '時柱')} {c.hourGanZhi}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tx('十神结构', 'Ten Gods Structure', '十神結構')}</Text>
        <View style={styles.tenGodRow}>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(c.tenGods?.year || '日主')}>
            <Text style={styles.tenGodLabel}>{tx('年柱', 'Year', '年柱')}</Text>
            <Text style={styles.tenGodValue}>{c.tenGods?.year || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(c.tenGods?.month || '日主')}>
            <Text style={styles.tenGodLabel}>{tx('月柱', 'Month', '月柱')}</Text>
            <Text style={styles.tenGodValue}>{c.tenGods?.month || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(c.tenGods?.day || '日主')}>
            <Text style={styles.tenGodLabel}>{tx('日柱', 'Day', '日柱')}</Text>
            <Text style={styles.tenGodValue}>{c.tenGods?.day || tx('日主', 'Day Master', '日主')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(c.tenGods?.hour || '日主')}>
            <Text style={styles.tenGodLabel}>{tx('时柱', 'Hour', '時柱')}</Text>
            <Text style={styles.tenGodValue}>{c.tenGods?.hour || '-'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tenGodDetailCard}>
          <Text style={styles.tenGodDetailTitle}>{tenGodMeta[activeGod]?.title || activeGod}</Text>
          <Text style={styles.bodyMuted}>{tx('心理学翻译：', 'Psychology:', '心理學翻譯：')}{tenGodMeta[activeGod]?.psych || tx('你的行为风格与外界互动方式。', 'Your behavior style and interaction mode.', '你的行為風格與外界互動方式。')}</Text>
          <Text style={styles.bodyMuted}>{tx('优势：', 'Strengths:', '優勢：')}{tenGodMeta[activeGod]?.strengths || tx('在稳定场景有较好表现。', 'You perform better in stable contexts.', '在穩定場景有較好表現。')}</Text>
          <Text style={styles.bodyMuted}>{tx('提醒：', 'Watch-outs:', '提醒：')}{tenGodMeta[activeGod]?.risks || tx('注意情绪负荷和节奏管理。', 'Watch emotional load and pacing.', '注意情緒負荷和節奏管理。')}</Text>
        </View>
        {(c.tenGods?.summary || []).map((line, idx) => (
          <Text key={idx} style={styles.bodyMuted}>- {normalizeChartText(line)}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tx('运势速览', 'Trend Snapshot', '運勢速覽')}</Text>
        <Text style={styles.body}>{tx('事业：', 'Career: ', '事業：')}{normalizeChartText(c.fortuneSummary?.career)}</Text>
        <Text style={styles.body}>{tx('感情：', 'Love: ', '感情：')}{normalizeChartText(c.fortuneSummary?.love)}</Text>
        <Text style={styles.body}>{tx('财运：', 'Wealth: ', '財運：')}{normalizeChartText(c.fortuneSummary?.wealth)}</Text>
        <Text style={styles.body}>{tx('健康：', 'Health: ', '健康：')}{normalizeChartText(c.fortuneSummary?.health)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{tx('详细解读', 'Detailed Reading', '詳細解讀')}</Text>
        <View style={styles.tierRow}>
          <Text
            style={[
              styles.tierBadge,
              readingTier === 'lite'
                ? styles.tierBadgeLite
                : readingTier === 'full'
                ? styles.tierBadgeFull
                : styles.tierBadgeDeep,
            ]}
          >
            {tx('当前解读档位：', 'Current Tier: ', '當前解讀檔位：')}{readingTierMeta[readingTier].label}
          </Text>
          <Text style={styles.tierDescription}>{readingTierMeta[readingTier].description}</Text>
          <Text style={styles.tierLegend}>{tx('档位说明：简版 / 完整版 / 深度版', 'Tier guide: Lite / Full / Deep', '檔位說明：簡版 / 完整版 / 深度版')}</Text>
        </View>
        <View style={[styles.moduleCard, styles.moduleCore]}>
          <Text style={styles.sectionHead}>{tx('🧭 核心格局', '🧭 Core Pattern', '🧭 核心格局')}</Text>
          <Text style={styles.body}>{normalizeChartText(c.detailedReading?.corePattern) || tx('正在生成更细致的盘面解读...', 'Generating deeper chart interpretation...', '正在生成更細緻的盤面解讀...')}</Text>
        </View>

        {viewMode === 'pro' ? (
          <View style={[styles.moduleCard, styles.moduleRelation]}>
            <Text style={styles.sectionHead}>{tx('💕 感情关系', '💕 Relationship', '💕 感情關係')}</Text>
            <Text style={styles.body}>{normalizeChartText(c.detailedReading?.relationship) || '-'}</Text>
          </View>
        ) : null}

        <View style={[styles.moduleCard, styles.moduleCareer]}>
          <Text style={styles.sectionHead}>{tx('💼 事业发展', '💼 Career Development', '💼 事業發展')}</Text>
          <Text style={styles.body}>{normalizeChartText(c.detailedReading?.career) || '-'}</Text>
        </View>

        {viewMode === 'pro' ? (
          <>
            <View style={[styles.moduleCard, styles.moduleWealth]}>
              <Text style={styles.sectionHead}>{tx('💰 财务节奏', '💰 Wealth Rhythm', '💰 財務節奏')}</Text>
              <Text style={styles.body}>{normalizeChartText(c.detailedReading?.wealth) || '-'}</Text>
            </View>
            <View style={[styles.moduleCard, styles.moduleHealth]}>
              <Text style={styles.sectionHead}>{tx('🫀 身心状态', '🫀 Body & Mind', '🫀 身心狀態')}</Text>
              <Text style={styles.body}>{normalizeChartText(c.detailedReading?.health) || '-'}</Text>
            </View>
            <View style={[styles.moduleCard, styles.moduleRhythm]}>
              <Text style={styles.sectionHead}>{tx('⏳ 阶段节奏参考', '⏳ Stage Rhythm', '⏳ 階段節奏參考')}</Text>
              {(c.detailedReading?.decadeRhythm || []).map((line, idx) => (
                <Text key={idx} style={styles.bodyMuted}>- {normalizeChartText(line)}</Text>
              ))}
            </View>
            <View style={[styles.moduleCard, styles.moduleRhythm]}>
              <Text style={styles.sectionHead}>{tx('🪐 大运节奏（按起运推算）', '🪐 Luck Cycle Rhythm', '🪐 大運節奏（按起運推算）')}</Text>
              <Text style={styles.bodyMuted}>
                {tx('起运约在', 'Starts around age', '起運約在')} {c.detailedReading?.luckCycles?.startAge ?? '-'} {tx('岁，', 'years old, ', '歲，')}
                {tx('方向：', 'Direction: ', '方向：')}
                {c.detailedReading?.luckCycles?.direction === 'forward'
                  ? tx('顺行', 'Forward', '順行')
                  : tx('逆行', 'Reverse', '逆行')}
              </Text>
              {(c.detailedReading?.luckCycles?.cycles || []).map((cycle, idx) => (
                <Text key={`cycle_${idx}`} style={styles.bodyMuted}>
                  - {cycle.ageRange}（{cycle.ganZhi}）：{normalizeChartText(cycle.focus)}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <View
          onLayout={(event) => setAnnualSectionY(event.nativeEvent.layout.y)}
          style={[styles.moduleCard, styles.moduleAnnual, highlightMaster ? styles.highlightPanel : undefined]}
        >
          <Text style={styles.sectionHead}>{tx('📅 近五年流年', '📅 Next 5 Years', '📅 近五年流年')}</Text>
          {showUnlockTip ? <Text style={styles.unlockTip}>{tx('✨ 已解锁老师傅批注，以下为高级流年细化', '✨ Master notes unlocked. Advanced yearly details below.', '✨ 已解鎖老師傅批註，以下為高級流年細化')}</Text> : null}
          {(c.detailedReading?.annualForecast || [])
            .slice(0, viewMode === 'compact' ? 2 : 5)
            .map((yearItem, idx) => (
            <View key={`year_${idx}`} style={{ marginBottom: 6 }}>
              <Text style={styles.bodyMuted}>
                - {yearItem.year}（{yearItem.ganZhi} / {yearItem.tenGod}）：{normalizeChartText(yearItem.hint)}
              </Text>
              <Text style={styles.bodyMuted}>  {tx('宜：', 'Do: ', '宜：')}{normalizeChartText(yearItem.favorable) || tx('稳步推进主线事项', 'Advance the main line steadily', '穩步推進主線事項')}</Text>
              <Text style={styles.bodyMuted}>  {tx('忌：', "Don't: ", '忌：')}{normalizeChartText(yearItem.caution) || tx('避免多线分散与情绪化决策', 'Avoid fragmented focus and emotional decisions', '避免多線分散與情緒化決策')}</Text>
              <Text style={styles.bodyMuted}>
                {' '}
                {tx('关键窗口月：', 'Key window months: ', '關鍵窗口月：')}{normalizeChartText((yearItem.windowMonths || []).join('、')) || tx('3-4月、9-10月', 'Mar-Apr, Sep-Oct', '3-4月、9-10月')}
              </Text>
              {yearItem.masterCommentary ? (
                <Text style={[styles.body, highlightMaster ? styles.masterCommentaryHighlight : undefined]}>
                  {' '}
                  {normalizeChartText(yearItem.masterCommentary)}
                </Text>
              ) : null}
            </View>
          ))}
          {viewMode === 'compact' ? <Text style={styles.bodyMuted}>{tx('* 切换到「专业模式」可查看完整五年流年。', '* Switch to Pro mode to view all five years.', '* 切換到「專業模式」可查看完整五年流年。')}</Text> : null}
          {readingTier === 'lite' ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/points',
                  params: { focus: 'vip' },
                })
              }
            >
              <Text style={[styles.bodyMuted, styles.paywallLink]}>
                {tx('🔓 当前为简版，解锁完整版老师傅点评（含完整年度宜忌与窗口月）', '🔓 You are on Lite. Unlock Full for complete yearly actions and timing windows.', '🔓 當前為簡版，解鎖完整版老師傅點評（含完整年度宜忌與窗口月）')}
              </Text>
              {c.detailedReading?.paywallHint ? (
                <Text style={[styles.bodyMuted, styles.paywallSubText]}>{normalizeChartText(c.detailedReading.paywallHint)}</Text>
              ) : null}
            </TouchableOpacity>
          ) : null}
          {readingTier === 'full' ? (
            userAccessTier === 'premium' ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/points',
                    params: { focus: 'vip' },
                  })
                }
              >
                <Text style={[styles.bodyMuted, styles.paywallLink]}>
                  {tx('⬆️ 当前为完整版，升级深度版可解锁「关键词 + 年度一招 + 避坑提醒」', '⬆️ You are on Full. Upgrade to Deep for keywords, annual move, and pitfall alerts.', '⬆️ 當前為完整版，升級深度版可解鎖「關鍵詞 + 年度一招 + 避坑提醒」')}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.bodyMuted, styles.paywallSubText]}>{tx('✅ 当前已解锁完整版老师傅点评', '✅ Full master notes unlocked', '✅ 當前已解鎖完整版老師傅點評')}</Text>
            )
          ) : null}
          {readingTier === 'deep' ? (
            <Text style={[styles.bodyMuted, styles.tierTopBadge]}>{tx('✅ 已解锁最高档：深度版老师傅批注', '✅ Highest tier unlocked: Deep master annotations', '✅ 已解鎖最高檔：深度版老師傅批註')}</Text>
          ) : null}
        </View>

        <View style={[styles.moduleCard, styles.moduleAnnual]}>
          <Text style={styles.sectionHead}>{tx('📝 年度提醒', '📝 Yearly Reminders', '📝 年度提醒')}</Text>
          {(c.detailedReading?.yearlyTips || [])
            .slice(0, viewMode === 'compact' ? 2 : 8)
            .map((line, idx) => (
            <Text key={`tip_${idx}`} style={styles.bodyMuted}>- {normalizeChartText(line)}</Text>
          ))}
        </View>

        <Text style={styles.disclaimer}>{normalizeChartText(c.detailedReading?.disclaimer)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8D05F', marginBottom: 12 },
  sub: { color: '#9D93B3', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#161126', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2F2342' },
  cardTitle: { color: '#F8D05F', fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  body: { color: '#F2EEF9', fontSize: 14, lineHeight: 22, marginBottom: 4 },
  bodyMuted: { color: '#A89EBE', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  sectionHead: { color: '#E8DCFF', fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  personalizedLead: { color: '#E3D6FF', fontSize: 13, marginBottom: 4, fontWeight: '600' },
  modeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeToggleBtn: {
    borderWidth: 1,
    borderColor: '#3A2B5A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1B1430',
  },
  modeToggleBtnActive: { borderColor: '#F8D05F', backgroundColor: '#2A1E42' },
  modeToggleText: { color: '#B9ACD3', fontSize: 12 },
  modeToggleTextActive: { color: '#F8D05F', fontWeight: '600' },
  chatCtaBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chatCtaText: { color: '#F7F6F0', fontSize: 12, fontWeight: '600' },
  pillarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillar: { color: '#DDD4EE', fontSize: 13, backgroundColor: '#1F1730', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tenGodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tenGodChip: {
    backgroundColor: '#1F1730',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A2B5A',
    minWidth: 72,
  },
  tenGodLabel: { color: '#9C8FB2', fontSize: 11 },
  tenGodValue: { color: '#F8D05F', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  tenGodDetailCard: {
    backgroundColor: '#1A1328',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#322243',
    padding: 10,
    marginBottom: 8,
  },
  tenGodDetailTitle: { color: '#F8D05F', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  moduleCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A2D52',
    backgroundColor: '#1B1430',
    borderLeftWidth: 3,
    borderLeftColor: '#5D4A89',
  },
  moduleCore: { backgroundColor: '#201634', borderLeftColor: '#8E67D1' },
  moduleRelation: { backgroundColor: '#211733', borderLeftColor: '#C96BAA' },
  moduleCareer: { backgroundColor: '#1C1832', borderLeftColor: '#6DA1FF' },
  moduleWealth: { backgroundColor: '#211A32', borderLeftColor: '#E0B861' },
  moduleHealth: { backgroundColor: '#1A1C31', borderLeftColor: '#75C9A8' },
  moduleRhythm: { backgroundColor: '#1D1833', borderLeftColor: '#9A82E8' },
  moduleAnnual: { backgroundColor: '#1F1735', borderLeftColor: '#F8D05F' },
  highlightPanel: {
    borderWidth: 1,
    borderColor: '#F8D05F',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#221834',
  },
  unlockTip: {
    color: '#F8D05F',
    fontSize: 12,
    marginBottom: 6,
  },
  masterCommentaryHighlight: {
    color: '#F8D05F',
  },
  paywallLink: {
    textDecorationLine: 'underline',
    color: '#D7C7FF',
  },
  paywallSubText: {
    color: '#9D93B3',
    fontSize: 12,
    marginTop: 4,
  },
  tierTopBadge: {
    color: '#F8D05F',
    fontSize: 12,
  },
  disclaimer: {
    marginTop: 10,
    color: '#8E84A3',
    fontSize: 12,
    lineHeight: 18,
  },
  tierRow: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A2D52',
    backgroundColor: '#1A132A',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  tierBadgeLite: {
    color: '#E7D9FF',
    backgroundColor: '#3F2A60',
  },
  tierBadgeFull: {
    color: '#FFE8AE',
    backgroundColor: '#4A3A1C',
  },
  tierBadgeDeep: {
    color: '#F8D05F',
    backgroundColor: '#4E2B12',
  },
  tierDescription: {
    color: '#D6CDE8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  tierLegend: {
    color: '#8E84A3',
    fontSize: 11,
  },
  primaryBtn: { backgroundColor: '#F8D05F', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  primaryBtnText: { color: '#1A0A18', fontWeight: 'bold', fontSize: 14 },
  link: { marginTop: 12, color: '#B8A8D8', fontSize: 13 },
  fieldLabel: { alignSelf: 'stretch', color: '#A89EBE', fontSize: 12, marginTop: 10, marginBottom: 4 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#1B1430',
    borderWidth: 1,
    borderColor: '#3A2B5A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F2EEF9',
    fontSize: 15,
  },
  inputHint: {
    alignSelf: 'stretch',
    color: '#8E84A3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  webPickerRow: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  guestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 },
  guestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A2B5A',
    backgroundColor: '#1B1430',
  },
  guestChipActive: { borderColor: '#F8D05F', backgroundColor: '#2A1E42' },
  guestChipText: { color: '#9D93B3', fontSize: 13 },
  guestChipTextActive: { color: '#F8D05F', fontWeight: '600' },
  guestBanner: {
    backgroundColor: '#2A1E42',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#5D4A89',
  },
  guestBannerText: { color: '#D7C7FF', fontSize: 12, textAlign: 'center' },
  inlineFormCard: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#161126',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F2342',
    padding: 12,
  },
  inlineFormHint: {
    color: '#B9ACD3',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  inlineSubmitBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
