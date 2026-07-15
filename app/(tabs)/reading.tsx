import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { readingApi, CreateReadingDto, DivinationResult, pointsApi } from '../../src/services/api';
import { trackFeature, trackNamedEvent } from '../../src/services/analytics';
import AccuracyFeedback from '../../components/AccuracyFeedback';
import ResultShareCard from '../../components/ResultShareCard';
import DeliveryNextStepCard from '../../components/DeliveryNextStepCard';
import { useUserStore } from '../../src/store/user';
import { useDivinationStore } from '../../src/store/divination';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { useI18nStore } from '../../src/store/i18n';
import { isMembershipActive } from '../../src/utils/membership';
import { localizeAuthMessage } from '../../src/utils/authMessage';

const colors = theme.dark;

function useLoadingHint(isActive: boolean, hints: string[]) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % hints.length), 2800);
    return () => clearInterval(t);
  }, [hints.length, isActive]);
  return hints[idx];
}

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    fromFortune?: string | string[];
    fromChatReading?: string | string[];
    suggestedQuestion?: string | string[];
    suggestedCategory?: string | string[];
  }>();
  const { user } = useUserStore();
  const language = useI18nStore((state) => state.language);
  const t = useI18nStore((state) => state.t);
  const loadingHints = [
    t('reading.loading.1', '正在起卦...'),
    t('reading.loading.2', '感应六爻中...'),
    t('reading.loading.3', '解读卦象中...'),
    t('reading.loading.4', '生成建议中...'),
    t('reading.loading.5', '即将完成...'),
  ];
  const { lastFortune, lastReading } = useDivinationStore();
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<CreateReadingDto['category']>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFortuneSource, setShowFortuneSource] = useState(true);
  const [readingPointsCost, setReadingPointsCost] = useState(15);
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [showSmartCta, setShowSmartCta] = useState(false);
  const loadingHint = useLoadingHint(isLoading, loadingHints);

  const toSingle = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const fromFortune = toSingle(params.fromFortune) === '1';
  const fromChatReading = toSingle(params.fromChatReading) === '1';
  const suggestedQuestion = toSingle(params.suggestedQuestion);
  const suggestedCategory = toSingle(params.suggestedCategory) as CreateReadingDto['category'] | undefined;

  const inferCategoryFromFortuneTheme = (): CreateReadingDto['category'] => {
    const theme = lastFortune?.fortuneTheme;
    if (theme === 'career' || theme === 'love' || theme === 'wealth' || theme === 'health') {
      return theme;
    }
    return 'general';
  };

  const buildDeepReadingQuestionFromFortune = () => {
    if (!lastFortune) return question.trim();
    const missionPart = lastFortune.mission
      ? t('reading.prompt.missionPart', '今日任务是「{mission}」。').replace('{mission}', lastFortune.mission)
      : '';
    return t(
      'reading.prompt.fromFortune',
      '我刚完成一次抽签，请基于这次签文做深度解签，重点给我可执行行动建议与风险提醒，不要重新起卦。{missionPart}',
    ).replace('{missionPart}', missionPart);
  };

  useEffect(() => {
    if (!fromFortune) return;
    if (!question && suggestedQuestion) {
      setQuestion(suggestedQuestion);
    }
    if (suggestedCategory) {
      setCategory(suggestedCategory);
    }
  }, [fromFortune, question, suggestedQuestion, suggestedCategory]);

  useEffect(() => {
    if (!fromChatReading || !lastReading) return;
    setResult(lastReading);
    setShowDetails(false);
  }, [fromChatReading, lastReading]);

  const categories = [
    { value: 'general', label: t('reading.category.general', '综合') },
    { value: 'career', label: t('reading.category.career', '事业') },
    { value: 'love', label: t('reading.category.love', '感情') },
    { value: 'wealth', label: t('reading.category.wealth', '财运') },
    { value: 'health', label: t('reading.category.health', '健康') },
    { value: 'growth', label: t('reading.category.growth', '成长') },
  ] as const;

  const hasMembershipTier = user?.membership === 'vip' || user?.membership === 'premium';
  const isVip = isMembershipActive(user);
  const readingTierLabel = isVip
    ? t('reading.form.tier.memberLabel', '深度版（会员）')
    : t('reading.form.tier.singleLabel', '完整版（单次解锁）');
  const readingTierDesc = isVip
    ? t('reading.form.tier.memberDesc', '包含逐句回应 + 动爻拆解 + 行动计划 + 可继续追问')
    : t('reading.form.tier.singleDesc', '已包含核心解读，升级会员可解锁「无限次深度解读 + 追问模式」');
  const displayPointsCost = isVip ? 0 : readingPointsCost;
  const memberFreeSuffix = isVip ? t('reading.form.memberFreeSuffix', '（会员免扣）') : '';
  const billingPreviewText = t(
    'reading.form.billingPreview',
    '本次将扣：{cost} 积分{memberFree} · 当前余额：{balance}',
  )
    .replace('{cost}', String(displayPointsCost))
    .replace('{memberFree}', memberFreeSuffix)
    .replace('{balance}', String(availablePoints ?? '--'));
  const membershipExpiredHint =
    hasMembershipTier && !isVip ? t('reading.form.membershipExpired', '会员权益已过期，当前按积分扣费。') : '';

  useEffect(() => {
    let alive = true;
    pointsApi
      .getRules()
      .then((rules) => {
        if (alive && Number.isFinite(rules?.costs?.reading)) {
          setReadingPointsCost(Math.max(1, Number(rules.costs.reading)));
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

  const openPointsMall = () => router.push({ pathname: '/(tabs)/points', params: { tab: 'mall' } });
  const openVipPlan = () => router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } });
  const projectedMonthlyRuns = 20;
  const projectedMonthlyPoints = readingPointsCost * projectedMonthlyRuns;
  const projectedCheckinDays = Math.ceil(projectedMonthlyPoints / 10);

  const unlockDeepFromFortune = async () => {
    if (!fromFortune || !lastFortune) return;
    if (user && !isVip) {
      try {
        const checkRes = await pointsApi.check(readingPointsCost);
        if (checkRes.hasEnough === false) {
          setError(
            t('reading.error.notEnoughUnlock', '积分不足：解锁深度解签需要 {cost} 积分').replace(
              '{cost}',
              String(readingPointsCost),
            ),
          );
          setShowSmartCta(true);
          trackNamedEvent('paywall_show', { source: 'reading_fortune_unlock' });
          await refreshPointsBalance();
          return;
        }
      } catch {
        // 检查失败时继续请求，由后端判定
      }
    }
    setIsLoading(true);
    setError(null);
    try {
      const deepReading = await readingApi.create({
        question: buildDeepReadingQuestionFromFortune(),
        category: inferCategoryFromFortuneTheme(),
      });
      setResult(deepReading);
      trackFeature('reading_complete', { source: 'fortune', category: inferCategoryFromFortuneTheme() });
      setShowDetails(false);
      setShowSmartCta(false);
      await refreshPointsBalance();
    } catch (err: any) {
      const rawMsg = String(err?.message || '');
      const msg = localizeAuthMessage({
        rawMessage: rawMsg,
        language,
        fallback: {
          zhCN: t('reading.unlock.failed', '解锁失败，请稍后重试'),
          enUS: 'Unlock failed. Please try again shortly.',
          zhTW: '解鎖失敗，請稍後重試',
        },
      });
      if (/(积分不足|積分不足|insufficient points)/i.test(rawMsg || msg)) {
        setShowSmartCta(true);
        trackNamedEvent('paywall_show', { source: 'reading_fortune_error' });
        await refreshPointsBalance();
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || q.length < 2) return;
    if (user && !isVip) {
      try {
        const checkRes = await pointsApi.check(readingPointsCost);
        if (checkRes.hasEnough === false) {
          setError(
            t('reading.error.notEnoughSubmit', '积分不足：本次占卜需要 {cost} 积分').replace(
              '{cost}',
              String(readingPointsCost),
            ),
          );
          setShowSmartCta(true);
          trackNamedEvent('paywall_show', { source: 'reading_submit_precheck' });
          await refreshPointsBalance();
          return;
        }
      } catch {
        // 检查失败时仍尝试请求
      }
    }
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const dto: CreateReadingDto = {
        question: q,
        category,
      };
      const reading = await readingApi.create(dto);
      setResult(reading);
      trackFeature('reading_complete', { source: 'form', category });
      setShowSmartCta(false);
      await refreshPointsBalance();
    } catch (err: any) {
      console.error('占卜失败:', err);
      const rawMsg = String(err?.message || '');
      const msg = localizeAuthMessage({
        rawMessage: rawMsg,
        language,
        fallback: {
          zhCN: t('reading.submit.failed', '占卜失败，请稍后重试'),
          enUS: 'Reading failed. Please try again shortly.',
          zhTW: '占卜失敗，請稍後重試',
        },
      });
      if (/(积分不足|積分不足|insufficient points)/i.test(rawMsg || msg)) {
        setShowSmartCta(true);
        trackNamedEvent('paywall_show', { source: 'reading_submit_error' });
        await refreshPointsBalance();
      }
      setError(msg || t('reading.submit.failed', '占卜失败，请稍后重试'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
    setShowDetails(false);
  };

  const handleDeepConversation = () => {
    if (!result) return;
    const movingLines = result.hexagram.lines.filter((line) => line === '6' || line === '9').length;
    const caution = result.timing.caution || '';
    const cautionRisky =
      caution.includes('争') || caution.includes('困') || caution.includes('避') || caution.includes('损');

    const bridgeMode: 'soothe' | 'listen' | 'clarify' =
      cautionRisky ? 'soothe' : movingLines >= 3 ? 'clarify' : 'listen';

    const bridgeByMode: Record<typeof bridgeMode, string> = {
      soothe: t(
        'reading.result.bridge.soothe',
        '谢谢你把这些感受带来。我们先不着急定结论，先把心慢慢放稳。\n\n如果你愿意，可以先说说：此刻最压着你的情绪是什么？',
      ),
      listen: t(
        'reading.result.bridge.listen',
        '这次我更想先听你，而不是催你马上行动。\n\n你最近最反复想到、最放不下的是哪一件事？',
      ),
      clarify: t(
        'reading.result.bridge.clarify',
        '你已经很认真了，也许现在只是信息太多、心有点累。\n\n我们先轻轻理一理：你最担心什么？你最想守住什么？',
      ),
    };

    const supportChoiceLine = t(
      'reading.result.bridge.choices',
      '\n\n你也可以直接告诉我，你此刻更需要哪种陪伴：\n1）先安慰我\n2）先听我讲\n3）帮我理清楚',
    );

    const supportiveMessage: ChatMessage = {
      id: `bridge_${Date.now()}`,
      role: 'assistant',
      content: `${bridgeByMode[bridgeMode]}${supportChoiceLine}`,
      timestamp: new Date(),
    };

    useChatStore.setState((state) => ({
      messages: [...state.messages, supportiveMessage],
    }));

    router.push('/');
  };
  const openPointsMallWithTrack = () => {
    trackNamedEvent('plan_select', { plan: 'points_pack', source: 'reading_paywall' });
    openPointsMall();
  };
  const openVipPlanWithTrack = () => {
    trackNamedEvent('plan_select', { plan: 'vip', source: 'reading_paywall' });
    openVipPlan();
  };
  const openPricingWithTrack = () => {
    trackNamedEvent('plan_select', { plan: 'pricing_compare', source: 'reading_result' });
    router.push('/pricing');
  };

  if (result) {
    const movingLines = result.hexagram.lines.filter((line) => line === '6' || line === '9').length;
    const confidence = Math.max(62, Math.min(92, 88 - movingLines * 6 + (result.hexagram.original === result.hexagram.changed ? 4 : 0)));
    const confidenceValue = result.conclusion?.confidence || confidence;
    const toneValue = result.conclusion?.emotionalTone || t('reading.result.neutral', '中性');
    const reportSealText =
      confidenceValue >= 85
        ? t('reading.result.seal.high', '本次建议：稳中推进')
        : confidenceValue >= 75
        ? t('reading.result.seal.mid', '本次建议：先试后扩')
        : t('reading.result.seal.low', '本次建议：先稳后动');
    const reportSealTilt = confidenceValue >= 85 ? '-3deg' : confidenceValue >= 75 ? '-1.5deg' : '2deg';
    const actionSteps = (
      result.recommendations?.filter((item) => !!item && item.trim().length > 0) || []
    ).slice(0, 4);
    if (!actionSteps.length) {
      actionSteps.push(
        result.conclusion?.nextStep ||
          result.interpretation.guidance ||
          t('reading.result.nextFallback', '先稳住节奏，再做决定。'),
      );
    }
    const riskItems = [
      result.timing.caution,
      movingLines >= 3
        ? t('reading.result.risk.dynamic', '动爻偏多，外部变量变化快，避免一次性押注。')
        : t('reading.result.risk.static', '动爻偏少，局面变化慢，警惕拖延与观望过久。'),
      result.interpretation.situation || '',
    ]
      .map((item) => item?.trim())
      .filter((item): item is string => !!item);
    const weeklyRhythm = [
      {
        phase: t('reading.result.rhythm.monTue', '周初（周一-周二）'),
        text:
          result.conclusion?.nextStep ||
          t('reading.result.rhythm.monTueFallback', '先定目标和边界，不急着做重决策。'),
      },
      {
        phase: t('reading.result.rhythm.wedThu', '周中（周三-周四）'),
        text: actionSteps[0] || t('reading.result.rhythm.wedThuFallback', '推进一个最小动作，优先拿到外部反馈。'),
      },
      {
        phase: t('reading.result.rhythm.fri', '周后段（周五）'),
        text: result.timing.suitable || t('reading.result.rhythm.friFallback', '适合收敛执行，减少临时新增事项。'),
      },
      {
        phase: t('reading.result.rhythm.weekend', '周末（复盘）'),
        text: result.timing.caution || t('reading.result.rhythm.weekendFallback', '回看得失，修正节奏，不做情绪化决定。'),
      },
    ];

    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.sectionTitle}>
          {fromFortune ? t('reading.result.fortuneTitle', '🔮 深度解签结果') : t('reading.result.title', '🔮 占卜结果')}
        </Text>
        <View style={[styles.card, styles.tierCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.tierTitle}>
            {t('reading.result.tierLabel', '当前解读档位：{label}').replace('{label}', readingTierLabel)}
          </Text>
          <Text style={styles.tierDesc}>{readingTierDesc}</Text>
          <Text style={styles.tierHintInline}>
            {t('reading.result.costHint', '提示：本次深度解签消耗 {cost} 积分{memberFree}。')
              .replace('{cost}', String(displayPointsCost))
              .replace('{memberFree}', isVip ? t('reading.form.memberFreeSuffix', '（会员免扣）') : '')}
          </Text>
          {!!membershipExpiredHint && <Text style={styles.membershipExpiredHint}>{membershipExpiredHint}</Text>}
        </View>

        {fromFortune && lastFortune && (
          <View style={[styles.card, styles.fromFortuneCard, { backgroundColor: colors.surface }]}>
            <View style={styles.fromFortuneHeader}>
            <Text style={styles.fromFortuneTitle}>{t('reading.result.fromFortune', '🎯 来自本次抽签的深度解读')}</Text>
              <View style={styles.fromFortuneHeaderRight}>
                {!!lastFortune.fortuneRank && (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{lastFortune.fortuneRank}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.fromFortuneToggle}
                  onPress={() => setShowFortuneSource((v) => !v)}
                >
                  <Text style={styles.fromFortuneToggleText}>{showFortuneSource ? t('common.collapse', '收起') : t('common.expand', '展开')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {showFortuneSource && (
              <>
                <Text style={styles.fromFortuneMeta}>
                  {t('reading.result.fortuneSign', '签名：{title}').replace('{title}', lastFortune.poem.title)}
                </Text>
                {!!lastFortune.mission && (
                  <Text style={styles.fromFortuneHint}>
                    {t('reading.result.fortuneMission', '🧩 今日任务：{mission}').replace(
                      '{mission}',
                      lastFortune.mission,
                    )}
                  </Text>
                )}
                {!!lastFortune.funTip && (
                  <Text style={styles.fromFortuneHint}>
                    {t('reading.result.fortuneFunTip', '🎲 趣味提示：{tip}').replace('{tip}', lastFortune.funTip)}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* 一屏结论 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>{t('reading.result.conclusion', '🧿 一句话结论')}</Text>
          <Text style={styles.conclusionVerdict}>{result.conclusion?.verdict || result.interpretation.overall}</Text>
          <Text style={styles.conclusionMeta}>
            {t('reading.result.tone', '情绪趋势')}：{result.conclusion?.emotionalTone || t('reading.result.neutral', '中性')}  |  {t('reading.result.confidence', '置信度')}：{result.conclusion?.confidence || confidence}%
          </Text>
          <Text style={styles.conclusionNext}>{t('reading.result.next', '下一步')}：{result.conclusion?.nextStep || t('reading.result.nextFallback', '先稳住节奏，再做决定。')}</Text>
          <TouchableOpacity style={styles.toggleDetailsButton} onPress={() => setShowDetails((v) => !v)}>
            <Text style={styles.toggleDetailsText}>{showDetails ? t('reading.result.hideDetails', '收起完整细节') : t('reading.result.showDetails', '展开完整细节')}</Text>
          </TouchableOpacity>
        </View>

        <DeliveryNextStepCard
          title={t('reading.result.delivery.title', '接下来做什么')}
          summary={result.conclusion?.nextStep || t('reading.result.nextFallback', '先稳住节奏，再做决定。')}
          primary={{
            label: t('reading.result.delivery.chat', '继续聊这件事'),
            onPress: handleDeepConversation,
          }}
          secondary={
            !isVip
              ? {
                  label: t('reading.result.delivery.upgrade', '解锁深度追问'),
                  onPress: openVipPlanWithTrack,
                }
              : null
          }
          tertiary={{
            label: t('reading.result.delivery.again', '再测一次'),
            onPress: handleReset,
          }}
        />

        {showDetails && (
          <>
            <View style={[styles.card, styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.cardTitle}>{t('reading.result.detail.conclusion', '① 结论')}</Text>
                <View style={styles.detailValueBadge}>
                  <Text style={styles.detailValueBadgeText}>{t('reading.result.badge.conclusion', '决策结论')}</Text>
                </View>
              </View>
              <View style={styles.detailGoldDivider} />
              <Text style={styles.detailMainText}>
                {result.conclusion?.verdict || result.interpretation.overall}
              </Text>
              <View style={styles.reportSealWrap}>
                <View style={[styles.reportSeal, { transform: [{ rotate: reportSealTilt }] }]}>
                  <View style={styles.reportSealRing} />
                  <Text style={styles.reportSealText}>{reportSealText}</Text>
                  <Text style={styles.reportSealMeta}>
                    {t('reading.result.detail.confidence', '置信度')} {confidenceValue}% · {toneValue}
                  </Text>
                </View>
              </View>
              <Text style={styles.detailSubText}>
                {t('reading.result.detail.confidence', '置信度')}：{result.conclusion?.confidence || confidence}% ·
                {' '}
                {t('reading.result.detail.tone', '情绪趋势')}：
                {result.conclusion?.emotionalTone || t('reading.result.neutral', '中性')}
              </Text>
              <Text style={styles.detailHintText}>
                {fromFortune
                  ? `${t('reading.result.detail.basedOn', '依据')}: ${lastFortune?.poem.title || t('reading.result.detail.currentFortune', '本次签文')}`
                  : `${t('reading.result.detail.basedOn', '依据')}: ${result.hexagram.originalName} → ${result.hexagram.changedName}`}
              </Text>
            </View>

            <View style={[styles.card, styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.cardTitle}>{t('reading.result.detail.action', '② 行动步骤')}</Text>
                <View style={styles.detailValueBadge}>
                  <Text style={styles.detailValueBadgeText}>{t('reading.result.badge.action', '执行计划')}</Text>
                </View>
              </View>
              <View style={styles.detailGoldDivider} />
              {actionSteps.map((step, idx) => (
                <View key={`step_${idx}`} style={styles.detailBulletRow}>
                  <Text style={styles.detailBulletIndex}>{idx + 1}</Text>
                  <Text style={styles.detailBulletText}>{step}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.deepChatButton} onPress={handleDeepConversation}>
                <Text style={styles.deepChatButtonText}>{t('reading.result.deepTalk', '和我聊聊现在的感受')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.cardTitle}>{t('reading.result.detail.risk', '③ 风险雷区')}</Text>
                <View style={styles.detailValueBadge}>
                  <Text style={styles.detailValueBadgeText}>{t('reading.result.badge.risk', '风险预警')}</Text>
                </View>
              </View>
              <View style={styles.detailGoldDivider} />
              {riskItems.map((risk, idx) => (
                <View key={`risk_${idx}`} style={styles.detailBulletRow}>
                  <Text style={styles.detailRiskIcon}>⚠️</Text>
                  <Text style={styles.detailBulletText}>{risk}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, styles.detailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.cardTitle}>{t('reading.result.detail.rhythm', '④ 本周节奏')}</Text>
                <View style={styles.detailValueBadge}>
                  <Text style={styles.detailValueBadgeText}>{t('reading.result.badge.rhythm', '节奏窗口')}</Text>
                </View>
              </View>
              <View style={styles.detailGoldDivider} />
              {weeklyRhythm.map((item) => (
                <View key={item.phase} style={styles.rhythmRow}>
                  <Text style={styles.rhythmPhase}>{item.phase}</Text>
                  <Text style={styles.rhythmText}>{item.text}</Text>
                </View>
              ))}
              <Text style={styles.rhythmHint}>
                {t('reading.result.detail.rhythmHint', '建议：每完成一步就停下来复盘一次，再进入下一步。')}
              </Text>
            </View>
          </>
        )}

        <ResultShareCard
          kind="reading"
          headline={result.conclusion?.verdict || result.interpretation.overall}
          summary={result.conclusion?.nextStep || result.recommendations?.[0] || result.interpretation.guidance || question.trim()}
          badge={readingTierLabel}
          referralCode={user?.referralCode || (user?.id ?? null)}
        />

        <AccuracyFeedback
          category="divination_reading"
          context={{ category, questionPreview: question.trim().slice(0, 80) }}
        />

        {/* 再次占卜 */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>{t('reading.reset', '再次占卜')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <Text style={styles.sectionTitle}>{t('reading.form.title', '🔮 深度解读')}</Text>
      <View style={[styles.card, styles.tierCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.tierTitle}>{t('reading.form.tierTitle', '解读档位对比')}</Text>
        <Text style={styles.tierLine}>{t('reading.form.tierLine.basic', '简版：一句结论 + 基础建议（适合快速判断）')}</Text>
        <Text style={styles.tierLine}>{t('reading.form.tierLine.standard', '完整版：本卦/变卦/动爻拆解 + 三条行动建议')}</Text>
        <Text style={styles.tierLine}>{t('reading.form.tierLine.deep', '深度版：逐句回应你的问题 + 风险拆解 + 追问模式')}</Text>
        {!isVip && (
          <TouchableOpacity
            style={styles.tierUpgradeBtn}
            onPress={() => {
              trackNamedEvent('plan_select', { plan: 'vip', source: 'reading_tier_card' });
              router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } });
            }}
          >
            <Text style={styles.tierUpgradeText}>{t('reading.form.unlockNow', '立即解锁当前结果（可继续追问）')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {fromFortune && lastFortune && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>{t('reading.form.fortuneSummary', '🧿 抽签免费摘要')}</Text>
          <Text style={styles.featureText}>
            {t('reading.result.fortuneSign', '签名：{title}').replace('{title}', lastFortune.poem.title)}
          </Text>
          <Text style={styles.featureText}>
            {t('reading.form.fortuneDay', '今日：{day}').replace('{day}', lastFortune.day)}
          </Text>
          <Text style={styles.hint}>
            {lastFortune.interpretation?.overall || t('reading.form.fortuneFallback', '已为你带入本次抽签结果。')}
          </Text>
          <Text style={styles.hint}>
            {isVip
              ? t('reading.form.cost.free', '当前会员有效期内免扣积分（本次扣 0 积分）。')
              : t('reading.form.cost.need', '解锁深度解签需 {cost} 积分，当前余额 {balance}。')
                  .replace('{cost}', String(readingPointsCost))
                  .replace('{balance}', String(availablePoints ?? '--'))}
          </Text>
          {!!membershipExpiredHint && <Text style={styles.membershipExpiredHint}>{membershipExpiredHint}</Text>}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={unlockDeepFromFortune}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#1A0A18" size="small" />
                <Text style={styles.loadingHint}>{loadingHint}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                {isVip
                  ? t('reading.form.unlockVip', '解锁深度解签（会员免扣）')
                  : t('reading.form.unlockByPoints', '解锁深度解签（{cost} 积分）').replace(
                      '{cost}',
                      String(readingPointsCost),
                    )}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.hint}>
          {`${t('reading.form.inputHint', '将心中困惑如实道来，字数不限，可附加时间、人物或地点，以便匹配更精准的卦象。')}${
            isVip
              ? t('reading.form.cost.free', '当前会员有效期内免扣积分（本次扣 0 积分）。')
              : t('reading.form.cost.guestInline', '免费用户本次 {cost} 积分。').replace(
                  '{cost}',
                  String(readingPointsCost),
                )
          }`}
        </Text>
        
        <TextInput
          style={styles.textInput}
          placeholder={t('reading.form.placeholder', '例：我即将换工作，但对新团队心里没底，也担心签证问题...')}
          placeholderTextColor="#6F6287"
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        {/* 分类选择 */}
        <Text style={styles.categoryLabel}>{t('reading.form.categoryLabel', '选择占卜类型')}</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryButton,
                category === cat.value && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={[
                styles.categoryText,
                category === cat.value && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.billingPreviewBar}>
          <Text style={styles.billingPreviewText}>{billingPreviewText}</Text>
        </View>
        {!!membershipExpiredHint && <Text style={styles.membershipExpiredHint}>{membershipExpiredHint}</Text>}

        {showSmartCta && !isVip && (
          <View style={styles.smartCtaWrap}>
            <Text style={styles.smartCtaTitle}>{t('reading.paywall.title', '余额不足，建议优先补充权益')}</Text>
            <Text style={styles.smartCtaHint}>
              {t(
                'reading.paywall.hint',
                '按每周约 5 次测算，深度解签本月约需 {points} 积分（约 {days} 天签到）。',
              )
                .replace('{points}', String(projectedMonthlyPoints))
                .replace('{days}', String(projectedCheckinDays))}
            </Text>
            <View style={styles.smartCtaActions}>
              <TouchableOpacity style={styles.smartCtaPrimary} onPress={openPointsMallWithTrack}>
                <Text style={styles.smartCtaPrimaryText}>{t('reading.paywall.recharge', '买积分包')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smartCtaSecondary} onPress={openVipPlanWithTrack}>
                <Text style={styles.smartCtaSecondaryText}>{t('reading.paywall.openVip', '开会员更划算')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.smartCtaGhost}
              onPress={() => {
                trackNamedEvent('plan_select', { plan: 'chat_first', source: 'reading_paywall' });
                router.push('/');
              }}
            >
              <Text style={styles.smartCtaGhostText}>{t('reading.paywall.chatFirst', '先回首页聊聊，不立即解锁')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !question.trim() || question.trim().length < 2}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1A0A18" size="small" />
              <Text style={styles.loadingHint}>{loadingHint}</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>{t('reading.form.submit', '开始解读')}</Text>
          )}
        </TouchableOpacity>
        
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSubmit}
              disabled={isLoading}>
              <Text style={styles.retryButtonText}>{t('common.retry', '重试')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* 说明 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.cardTitle}>{t('reading.form.includes', '📋 解读包含内容')}</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>{t('reading.form.includes.item1', '• 卦象摘要：六爻起卦 + 变爻提示')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>{t('reading.form.includes.item2', '• 多维解读：事业 / 情感 / 心理')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>{t('reading.form.includes.item3', '• 行动建议：下一步可执行的三条建议')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>{t('reading.form.includes.item4', '• 文化溯源：相关典籍出处与启发')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D6B36A',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#121827',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  tierCard: {
    borderColor: '#2A3448',
    borderWidth: 1,
  },
  tierTitle: {
    color: '#D6B36A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierDesc: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
  },
  tierLine: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 6,
  },
  tierUpgradeBtn: {
    marginTop: 10,
    backgroundColor: '#7C6CFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7C6CFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tierUpgradeText: {
    color: '#F5F7FB',
    fontSize: 13,
    fontWeight: '700',
  },
  tierHintInline: {
    marginTop: 8,
    color: '#94A0B8',
    fontSize: 12,
    lineHeight: 18,
  },
  fromFortuneCard: {
    borderColor: '#2A3448',
  },
  fromFortuneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fromFortuneHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fromFortuneTitle: {
    color: '#D6B36A',
    fontSize: 14,
    fontWeight: '700',
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1A2233',
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  rankBadgeText: {
    color: '#D6B36A',
    fontSize: 12,
    fontWeight: '700',
  },
  fromFortuneToggle: {
    backgroundColor: '#1A2233',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  fromFortuneToggleText: {
    color: '#AAB3C5',
    fontSize: 11,
    fontWeight: '700',
  },
  fromFortuneMeta: {
    color: '#AAB3C5',
    fontSize: 13,
    marginBottom: 8,
  },
  fromFortuneHint: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  hint: {
    color: '#94A0B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1A2233',
    borderRadius: 14,
    padding: 16,
    color: '#E8ECF3',
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#2A3448',
    marginBottom: 16,
  },
  categoryLabel: {
    color: '#AAB3C5',
    fontSize: 14,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A2233',
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  categoryButtonActive: {
    backgroundColor: '#2A3160',
    borderColor: '#7C6CFF',
  },
  categoryText: {
    color: '#94A0B8',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#E8ECF3',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#7C6CFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  submitButtonText: {
    color: '#F5F7FB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  billingPreviewBar: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A2233',
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  billingPreviewText: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
  },
  membershipExpiredHint: {
    marginTop: 8,
    color: '#F7B267',
    fontSize: 12,
    lineHeight: 18,
  },
  smartCtaWrap: {
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3448',
    backgroundColor: '#1A2233',
  },
  smartCtaTitle: {
    color: '#E8ECF3',
    fontSize: 13,
    marginBottom: 6,
  },
  smartCtaHint: {
    color: '#AAB3C5',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  smartCtaActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  smartCtaPrimary: {
    flex: 1,
    backgroundColor: '#7C6CFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smartCtaPrimaryText: {
    color: '#F5F7FB',
    fontSize: 13,
    fontWeight: '700',
  },
  smartCtaSecondary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3448',
    backgroundColor: '#121827',
  },
  smartCtaSecondaryText: {
    color: '#E8ECF3',
    fontSize: 13,
    fontWeight: '700',
  },
  smartCtaGhost: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3448',
    backgroundColor: '#121827',
  },
  smartCtaGhostText: {
    color: '#AAB3C5',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(211,47,47,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,118,118,0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A2233',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3448',
  },
  retryButtonText: {
    color: '#E8ECF3',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingHint: {
    color: '#F5F7FB',
    fontSize: 14,
    fontWeight: '600',
  },
  // 结果页样式
  hexagramHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  hexagramName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D6B36A',
    marginBottom: 8,
  },
  hexagramOriginal: {
    color: '#AAB3C5',
    fontSize: 16,
  },
  hexagramChanged: {
    color: '#D6B36A',
    fontSize: 16,
    marginTop: 4,
  },
  yaoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A3448',
    paddingTop: 16,
  },
  yaoTitle: {
    color: '#D6B36A',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  yaoText: {
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D6B36A',
    marginBottom: 16,
  },
  detailCard: {
    borderColor: '#2A3448',
    borderWidth: 1,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(214,179,106,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(214,179,106,0.35)',
    marginLeft: 8,
  },
  detailValueBadgeText: {
    color: '#D6B36A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  detailGoldDivider: {
    height: 1,
    backgroundColor: 'rgba(214,179,106,0.35)',
    marginTop: -6,
    marginBottom: 12,
  },
  detailMainText: {
    color: '#E8ECF3',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  reportSealWrap: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportSeal: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(214,179,106,0.6)',
    backgroundColor: 'rgba(214,179,106,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    opacity: 0.9,
  },
  reportSealRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214,179,106,0.24)',
  },
  reportSealText: {
    color: '#D6B36A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  reportSealMeta: {
    color: '#AAB3C5',
    fontSize: 11,
  },
  detailSubText: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailHintText: {
    color: '#94A0B8',
    fontSize: 12,
    lineHeight: 18,
  },
  detailBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailBulletIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    color: '#121827',
    backgroundColor: '#D6B36A',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
    marginTop: 2,
  },
  detailRiskIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  detailBulletText: {
    flex: 1,
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 21,
  },
  rhythmRow: {
    backgroundColor: '#1A2233',
    borderWidth: 1,
    borderColor: '#2A3448',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  rhythmPhase: {
    color: '#D6B36A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  rhythmText: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
  },
  rhythmHint: {
    marginTop: 6,
    color: '#94A0B8',
    fontSize: 12,
    lineHeight: 18,
  },
  interpretationText: {
    color: '#E8ECF3',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recNumber: {
    color: '#D6B36A',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  recText: {
    color: '#AAB3C5',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  timingText: {
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#1A2233',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#E8ECF3',
    fontSize: 15,
    fontWeight: 'bold',
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    color: '#AAB3C5',
    fontSize: 14,
  },
  structCard: {
    backgroundColor: '#1A2233',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3448',
    padding: 12,
    marginBottom: 10,
  },
  structTitle: {
    color: '#D6B36A',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  structText: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 20,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2A3448',
  },
  confidenceLabel: {
    color: '#9C95AD',
    fontSize: 13,
  },
  confidenceValue: {
    color: '#D6B36A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  supportText: {
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  deepChatButton: {
    backgroundColor: '#7C6CFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  deepChatButtonText: {
    color: '#F5F7FB',
    fontSize: 15,
    fontWeight: 'bold',
  },
  supportHint: {
    color: '#94A0B8',
    fontSize: 12,
  },
  conclusionVerdict: {
    color: '#E8ECF3',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  conclusionMeta: {
    color: '#94A0B8',
    fontSize: 13,
    marginBottom: 8,
  },
  conclusionNext: {
    color: '#AAB3C5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  conclusionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  conclusionSecondaryBtn: {
    flex: 1,
    backgroundColor: '#1A2233',
    borderWidth: 1,
    borderColor: '#2A3448',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  conclusionSecondaryText: {
    color: '#E8ECF3',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleDetailsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A2233',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChatBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A2233',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  quickChatBtnText: {
    color: '#E8ECF3',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleDetailsText: {
    color: '#D6B36A',
    fontSize: 13,
    fontWeight: '600',
  },
});
