import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { readingApi, CreateReadingDto, DivinationResult, pointsApi } from '../../src/services/api';
import { trackFeature, trackNamedEvent } from '../../src/services/analytics';
import AccuracyFeedback from '../../components/AccuracyFeedback';
import { useUserStore } from '../../src/store/user';
import { useDivinationStore } from '../../src/store/divination';
import { useChatStore, ChatMessage } from '../../src/store/chat';

const colors = theme.dark;

const LOADING_HINTS = [
  '正在起卦...',
  '感应六爻中...',
  '解读卦象中...',
  '生成建议中...',
  '即将完成...',
];

function useLoadingHint(isActive: boolean) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % LOADING_HINTS.length), 2800);
    return () => clearInterval(t);
  }, [isActive]);
  return LOADING_HINTS[idx];
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
  const { lastFortune, lastReading } = useDivinationStore();
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<CreateReadingDto['category']>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showFortuneSource, setShowFortuneSource] = useState(true);
  const [readingPointsCost, setReadingPointsCost] = useState(15);
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [showSmartCta, setShowSmartCta] = useState(false);
  const loadingHint = useLoadingHint(isLoading);

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
    return `我抽到「${lastFortune.poem.title}」${lastFortune.drawCode ? `（签号${lastFortune.drawCode}）` : ''}，请结合今天签文做深度解签，给我具体行动建议。`;
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
    setShowDetails(true);
  }, [fromChatReading, lastReading]);

  const categories = [
    { value: 'general', label: '综合' },
    { value: 'career', label: '事业' },
    { value: 'love', label: '感情' },
    { value: 'wealth', label: '财运' },
    { value: 'health', label: '健康' },
    { value: 'growth', label: '成长' },
  ] as const;

  const isVip = user?.membership === 'vip' || user?.membership === 'premium';
  const readingTierLabel = isVip ? '深度版（会员）' : '完整版（单次解锁）';
  const readingTierDesc = isVip
    ? '包含逐句回应 + 动爻拆解 + 行动计划 + 可继续追问'
    : '已包含核心解读，升级会员可解锁「无限次深度解读 + 追问模式」';

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
          setError(`积分不足：解锁深度解签需要 ${readingPointsCost} 积分`);
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
      setShowDetails(true);
      setShowSmartCta(false);
      await refreshPointsBalance();
    } catch (err: any) {
      const msg = err?.message || '解锁失败，请稍后重试';
      if (msg.includes('积分不足')) {
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
          setError(`积分不足：本次占卜需要 ${readingPointsCost} 积分`);
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
      const msg = err?.message || '';
      if (msg.includes('积分不足')) {
        setShowSmartCta(true);
        trackNamedEvent('paywall_show', { source: 'reading_submit_error' });
        await refreshPointsBalance();
      }
      setError(msg || '占卜失败，请稍后重试');
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
      soothe:
        `谢谢你把这些感受带来。我们先不着急定结论，先把心慢慢放稳。\n\n` +
        `如果你愿意，可以先说说：此刻最压着你的情绪是什么？`,
      listen:
        `这次我更想先听你，而不是催你马上行动。\n\n` +
        `你最近最反复想到、最放不下的是哪一件事？`,
      clarify:
        `你已经很认真了，也许现在只是信息太多、心有点累。\n\n` +
        `我们先轻轻理一理：你最担心什么？你最想守住什么？`,
    };

    const supportChoiceLine =
      `\n\n你也可以直接告诉我，你此刻更需要哪种陪伴：` +
      `\n1）先安慰我` +
      `\n2）先听我讲` +
      `\n3）帮我理清楚`;

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

  if (result) {
    const movingLines = result.hexagram.lines.filter((line) => line === '6' || line === '9').length;
    const confidence = Math.max(62, Math.min(92, 88 - movingLines * 6 + (result.hexagram.original === result.hexagram.changed ? 4 : 0)));

    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.sectionTitle}>🔮 占卜结果</Text>
        <View style={[styles.card, styles.tierCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.tierTitle}>当前解读档位：{readingTierLabel}</Text>
          <Text style={styles.tierDesc}>{readingTierDesc}</Text>
          {!isVip ? <Text style={styles.tierHintInline}>提示：本次结果已解锁，会员用于后续解读免扣与追问。</Text> : null}
        </View>

        {fromFortune && lastFortune && (
          <View style={[styles.card, styles.fromFortuneCard, { backgroundColor: colors.surface }]}>
            <View style={styles.fromFortuneHeader}>
              <Text style={styles.fromFortuneTitle}>🎯 来自本次抽签的深度解读</Text>
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
                  <Text style={styles.fromFortuneToggleText}>{showFortuneSource ? '收起' : '展开'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {showFortuneSource && (
              <>
                <Text style={styles.fromFortuneMeta}>
                  {lastFortune.drawCode ? `签号：${lastFortune.drawCode} · ` : ''}签名：{lastFortune.poem.title}
                </Text>
                {!!lastFortune.mission && (
                  <Text style={styles.fromFortuneHint}>🧩 今日任务：{lastFortune.mission}</Text>
                )}
                {!!lastFortune.funTip && (
                  <Text style={styles.fromFortuneHint}>🎲 趣味提示：{lastFortune.funTip}</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* 一屏结论 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>🧿 一句话结论</Text>
          <Text style={styles.conclusionVerdict}>{result.conclusion?.verdict || result.interpretation.overall}</Text>
          <Text style={styles.conclusionMeta}>
            情绪趋势：{result.conclusion?.emotionalTone || '中性'}  |  置信度：{result.conclusion?.confidence || confidence}%
          </Text>
          <Text style={styles.conclusionNext}>下一步：{result.conclusion?.nextStep || '先稳住节奏，再做决定。'}</Text>
          <TouchableOpacity style={styles.quickChatBtn} onPress={handleDeepConversation}>
            <Text style={styles.quickChatBtnText}>先聊聊我的感受</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleDetailsButton} onPress={() => setShowDetails((v) => !v)}>
            <Text style={styles.toggleDetailsText}>{showDetails ? '收起详细解读' : '展开详细解读'}</Text>
          </TouchableOpacity>
        </View>

        {showDetails && (
          <>
        
        {/* 卦象信息 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.hexagramHeader}>
            <Text style={styles.hexagramName}>{result.hexagram.originalName}</Text>
            <Text style={styles.hexagramOriginal}>本卦：{result.hexagram.original}</Text>
            {result.hexagram.original !== result.hexagram.changed && (
              <Text style={styles.hexagramChanged}>变卦：{result.hexagram.changedName}</Text>
            )}
          </View>
          
          {/* 爻辞 */}
          <View style={styles.yaoContainer}>
            <Text style={styles.yaoTitle}>六爻</Text>
            {result.hexagram.yaoDescriptions.map((yao, idx) => (
              <Text key={idx} style={styles.yaoText}>{yao}</Text>
            ))}
          </View>
        </View>

        {/* 解读 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>📖 解读</Text>
          <Text style={styles.interpretationText}>{result.interpretation.overall}</Text>
          <Text style={styles.interpretationText}>{result.interpretation.situation}</Text>
          <Text style={styles.interpretationText}>{result.interpretation.guidance}</Text>
        </View>

        {/* 结构化解释卡 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>🧭 结构化解释</Text>
          <View style={styles.structCard}>
            <Text style={styles.structTitle}>依据</Text>
            <Text style={styles.structText}>本卦：{result.hexagram.originalName}</Text>
            <Text style={styles.structText}>变卦：{result.hexagram.changedName}</Text>
            <Text style={styles.structText}>动爻数：{movingLines}（越多代表变化越快）</Text>
          </View>
          <View style={styles.structCard}>
            <Text style={styles.structTitle}>建议</Text>
            <Text style={styles.structText}>{result.interpretation.guidance}</Text>
          </View>
          <View style={styles.structCard}>
            <Text style={styles.structTitle}>风险</Text>
            <Text style={styles.structText}>⚠️ {result.timing.caution}</Text>
          </View>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>解读置信度</Text>
            <Text style={styles.confidenceValue}>{confidence}%</Text>
          </View>
        </View>

        {/* 建议 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>💡 建议</Text>
          {result.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recItem}>
              <Text style={styles.recNumber}>{idx + 1}</Text>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* 时机 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>⏰ 时机判断</Text>
          <Text style={styles.timingText}>✅ {result.timing.suitable}</Text>
          <Text style={styles.timingText}>⚠️ {result.timing.caution}</Text>
        </View>

        {/* 情绪承接与深聊 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>🤍 先把心放稳一点</Text>
          <Text style={styles.supportText}>
            这份解读不是在催你立刻行动，而是陪你把感受理顺。你可以先说情绪，再一起慢慢看下一步。
          </Text>
          <TouchableOpacity style={styles.deepChatButton} onPress={handleDeepConversation}>
            <Text style={styles.deepChatButtonText}>和我聊聊现在的感受</Text>
          </TouchableOpacity>
          <Text style={styles.supportHint}>会自动承接当前解读，不需要你重复描述。</Text>
        </View>
          </>
        )}

        <AccuracyFeedback
          category="divination_reading"
          context={{ category, questionPreview: question.trim().slice(0, 80) }}
        />

        {/* 再次占卜 */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>再次占卜</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <Text style={styles.sectionTitle}>🔮 深度解读</Text>
      <View style={[styles.card, styles.tierCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.tierTitle}>解读档位对比</Text>
        <Text style={styles.tierLine}>简版：一句结论 + 基础建议（适合快速判断）</Text>
        <Text style={styles.tierLine}>完整版：本卦/变卦/动爻拆解 + 三条行动建议</Text>
        <Text style={styles.tierLine}>深度版：逐句回应你的问题 + 风险拆解 + 追问模式</Text>
        {!isVip && (
          <TouchableOpacity
            style={styles.tierUpgradeBtn}
            onPress={() => {
              trackNamedEvent('plan_select', { plan: 'vip', source: 'reading_tier_card' });
              router.push({ pathname: '/(tabs)/points', params: { focus: 'vip' } });
            }}
          >
            <Text style={styles.tierUpgradeText}>立即解锁当前结果（可继续追问）</Text>
          </TouchableOpacity>
        )}
      </View>

      {fromFortune && lastFortune && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>🧿 抽签免费摘要</Text>
          <Text style={styles.featureText}>签名：{lastFortune.poem.title}</Text>
          {lastFortune.drawCode ? <Text style={styles.featureText}>签号：{lastFortune.drawCode}</Text> : null}
          <Text style={styles.featureText}>今日：{lastFortune.day}</Text>
          <Text style={styles.hint}>{lastFortune.interpretation?.overall || '已为你带入本次抽签结果。'}</Text>
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
                {isVip ? '解锁深度解签（会员免扣）' : `解锁深度解签（${readingPointsCost} 积分）`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.hint}>
          {`将心中困惑如实道来，字数不限，可附加时间、人物或地点，以便匹配更精准的卦象。${
            isVip ? '当前会员有效期内免扣积分。' : `免费用户本次 ${readingPointsCost} 积分。`
          }`}
        </Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="例：我即将换工作，但对新团队心里没底，也担心签证问题..."
          placeholderTextColor="#6F6287"
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        {/* 分类选择 */}
        <Text style={styles.categoryLabel}>选择占卜类型</Text>
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
          <Text style={styles.billingPreviewText}>
            {isVip
              ? `本次将扣：会员免扣 · 当前余额：${availablePoints ?? '--'}`
              : `本次将扣：${readingPointsCost} 积分 · 当前余额：${availablePoints ?? '--'}`}
          </Text>
        </View>

        {showSmartCta && !isVip && (
          <View style={styles.smartCtaWrap}>
            <Text style={styles.smartCtaTitle}>余额不足，建议优先补充权益</Text>
            <Text style={styles.smartCtaHint}>
              {`按每周约 5 次测算，深度解签本月约需 ${projectedMonthlyPoints} 积分（约 ${projectedCheckinDays} 天签到）。`}
            </Text>
            <View style={styles.smartCtaActions}>
              <TouchableOpacity style={styles.smartCtaPrimary} onPress={openPointsMallWithTrack}>
                <Text style={styles.smartCtaPrimaryText}>去充值积分</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smartCtaSecondary} onPress={openVipPlanWithTrack}>
                <Text style={styles.smartCtaSecondaryText}>开会员更划算</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={styles.submitButtonText}>开始解读</Text>
          )}
        </TouchableOpacity>
        
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSubmit}
              disabled={isLoading}>
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* 说明 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.cardTitle}>📋 解读包含内容</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 卦象摘要：六爻起卦 + 变爻提示</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 多维解读：事业 / 情感 / 心理</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 行动建议：下一步可执行的三条建议</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 文化溯源：相关典籍出处与启发</Text>
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
    color: '#F8D05F',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  tierCard: {
    borderColor: '#5A417F',
    borderWidth: 1,
  },
  tierTitle: {
    color: '#F8D05F',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierDesc: {
    color: '#CFC6DE',
    fontSize: 13,
    lineHeight: 20,
  },
  tierLine: {
    color: '#CFC6DE',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 6,
  },
  tierUpgradeBtn: {
    marginTop: 10,
    backgroundColor: '#F8D05F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F8D05F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tierUpgradeText: {
    color: '#1A0A18',
    fontSize: 13,
    fontWeight: '700',
  },
  tierHintInline: {
    marginTop: 8,
    color: '#A99EC2',
    fontSize: 12,
    lineHeight: 18,
  },
  fromFortuneCard: {
    borderColor: '#5E4591',
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
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '700',
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#2B1F46',
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  rankBadgeText: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '700',
  },
  fromFortuneToggle: {
    backgroundColor: '#2F2450',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4A3C6D',
  },
  fromFortuneToggleText: {
    color: '#CFC6DE',
    fontSize: 11,
    fontWeight: '700',
  },
  fromFortuneMeta: {
    color: '#B9ACD3',
    fontSize: 13,
    marginBottom: 8,
  },
  fromFortuneHint: {
    color: '#CFC6DE',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  hint: {
    color: '#8D8DAA',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1A1328',
    borderRadius: 16,
    padding: 16,
    color: '#F7F6F0',
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#322243',
    marginBottom: 16,
  },
  categoryLabel: {
    color: '#B2B4C8',
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
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#322243',
  },
  categoryButtonActive: {
    backgroundColor: '#4C2F80',
    borderColor: '#F8D05F',
  },
  categoryText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#F8D05F',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  submitButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
  billingPreviewBar: {
    marginTop: 12,
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
  smartCtaWrap: {
    marginBottom: 4,
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
    backgroundColor: '#4C2F80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  retryButtonText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingHint: {
    color: '#1A0A18',
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
    color: '#F8D05F',
    marginBottom: 8,
  },
  hexagramOriginal: {
    color: '#B2B4C8',
    fontSize: 16,
  },
  hexagramChanged: {
    color: '#C8A6FF',
    fontSize: 16,
    marginTop: 4,
  },
  yaoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
    paddingTop: 16,
  },
  yaoTitle: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  yaoText: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 16,
  },
  interpretationText: {
    color: '#F7F6F0',
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
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  recText: {
    color: '#B2B4C8',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  timingText: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#4C2F80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  structCard: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#322243',
    padding: 12,
    marginBottom: 10,
  },
  structTitle: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  structText: {
    color: '#B9B3C9',
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
    borderTopColor: '#2F2342',
  },
  confidenceLabel: {
    color: '#9C95AD',
    fontSize: 13,
  },
  confidenceValue: {
    color: '#F8D05F',
    fontSize: 15,
    fontWeight: 'bold',
  },
  supportText: {
    color: '#BDB6CC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  deepChatButton: {
    backgroundColor: '#6D50A6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  deepChatButtonText: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
  supportHint: {
    color: '#8E84A3',
    fontSize: 12,
  },
  conclusionVerdict: {
    color: '#F7F6F0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  conclusionMeta: {
    color: '#A99EC2',
    fontSize: 13,
    marginBottom: 8,
  },
  conclusionNext: {
    color: '#CFC6DE',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  toggleDetailsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2F2450',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChatBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#604493',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  quickChatBtnText: {
    color: '#F7F6F0',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleDetailsText: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '600',
  },
});
