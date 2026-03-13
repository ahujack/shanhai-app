import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { userApi } from '../../src/services/api';

const colors = theme.dark;

const tenGodMeta: Record<
  string,
  {
    title: string;
    psych: string;
    strengths: string;
    risks: string;
    empathy: string;
  }
> = {
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

export default function BaziScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ highlight?: string; fromPayment?: string }>();
  const { user, chart, hasChart, generateChart, isLoading } = useUserStore();
  const [godClicks, setGodClicks] = React.useState<Record<string, number>>({});
  const [activeGod, setActiveGod] = React.useState<string>('日主');
  const [storedGod, setStoredGod] = React.useState<string>('日主');
  const [highlightMaster, setHighlightMaster] = React.useState(false);
  const [showUnlockTip, setShowUnlockTip] = React.useState(false);
  const [annualSectionY, setAnnualSectionY] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

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
    if (!highlightMaster || !annualSectionY) return;
    scrollRef.current?.scrollTo({ y: Math.max(annualSectionY - 24, 0), animated: true });
  }, [highlightMaster, annualSectionY]);

  const handleGenerate = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }
    const gender = user.gender === 'female' ? 'female' : 'male';
    await generateChart(gender);
  };

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={styles.title}>📜 八字看盘</Text>
        <Text style={styles.sub}>登录后可查看完整八字与十神解读</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>去登录</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasChart || !chart) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={styles.title}>📜 八字看盘</Text>
        <Text style={styles.sub}>先生成命盘，再查看十神与五行结构</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate} disabled={isLoading}>
          <Text style={styles.primaryBtnText}>{isLoading ? '生成中...' : '生成我的命盘'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.link}>去完善出生信息</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.title}>📜 八字看盘</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>一屏总论</Text>
        <Text style={styles.personalizedLead}>近期关注主题：{tenGodMeta[storedGod]?.title || storedGod}</Text>
        <Text style={styles.bodyMuted}>{tenGodMeta[storedGod]?.empathy || '我们先从你最在意的感受聊起。'}</Text>
        <Text style={styles.body}>{chart.conclusion?.overall || '你的命盘呈现稳中有进的结构。'}</Text>
        <Text style={styles.bodyMuted}>{chart.conclusion?.mindset || '建议先稳住内在节奏，再扩展外部机会。'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>四柱八字</Text>
        <View style={styles.pillarRow}>
          <Text style={styles.pillar}>年柱 {chart.yearGanZhi}</Text>
          <Text style={styles.pillar}>月柱 {chart.monthGanZhi}</Text>
          <Text style={styles.pillar}>日柱 {chart.dayGanZhi}</Text>
          <Text style={styles.pillar}>时柱 {chart.hourGanZhi}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>十神结构</Text>
        <View style={styles.tenGodRow}>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(chart.tenGods?.year || '日主')}>
            <Text style={styles.tenGodLabel}>年柱</Text>
            <Text style={styles.tenGodValue}>{chart.tenGods?.year || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(chart.tenGods?.month || '日主')}>
            <Text style={styles.tenGodLabel}>月柱</Text>
            <Text style={styles.tenGodValue}>{chart.tenGods?.month || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(chart.tenGods?.day || '日主')}>
            <Text style={styles.tenGodLabel}>日柱</Text>
            <Text style={styles.tenGodValue}>{chart.tenGods?.day || '日主'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tenGodChip} onPress={() => trackGodClick(chart.tenGods?.hour || '日主')}>
            <Text style={styles.tenGodLabel}>时柱</Text>
            <Text style={styles.tenGodValue}>{chart.tenGods?.hour || '-'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tenGodDetailCard}>
          <Text style={styles.tenGodDetailTitle}>{tenGodMeta[activeGod]?.title || activeGod}</Text>
          <Text style={styles.bodyMuted}>心理学翻译：{tenGodMeta[activeGod]?.psych || '你的行为风格与外界互动方式。'}</Text>
          <Text style={styles.bodyMuted}>优势：{tenGodMeta[activeGod]?.strengths || '在稳定场景有较好表现。'}</Text>
          <Text style={styles.bodyMuted}>提醒：{tenGodMeta[activeGod]?.risks || '注意情绪负荷和节奏管理。'}</Text>
        </View>
        {(chart.tenGods?.summary || []).map((line, idx) => (
          <Text key={idx} style={styles.bodyMuted}>- {line}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>运势速览</Text>
        <Text style={styles.body}>事业：{chart.fortuneSummary?.career}</Text>
        <Text style={styles.body}>感情：{chart.fortuneSummary?.love}</Text>
        <Text style={styles.body}>财运：{chart.fortuneSummary?.wealth}</Text>
        <Text style={styles.body}>健康：{chart.fortuneSummary?.health}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>详细解读</Text>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>核心格局</Text>
          <Text style={styles.body}>{chart.detailedReading?.corePattern || '正在生成更细致的盘面解读...'}</Text>
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>感情关系</Text>
          <Text style={styles.body}>{chart.detailedReading?.relationship || '-'}</Text>
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>事业发展</Text>
          <Text style={styles.body}>{chart.detailedReading?.career || '-'}</Text>
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>财务节奏</Text>
          <Text style={styles.body}>{chart.detailedReading?.wealth || '-'}</Text>
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>身心状态</Text>
          <Text style={styles.body}>{chart.detailedReading?.health || '-'}</Text>
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>阶段节奏参考</Text>
          {(chart.detailedReading?.decadeRhythm || []).map((line, idx) => (
            <Text key={idx} style={styles.bodyMuted}>- {line}</Text>
          ))}
        </View>
        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>大运节奏（按起运推算）</Text>
          <Text style={styles.bodyMuted}>
            起运约在 {chart.detailedReading?.luckCycles?.startAge ?? '-'} 岁，
            方向：{chart.detailedReading?.luckCycles?.direction === 'forward' ? '顺行' : '逆行'}
          </Text>
          {(chart.detailedReading?.luckCycles?.cycles || []).map((cycle, idx) => (
            <Text key={`cycle_${idx}`} style={styles.bodyMuted}>
              - {cycle.ageRange}（{cycle.ganZhi}）：{cycle.focus}
            </Text>
          ))}
        </View>

        <View
          onLayout={(event) => setAnnualSectionY(event.nativeEvent.layout.y)}
          style={[styles.moduleCard, highlightMaster ? styles.highlightPanel : undefined]}
        >
          <Text style={styles.sectionHead}>近五年流年</Text>
          {showUnlockTip ? <Text style={styles.unlockTip}>✨ 已解锁老师傅批注，以下为高级流年细化</Text> : null}
          {(chart.detailedReading?.annualForecast || []).map((yearItem, idx) => (
            <View key={`year_${idx}`} style={{ marginBottom: 6 }}>
              <Text style={styles.bodyMuted}>
                - {yearItem.year}（{yearItem.ganZhi} / {yearItem.tenGod}）：{yearItem.hint}
              </Text>
              <Text style={styles.bodyMuted}>  宜：{yearItem.favorable || '稳步推进主线事项'}</Text>
              <Text style={styles.bodyMuted}>  忌：{yearItem.caution || '避免多线分散与情绪化决策'}</Text>
              <Text style={styles.bodyMuted}>
                {' '}
                关键窗口月：{(yearItem.windowMonths || []).join('、') || '3-4月、9-10月'}
              </Text>
              {yearItem.masterCommentary ? (
                <Text style={[styles.body, highlightMaster ? styles.masterCommentaryHighlight : undefined]}>
                  {' '}
                  {yearItem.masterCommentary}
                </Text>
              ) : null}
            </View>
          ))}
        {chart.detailedReading?.paywallHint ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/points',
                params: { focus: 'vip' },
              })
            }
          >
            <Text style={[styles.bodyMuted, styles.paywallLink]}>🔒 {chart.detailedReading.paywallHint}（点此解锁）</Text>
          </TouchableOpacity>
        ) : null}
        </View>

        <View style={styles.moduleCard}>
          <Text style={styles.sectionHead}>年度提醒</Text>
          {(chart.detailedReading?.yearlyTips || []).map((line, idx) => (
            <Text key={`tip_${idx}`} style={styles.bodyMuted}>- {line}</Text>
          ))}
        </View>

        <Text style={styles.disclaimer}>{chart.detailedReading?.disclaimer || ''}</Text>
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
  card: { backgroundColor: '#161126', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2F2342' },
  cardTitle: { color: '#F8D05F', fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  body: { color: '#F2EEF9', fontSize: 14, lineHeight: 22, marginBottom: 4 },
  bodyMuted: { color: '#A89EBE', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  sectionHead: { color: '#E8DCFF', fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  personalizedLead: { color: '#E3D6FF', fontSize: 13, marginBottom: 4, fontWeight: '600' },
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
    borderColor: '#2E2340',
    backgroundColor: '#1B1430',
  },
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
  disclaimer: {
    marginTop: 10,
    color: '#8E84A3',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryBtn: { backgroundColor: '#F8D05F', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  primaryBtnText: { color: '#1A0A18', fontWeight: 'bold', fontSize: 14 },
  link: { marginTop: 12, color: '#B8A8D8', fontSize: 13 },
});
