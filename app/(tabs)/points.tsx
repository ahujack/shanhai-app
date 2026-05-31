import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import {
  paymentApi,
  PaymentProduct,
  CheckoutResult,
  pointsApi,
  PointsSummary,
  PointRecord,
  BillingRules,
  userApi,
  chartApi,
} from '../../src/services/api';
import { membershipExpiryDate, isMembershipActive } from '../../src/utils/membership';
import { trackNamedEvent } from '../../src/services/analytics';

const colors = theme.dark;
const ui = {
  bg: '#0B0D14',
  card: '#121827',
  panel: '#1A2233',
  border: '#2A3448',
  text: '#E8ECF3',
  textSub: '#AAB3C5',
  gold: '#D6B36A',
  primary: '#7C6CFF',
};

const formatUsd = (price: number) => {
  const n = Number(price);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
};

const DAILY_CHECKIN_POINTS = 10;

const MEMBERSHIP_RENEWAL_NUDGE_KEY = 'shanhai_membership_renewal_nudge';

function formatMembershipExpiryZh(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** 与后端 PointRecord.type 常见取值对齐，便于列表展示 */
const POINT_RECORDS_LIMIT = 30;
const POINT_TYPE_LABELS: Record<string, string> = {
  checkin: '签到',
  reward: '奖励',
  recharge: '充值入账',
  referral_bonus: '受邀奖励',
  referral_reward: '邀请好友',
  register_bonus: '注册奖励',
  achievement: '成就奖励',
  exchange: '兑换消耗',
  draw: '占卜消耗',
  zi: '测字消耗',
  reading: '解读消耗',
  chart: '八字/命盘',
};

function labelPointType(type: string): string {
  if (!type) return '其他';
  return POINT_TYPE_LABELS[type] ?? type;
}

function formatPointRecordTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBestPointUnitPrice(products: PaymentProduct[]): number | null {
  const unitPrices = products
    .filter((p) => p.type === 'points' && p.points > 0 && p.price > 0)
    .map((p) => p.price / p.points)
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!unitPrices.length) return null;
  return Math.min(...unitPrices);
}

function calcBreakEvenRuns(productPrice: number, actionCostPoints: number, pointUnitPrice: number | null): number | null {
  if (!Number.isFinite(productPrice) || productPrice <= 0) return null;
  if (!Number.isFinite(actionCostPoints) || actionCostPoints <= 0) return null;
  if (!pointUnitPrice || !Number.isFinite(pointUnitPrice) || pointUnitPrice <= 0) return null;
  const perRunCost = actionCostPoints * pointUnitPrice;
  if (!Number.isFinite(perRunCost) || perRunCost <= 0) return null;
  return Math.max(1, Math.ceil(productPrice / perRunCost));
}

type TabType = 'subscription' | 'mall';

export default function PointsMallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; tab?: string }>();
  const { user } = useUserStore();
  const scrollRef = React.useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [subscriptionProducts, setSubscriptionProducts] = useState<PaymentProduct[]>([]);
  const [pointsProducts, setPointsProducts] = useState<PaymentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [creemConfigured, setCreemConfigured] = useState(false);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [vipSectionY, setVipSectionY] = useState(0);
  const [highlightVip, setHighlightVip] = useState(false);
  const [renewalNudgeEnabled, setRenewalNudgeEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [billingRules, setBillingRules] = useState<BillingRules | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isPurchasingAny = Boolean(purchasing);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadPointRecords = React.useCallback(async () => {
    if (!user?.id) return;
    setRecordsLoading(true);
    try {
      const list = await pointsApi.getRecords(POINT_RECORDS_LIMIT);
      setPointRecords(list);
    } catch (e) {
      console.error('加载积分流水失败:', e);
      setPointRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [user?.id]);

  const refreshMembershipAndChart = async () => {
    if (!user?.id) return;
    const latestUser = await userApi.get(user.id);
    let latestChart: any = null;
    try {
      const chartResp = await chartApi.get(user.id);
      if (chartResp.hasChart && chartResp.chart) {
        latestChart = chartResp.chart;
      }
    } catch {
      latestChart = null;
    }
    useUserStore.setState((state) => ({
      user: latestUser,
      chart: latestChart ?? state.chart,
      hasChart: latestChart ? true : state.hasChart,
    }));
  };

  const pollPaymentCompletion = async (paymentId: string) => {
    for (let i = 0; i < 24; i++) {
      await sleep(2000);
      try {
        const paymentStatus = await paymentApi.getByIdStatus(paymentId);
        if (paymentStatus.status === 'completed') {
          trackNamedEvent('payment_success', {
            source: 'polling',
            productType: paymentStatus.productType,
            paymentId,
          });
          await refreshMembershipAndChart();
          if (paymentStatus.productType === 'subscription') {
            Alert.alert('支付成功', '会员权益已到账，八字高级解读已解锁。');
            router.push({
              pathname: '/(tabs)/bazi',
              params: { highlight: 'master', fromPayment: '1' },
            });
          } else {
            const pts = await pointsApi.getSummary().catch(() => null);
            setPointsSummary(pts);
            Alert.alert('支付成功', '积分已到账！');
            setActiveTab('mall');
          }
          return;
        }
        if (paymentStatus.status === 'failed' || paymentStatus.status === 'refunded') {
          Alert.alert('支付未完成', `当前状态：${paymentStatus.status}`);
          return;
        }
      } catch {
        // 轮询过程中的瞬时错误忽略，继续下一轮
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(MEMBERSHIP_RENEWAL_NUDGE_KEY).then((v) => {
      if (alive) setRenewalNudgeEnabled(v === '1');
    });
    return () => {
      alive = false;
    };
  }, []);

  const setRenewalNudgePreference = async (enabled: boolean) => {
    setRenewalNudgeEnabled(enabled);
    await AsyncStorage.setItem(MEMBERSHIP_RENEWAL_NUDGE_KEY, enabled ? '1' : '0');
  };

  const onPullRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
      await refreshMembershipAndChart();
      if (recordsExpanded) {
        await loadPointRecords();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const tab = params.tab as TabType | undefined;
    const focusVip = params.focus === 'vip';
    if (focusVip) {
      trackNamedEvent('paywall_show', { source: 'points_focus_vip' });
    }
    if (tab === 'mall') setActiveTab('mall');
    else if (tab === 'subscription' || focusVip) setActiveTab('subscription');
  }, [params.tab, params.focus]);

  useEffect(() => {
    if (params.focus !== 'vip') return;
    setHighlightVip(true);
    const timer = setTimeout(() => setHighlightVip(false), 8000);
    return () => clearTimeout(timer);
  }, [params.focus]);

  useEffect(() => {
    if (!highlightVip || !vipSectionY) return;
    scrollRef.current?.scrollTo({ y: Math.max(vipSectionY - 20, 0), animated: true });
  }, [highlightVip, vipSectionY]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [productsData, statusData, pointsData, rulesData] = await Promise.all([
        paymentApi.getProducts(),
        paymentApi.getStatus(),
        user ? pointsApi.getSummary().catch(() => null) : Promise.resolve(null),
        pointsApi.getRules().catch(() => null),
      ]);
      setSubscriptionProducts(productsData.filter((p: PaymentProduct) => p.type === 'subscription'));
      setPointsProducts(productsData.filter((p: PaymentProduct) => p.type === 'points'));
      const paymentStatus = statusData as { creemConfigured?: boolean; stripeConfigured?: boolean };
      const paymentConfigured = paymentStatus.creemConfigured ?? paymentStatus.stripeConfigured ?? false;
      setCreemConfigured(paymentConfigured);
      setPointsSummary(pointsData);
      setBillingRules(rulesData);
    } catch (error) {
      console.error('Failed to load products:', error);
      setLoadError('加载支付商品失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  const parseProductFeatures = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    } catch {
      return [];
    }
  };

  const handlePurchase = async (product: PaymentProduct) => {
    if (!user) {
      Alert.alert('提示', '请先登录');
      router.push('/login');
      return;
    }

    try {
      setPurchasing(product.id);
      trackNamedEvent('checkout_start', {
        productId: product.id,
        productCode: product.code,
        productType: product.type,
        price: product.price,
      });
      
      const result: CheckoutResult = await paymentApi.createCheckout(product.id);
      
      if (result.mock) {
        const isSubscription = product.type === 'subscription';
        Alert.alert(
          '测试模式',
          `Creem 未配置，这是一个模拟支付。\n\n产品: ${product.name}\n价格: $${formatUsd(product.price)}`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '模拟支付成功',
              onPress: async () => {
                try {
                  await paymentApi.mockPayment(result.paymentId);
                  trackNamedEvent('payment_success', {
                    source: 'mock',
                    productType: product.type,
                    productId: product.id,
                    paymentId: result.paymentId,
                  });
                  await refreshMembershipAndChart();
                  if (isSubscription) {
                    Alert.alert('成功', 'VIP会员已开通！');
                    router.push({
                      pathname: '/(tabs)/bazi',
                      params: { highlight: 'master', fromPayment: '1' },
                    });
                  } else {
                    const pts = await pointsApi.getSummary().catch(() => null);
                    setPointsSummary(pts);
                    Alert.alert('成功', '积分已到账！');
                    setActiveTab('mall');
                  }
                } catch (e) {
                  Alert.alert('错误', '支付处理失败');
                }
              },
            },
          ]
        );
      } else if (result.url) {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.location.assign(result.url);
          }
          if (result.paymentId) {
            pollPaymentCompletion(result.paymentId).catch(() => null);
          }
        } else {
          const supported = await Linking.canOpenURL(result.url);
          if (supported) {
            await Linking.openURL(result.url);
            if (result.paymentId) {
              pollPaymentCompletion(result.paymentId).catch(() => null);
            }
          } else {
            Alert.alert('提示', `请在浏览器中打开: ${result.url}`);
          }
        }
      } else {
        Alert.alert('暂时无法发起支付', '收银台链接生成失败，请稍后重试或联系客服。');
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      const rawMessage = String(error?.message || '');
      const friendlyMessage = /配置异常|not configured|checkout/i.test(rawMessage)
        ? '支付服务正在维护中，请稍后重试。若持续失败，请联系客服 support@shanhai.app。'
        : rawMessage || '支付失败';
      Alert.alert('支付未完成', friendlyMessage);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const tierVip = user?.membership === 'vip' || user?.membership === 'premium';
  const membershipActive = isMembershipActive(user);
  const expiredTier = tierVip && !membershipActive;
  const expiryZh = formatMembershipExpiryZh(user?.membershipExpiryAt ?? undefined);
  const readingCost = billingRules?.costs?.reading ?? 15;
  const ziCost = billingRules?.costs?.zi ?? 10;
  const bestPointUnitPrice = getBestPointUnitPrice(pointsProducts);
  const vipMonthly = subscriptionProducts.find((p) => p.code === 'vip_monthly');
  const vipYearly = subscriptionProducts.find((p) => p.code === 'vip_yearly');
  const recommendedPlanCode = vipYearly?.code || vipMonthly?.code || null;
  const monthlyBreakEvenReading = calcBreakEvenRuns(vipMonthly?.price ?? 0, readingCost, bestPointUnitPrice);
  const monthlyBreakEvenZi = calcBreakEvenRuns(vipMonthly?.price ?? 0, ziCost, bestPointUnitPrice);
  const yearlyBreakEvenReading = calcBreakEvenRuns(vipYearly?.price ?? 0, readingCost, bestPointUnitPrice);
  const yearlyBreakEvenZi = calcBreakEvenRuns(vipYearly?.price ?? 0, ziCost, bestPointUnitPrice);
  const monthlyReadingPoints = readingCost * 20;
  const monthlyReadingCheckinDays = Math.ceil(monthlyReadingPoints / DAILY_CHECKIN_POINTS);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab 切换 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscription' && styles.tabActive]}
          onPress={() => {
            setActiveTab('subscription');
            trackNamedEvent('plan_select', { plan: 'subscription_tab', source: 'points_tabs' });
          }}
        >
          <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>
            👑 订阅
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mall' && styles.tabActive]}
          onPress={() => {
            setActiveTab('mall');
            trackNamedEvent('plan_select', { plan: 'points_tab', source: 'points_tabs' });
          }}
        >
          <Text style={[styles.tabText, activeTab === 'mall' && styles.tabTextActive]}>
            🎁 积分商城
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.topHintBanner}>
          <Text style={styles.topHintText}>
            {activeTab === 'subscription'
              ? '订阅更适合高频用户：稳定拿到深度结果，减少单次决策成本。'
              : '积分适合低频灵活补充：按次付费，先小额验证价值。'}
          </Text>
        </View>

        {loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity style={styles.errorBannerBtn} onPress={loadProducts}>
              <Text style={styles.errorBannerBtnText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'subscription' ? (
          <>
            {/* VIP状态卡片 */}
            <View style={[styles.vipCard, membershipActive && styles.vipCardActive, expiredTier && styles.vipCardExpired]}>
              <View style={styles.vipCardContent}>
                <Text style={styles.vipIcon}>👑</Text>
                <View style={styles.vipInfo}>
                  <Text style={styles.vipTitle}>
                    {membershipActive ? 'VIP 会员' : expiredTier ? '会员已过期' : '普通用户'}
                  </Text>
                  <Text style={styles.vipSubtitle}>
                    {membershipActive
                      ? expiryZh
                        ? `有效期至：${expiryZh}`
                        : '会员权益生效中'
                      : expiredTier
                        ? '请于下方续费以恢复 VIP 权益'
                        : '开通VIP，解锁全部功能'}
                  </Text>
                </View>
              </View>
              {membershipActive && (
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>已开通</Text>
                </View>
              )}
            </View>

            <View style={styles.renewalCard}>
              <Text style={styles.renewalTitle}>续费说明</Text>
              <Text style={styles.renewalBody}>
                当前为单次购买：支付成功后获得对应时长，到期前需手动续订。支付平台侧「自动扣款 / 自动续订」若后续开放，将在此处提供开关。
              </Text>
              <View style={styles.renewalRow}>
                <View style={styles.renewalRowTextWrap}>
                  <Text style={styles.renewalRowTitle}>到期续费提醒</Text>
                  <Text style={styles.renewalRowSub}>在本机记录偏好，便于后续在应用内提醒你（不涉及自动扣款）。</Text>
                </View>
                <Switch
                  value={renewalNudgeEnabled}
                  onValueChange={setRenewalNudgePreference}
                  trackColor={{ false: '#3d3d5c', true: 'rgba(248, 208, 95, 0.45)' }}
                  thumbColor={renewalNudgeEnabled ? colors.accent : '#888'}
                />
              </View>
            </View>

            <View style={styles.memberValueCard}>
              <Text style={styles.memberValueTitle}>🌟 会员专属价值</Text>
              <View style={styles.memberValueList}>
                <Text style={styles.memberValueItem}>• 八字老师傅批注（会员专属，当前不支持单次积分解锁）</Text>
                <Text style={styles.memberValueItem}>• 测字甲骨文完整异体图与差异解读（会员可解锁）</Text>
                <Text style={styles.memberValueItem}>• 测字/深度解签按规则免扣积分，适合高频用户</Text>
              </View>
              <Text style={styles.memberValueFootnote}>
                参考：若每周约 5 次深度解签，月均约需 {monthlyReadingPoints} 积分（约 {monthlyReadingCheckinDays} 天签到）。
              </Text>
            </View>

            {/* VIP 订阅 */}
            <View
              style={[styles.section, highlightVip ? styles.vipSectionHighlight : undefined]}
              onLayout={(event) => setVipSectionY(event.nativeEvent.layout.y)}
            >
              <Text style={styles.sectionTitle}>⭐ VIP 会员</Text>
              <Text style={styles.sectionSubtitle}>开通VIP，享无限次AI解读</Text>
              {highlightVip ? <Text style={styles.focusTip}>👑 推荐：解锁八字老师傅批注与完整流年细化</Text> : null}
              {subscriptionProducts.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateTitle}>订阅商品准备中</Text>
                  <Text style={styles.emptyStateBody}>
                    当前暂无可售订阅，请稍后下拉刷新或联系客服 support@shanhai.app。
                  </Text>
                </View>
              ) : (
                subscriptionProducts.map((product) => {
                const isPurchasing = purchasing === product.id;
                const features = parseProductFeatures(product.features);
                const isRecommended = recommendedPlanCode === product.code;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.vipProductCard, isRecommended && styles.recommendedCard]}
                    onPress={() => handlePurchase(product)}
                    disabled={isPurchasingAny || !user}
                  >
                    <View style={styles.vipProductHeader}>
                      <View style={styles.vipProductNameWrap}>
                        <Text style={styles.vipProductName}>{product.name}</Text>
                        {isRecommended ? <Text style={styles.recommendedTag}>主推</Text> : null}
                      </View>
                      <Text style={styles.vipProductPrice}>${formatUsd(product.price)}</Text>
                    </View>
                    <Text style={styles.vipProductDesc}>{product.description}</Text>
                    <View style={styles.featuresList}>
                      {features.map((feature: string, index: number) => (
                        <View key={index} style={styles.featureItem}>
                          <Text style={styles.featureIcon}>✓</Text>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.subscribeButton, (isPurchasingAny || !user) && styles.subscribeButtonDisabled]}
                      onPress={() => handlePurchase(product)}
                      disabled={isPurchasingAny || !user}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          {!user ? '请先登录' : membershipActive ? '续费并保持权益' : '升级解锁专业能力'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
              )}
            </View>
          </>
        ) : (
          <>
            {/* 积分余额 */}
            <View style={styles.pointsBalanceCard}>
              <Text style={styles.pointsBalanceLabel}>当前积分</Text>
              <Text style={styles.pointsBalanceValue}>{pointsSummary?.availablePoints ?? 0}</Text>
              {user ? (
                <Text style={styles.pointsBalanceSub}>
                  累计获得 {pointsSummary?.totalEarned ?? 0} · 累计消耗 {pointsSummary?.totalSpent ?? 0}
                </Text>
              ) : (
                <Text style={styles.pointsBalanceSub}>登录后可查看收支汇总与流水</Text>
              )}
            </View>

            {user ? (
              <View style={styles.ledgerCard}>
                <TouchableOpacity
                  style={styles.ledgerHeader}
                  activeOpacity={0.75}
                  onPress={() => {
                    const next = !recordsExpanded;
                    setRecordsExpanded(next);
                    if (next) {
                      void loadPointRecords();
                    }
                  }}
                >
                  <View style={styles.ledgerHeaderTextWrap}>
                    <Text style={styles.ledgerTitle}>📒 收支明细</Text>
                    <Text style={styles.ledgerSubtitle}>
                      {recordsExpanded ? '点击收起' : `展开查看最近 ${POINT_RECORDS_LIMIT} 笔流水`}
                    </Text>
                  </View>
                  <Text style={styles.ledgerChevron}>{recordsExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {recordsExpanded ? (
                  recordsLoading ? (
                    <ActivityIndicator color={colors.accent} style={styles.ledgerSpinner} />
                  ) : pointRecords.length === 0 ? (
                    <Text style={styles.ledgerEmpty}>暂无流水（消费/奖励入账后会出现在这里）</Text>
                  ) : (
                    <View style={styles.ledgerList}>
                      {pointRecords.map((r) => (
                        <View key={r.id} style={styles.ledgerRow}>
                          <View style={styles.ledgerRowLeft}>
                            <Text style={styles.ledgerRowTitle} numberOfLines={2}>
                              {(r.description && r.description.trim()) || labelPointType(r.type)}
                            </Text>
                            <Text style={styles.ledgerRowMeta}>
                              {labelPointType(r.type)} · {formatPointRecordTime(r.createdAt)}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.ledgerPoints,
                              r.points >= 0 ? styles.ledgerPointsIn : styles.ledgerPointsOut,
                            ]}
                          >
                            {r.points >= 0 ? '+' : ''}
                            {r.points}
                          </Text>
                        </View>
                      ))}
                      <Text style={styles.ledgerFootnote}>仅展示最近 {POINT_RECORDS_LIMIT} 条，完整对账以服务端记录为准。</Text>
                    </View>
                  )
                ) : null}
              </View>
            ) : null}

            <View style={styles.mallExplainCard}>
              <Text style={styles.mallExplainTitle}>订阅 和 积分 怎么选？</Text>
              <Text style={styles.mallExplainBody}>
                <Text style={styles.mallExplainEm}>VIP 订阅</Text>
                ：在会员有效期内，按规则使用测字、占卜可免扣积分，且可解锁部分会员专属能力，适合高频用户。
                {'\n\n'}
                <Text style={styles.mallExplainEm}>积分充值</Text>
                ：单次付费、按次扣积分，灵活但高频成本会逐步上升；适合偶尔使用或临时补单。
                {'\n\n'}
                积分包需在支付平台（Creem）里各建一个「一次性付款」商品，并把产品 ID 配到服务器环境变量后，下方购买才会跳转收银台。
              </Text>
            </View>

            <View style={styles.mallExplainCard}>
              <Text style={styles.mallExplainTitle}>📐 价值换算（按当前最优惠积分包）</Text>
              <Text style={styles.mallExplainBody}>
                <Text style={styles.mallExplainEm}>月卡回本：</Text>
                {monthlyBreakEvenReading != null && monthlyBreakEvenZi != null
                  ? `深度解签约 ${monthlyBreakEvenReading} 次/月，或测字约 ${monthlyBreakEvenZi} 次/月。`
                  : '当前缺少积分包价格，暂无法测算。'}
                {'\n\n'}
                <Text style={styles.mallExplainEm}>年卡回本：</Text>
                {yearlyBreakEvenReading != null && yearlyBreakEvenZi != null
                  ? `深度解签约 ${yearlyBreakEvenReading} 次/年，或测字约 ${yearlyBreakEvenZi} 次/年。`
                  : '当前缺少积分包价格，暂无法测算。'}
                {'\n\n'}
                {bestPointUnitPrice != null
                  ? `折算单价约 $${bestPointUnitPrice.toFixed(4)}/积分。`
                  : '提示：接入积分包后会自动更新换算结果。'}
              </Text>
            </View>

            {/* 积分获取 */}
            <View style={styles.pointsCard}>
              <Text style={styles.pointsTitle}>📝 积分获取方式</Text>
              <View style={styles.pointsList}>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>📅</Text>
                  <Text style={styles.pointText}>每日签到 +10 积分</Text>
                </View>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>📤</Text>
                  <Text style={styles.pointText}>分享解读 +5 积分</Text>
                </View>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>👥</Text>
                  <Text style={styles.pointText}>邀请好友 +50 积分</Text>
                </View>
              </View>
            </View>

            {/* 积分消耗说明 */}
            <View style={styles.pointsCard}>
              <Text style={styles.pointsTitle}>💡 积分消耗规则</Text>
              <View style={styles.pointsList}>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>✍️</Text>
                  <Text style={styles.pointText}>测字 {billingRules?.costs?.zi ?? 10} 积分/次（会员免扣）</Text>
                </View>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>🔮</Text>
                  <Text style={styles.pointText}>抽签免费，深度解签 {billingRules?.costs?.reading ?? 15} 积分/次（会员免扣）</Text>
                </View>
                <View style={styles.pointItem}>
                  <Text style={styles.pointIcon}>📊</Text>
                  <Text style={styles.pointText}>八字老师傅批注：会员权益（当前不支持单次积分解锁）</Text>
                </View>
                {!billingRules?.gateEnabled && (
                  <View style={styles.pointItem}>
                    <Text style={styles.pointIcon}>🧪</Text>
                    <Text style={styles.pointText}>当前积分门闸处于测试关闭状态，实际不会扣积分。</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 积分包购买 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛒 购买积分</Text>
              <Text style={styles.sectionSubtitle}>充值积分，解锁更多解读</Text>
              {pointsProducts.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateTitle}>积分包暂未上架</Text>
                  <Text style={styles.emptyStateBody}>
                    可以先通过签到和邀请获取积分，或稍后再来购买积分包。
                  </Text>
                </View>
              ) : (
                pointsProducts.map((product) => {
                const isPurchasing = purchasing === product.id;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.vipProductCard}
                    onPress={() => handlePurchase(product)}
                    disabled={isPurchasingAny || !user}
                  >
                    <View style={styles.vipProductHeader}>
                      <Text style={styles.vipProductName}>{product.name}</Text>
                      <Text style={styles.vipProductPrice}>${formatUsd(product.price)}</Text>
                    </View>
                    <Text style={styles.vipProductDesc}>{product.description}</Text>
                    <TouchableOpacity
                      style={[styles.subscribeButton, (isPurchasingAny || !user) && styles.subscribeButtonDisabled]}
                      onPress={() => handlePurchase(product)}
                      disabled={isPurchasingAny || !user}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          {!user ? '请先登录' : '购买并立即到账'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
              )}
            </View>
          </>
        )}

        {!creemConfigured && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ Creem 未配置，当前为测试模式</Text>
          </View>
        )}

        <TouchableOpacity style={styles.pricingLinkWrap} onPress={() => router.push('/pricing')} activeOpacity={0.7}>
          <Text style={styles.pricingLinkText}>📋 价格公示：查看全站明码标价与说明</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: ui.card,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: ui.panel,
  },
  tabText: {
    fontSize: 14,
    color: ui.textSub,
  },
  tabTextActive: {
    color: ui.gold,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  topHintBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card,
  },
  topHintText: {
    color: ui.textSub,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  pointsBalanceCard: {
    margin: 16,
    marginBottom: 8,
    padding: 24,
    backgroundColor: ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
  },
  pointsBalanceLabel: {
    fontSize: 14,
    color: ui.textSub,
    marginBottom: 4,
  },
  pointsBalanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: ui.gold,
  },
  pointsBalanceSub: {
    marginTop: 10,
    fontSize: 12,
    color: ui.textSub,
    textAlign: 'center',
  },
  ledgerCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: 'hidden',
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ledgerHeaderTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.text,
  },
  ledgerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: ui.textSub,
  },
  ledgerChevron: {
    fontSize: 12,
    color: ui.gold,
  },
  ledgerSpinner: {
    marginVertical: 16,
  },
  ledgerList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: ui.border,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  ledgerRowLeft: {
    flex: 1,
    marginRight: 10,
  },
  ledgerRowTitle: {
    fontSize: 14,
    color: ui.text,
    lineHeight: 20,
  },
  ledgerRowMeta: {
    marginTop: 4,
    fontSize: 11,
    color: ui.textSub,
  },
  ledgerPoints: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
  ledgerPointsIn: {
    color: '#7CFCA7',
  },
  ledgerPointsOut: {
    color: '#FFB4A8',
  },
  ledgerEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 13,
    color: ui.textSub,
    borderTopWidth: 1,
    borderTopColor: ui.border,
  },
  ledgerFootnote: {
    marginTop: 10,
    fontSize: 11,
    color: '#5C5C78',
    lineHeight: 16,
  },
  mallExplainCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  mallExplainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.text,
    marginBottom: 8,
  },
  mallExplainBody: {
    fontSize: 13,
    lineHeight: 21,
    color: ui.textSub,
  },
  mallExplainEm: {
    color: ui.gold,
    fontWeight: '600',
  },
  vipCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    backgroundColor: ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
  },
  vipCardActive: {
    backgroundColor: ui.panel,
    borderColor: ui.gold,
    shadowColor: ui.gold,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  vipCardExpired: {
    borderColor: '#8D6B4A',
    opacity: 0.95,
  },
  renewalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  renewalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.text,
    marginBottom: 8,
  },
  renewalBody: {
    fontSize: 13,
    lineHeight: 20,
    color: ui.textSub,
    marginBottom: 14,
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  renewalRowTextWrap: {
    flex: 1,
  },
  renewalRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.text,
  },
  renewalRowSub: {
    fontSize: 12,
    color: ui.textSub,
    marginTop: 4,
    lineHeight: 18,
  },
  memberValueCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  memberValueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ui.text,
    marginBottom: 10,
  },
  memberValueList: {
    gap: 8,
  },
  memberValueItem: {
    fontSize: 13,
    color: ui.textSub,
    lineHeight: 20,
  },
  memberValueFootnote: {
    marginTop: 10,
    fontSize: 12,
    color: ui.textSub,
    lineHeight: 18,
  },
  vipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  vipInfo: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ui.gold,
  },
  vipSubtitle: {
    fontSize: 14,
    color: ui.textSub,
    marginTop: 4,
  },
  vipBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2E6A57',
    borderRadius: 12,
  },
  vipBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ui.text,
    marginBottom: 12,
  },
  pointsList: {
    gap: 10,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointIcon: {
    fontSize: 16,
    width: 28,
  },
  pointText: {
    fontSize: 14,
    color: ui.textSub,
  },
  pointsUsage: {
    marginTop: 12,
    fontSize: 12,
    color: '#8D8DAA',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  vipSectionHighlight: {
    borderWidth: 1,
    borderColor: ui.gold,
    borderRadius: 12,
    marginHorizontal: 10,
    backgroundColor: ui.panel,
  },
  focusTip: {
    color: ui.gold,
    fontSize: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ui.gold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: ui.textSub,
    marginBottom: 16,
  },
  vipProductCard: {
    backgroundColor: ui.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ui.border,
  },
  recommendedCard: {
    borderColor: ui.gold,
    shadowColor: ui.gold,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vipProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vipProductNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  vipProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ui.text,
  },
  recommendedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: ui.gold,
    color: ui.bg,
    fontSize: 10,
    fontWeight: '700',
  },
  vipProductPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ui.gold,
  },
  vipProductDesc: {
    fontSize: 14,
    color: ui.textSub,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    color: '#4FAF8E',
    fontSize: 14,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: ui.textSub,
  },
  subscribeButton: {
    backgroundColor: ui.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    backgroundColor: '#3A4358',
  },
  subscribeButtonText: {
    color: '#F5F7FB',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    margin: 16,
    padding: 12,
    backgroundColor: '#5A4730',
    borderRadius: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyStateCard: {
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
    marginBottom: 14,
  },
  emptyStateTitle: {
    color: ui.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateBody: {
    color: ui.textSub,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(200, 70, 70, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 130, 130, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    color: '#FFD1D1',
    fontSize: 12,
    lineHeight: 18,
  },
  errorBannerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: ui.panel,
    borderWidth: 1,
    borderColor: ui.border,
  },
  errorBannerBtnText: {
    color: ui.text,
    fontSize: 12,
    fontWeight: '700',
  },
  pricingLinkWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pricingLinkText: {
    color: ui.gold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 40,
  },
});
