import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { paymentApi, PaymentProduct } from '../src/services/api';
import { SiteComplianceFooter, SUPPORT_EMAIL } from '../components/SiteComplianceFooter';
import { trackNamedEvent } from '../src/services/analytics';
import { getGrowthConfig, type GrowthConfig } from '../src/config/growth';
import { useI18nStore } from '../src/store/i18n';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};
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

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<PaymentProduct[]>([]);
  const [points, setPoints] = useState<PaymentProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [growthConfig, setGrowthConfig] = useState<GrowthConfig | null>(null);
  const t = useI18nStore((state) => state.t);

  const loadPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await paymentApi.getProducts();
      setSubs(list.filter((p) => p.type === 'subscription' && p.isActive));
      setPoints(list.filter((p) => p.type === 'points' && p.isActive));
    } catch {
      setError(t('pricing.error.load', '暂时无法加载价格，请稍后重试或联系客服。'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackNamedEvent('paywall_show', { source: 'pricing_page' });
    let cancelled = false;
    (async () => {
      try {
        const list = await paymentApi.getProducts();
        if (cancelled) return;
        setSubs(list.filter((p) => p.type === 'subscription' && p.isActive));
        setPoints(list.filter((p) => p.type === 'points' && p.isActive));
      } catch {
        if (!cancelled) setError(t('pricing.error.load', '暂时无法加载价格，请稍后重试或联系客服。'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getGrowthConfig()
      .then(setGrowthConfig)
      .catch(() => null);
  }, []);

  const formatPrice = (p: PaymentProduct) => {
    const n = Number(p.price);
    if (!Number.isFinite(n)) return '—';
    return `USD $${n.toFixed(2)}`;
  };

  const describeProduct = (p: PaymentProduct) => {
    if (p.type === 'subscription' && p.periodDays) {
      return `订阅周期 ${p.periodDays} 天，含会员权益说明见应用内「灵石」页。`;
    }
    if (p.type === 'points' && p.points) {
      return `购买后可获得 ${p.points} 积分，用于测字、占卜等消耗。`;
    }
    return p.description || '详见应用内说明。';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, webPointer]} hitSlop={12}>
          <Text style={styles.backText}>{t('common.back', '‹ 返回')}</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('pricing.title', '价格说明')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('pricing.hero.title', '让每一次推演都更有分量')}</Text>
          <Text style={styles.heroSub}>
            {t('pricing.hero.sub', '先按次体验，再根据频率选择订阅；把玄学陪伴变成长期稳定的支持。')}
          </Text>
        </View>
        {growthConfig?.showPricingCompareCard !== false ? (
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>{t('pricing.compare.title', '3 秒选方案')}</Text>
            <Text style={styles.compareLine}>{t('pricing.compare.low', '低频（每周 1-2 次）：先选积分包，按次体验最灵活。')}</Text>
            <Text style={styles.compareLine}>{t('pricing.compare.high', '高频（每周 3 次及以上）：优先订阅，省去重复决策和扣分焦虑。')}</Text>
            <Text style={styles.compareLine}>{t('pricing.compare.uncertain', '不确定：先月卡验证，满意后再升级年卡。')}</Text>
          </View>
        ) : null}
        <Text style={styles.lead}>
          {t(
            'pricing.lead',
            '以下为山海灵境当前在售的数字化产品标价（含税费以支付页为准）。购买与退款规则见服务条款。',
          )}
        </Text>
        <TouchableOpacity onPress={() => router.push('/terms')} style={[styles.termsBtn, webPointer]}>
          <Text style={styles.leadLink}>{t('pricing.terms', '查看服务条款 →')}</Text>
        </TouchableOpacity>

        <Text style={styles.supportLine}>
          {t('pricing.support.label', '客服邮箱（与商户信息一致）：')}
          <Text style={styles.supportEmail}> {SUPPORT_EMAIL}</Text>
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F8D05F" />
          </View>
        ) : error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadPricing} style={[styles.retryBtn, webPointer]}>
              <Text style={styles.retryBtnText}>{t('common.retry', '重新加载')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('pricing.section.subscription', '会员订阅')}</Text>
            {subs.length === 0 ? (
              <Text style={styles.empty}>{t('pricing.empty.subscription', '暂无订阅商品或稍后更新。')}</Text>
            ) : (
              subs.map((p) => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardName}>{p.name}</Text>
                    <Text style={styles.cardPrice}>{formatPrice(p)}</Text>
                  </View>
                  {p.description ? <Text style={styles.cardDesc}>{p.description}</Text> : null}
                  <Text style={styles.cardMeta}>{describeProduct(p)}</Text>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>{t('pricing.section.points', '积分充值')}</Text>
            {points.length === 0 ? (
              <Text style={styles.empty}>{t('pricing.empty.points', '暂无积分包或稍后更新。')}</Text>
            ) : (
              points.map((p) => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardName}>{p.name}</Text>
                    <Text style={styles.cardPrice}>{formatPrice(p)}</Text>
                  </View>
                  {p.description ? <Text style={styles.cardDesc}>{p.description}</Text> : null}
                  <Text style={styles.cardMeta}>{describeProduct(p)}</Text>
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.note}>
          {t(
            'pricing.note.1',
            '实际扣款币种与金额以结账页面（Creem 等支付通道）展示为准；促销或调价将在本页或应用内同步更新。',
          )}
        </Text>
        <Text style={styles.note}>
          {t(
            'pricing.note.2',
            `到账通常在 1-3 分钟内完成；若显示异常，可在支付结果页复制订单号联系 ${SUPPORT_EMAIL}。`,
          )}
        </Text>
        <TouchableOpacity
          onPress={() => {
            trackNamedEvent('plan_select', { plan: 'goto_points', source: 'pricing_page' });
            router.push('/(tabs)/points' as any);
          }}
          style={[styles.gotoMallBtn, webPointer]}
        >
          <Text style={styles.gotoMallText}>{t('pricing.goto', '去灵石页，按使用频率选择方案')}</Text>
        </TouchableOpacity>

        <SiteComplianceFooter variant="full" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  backBtn: {
    minWidth: 64,
    paddingVertical: 6,
  },
  backText: {
    color: ui.gold,
    fontSize: 16,
  },
  pageTitle: {
    color: ui.text,
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lead: {
    color: ui.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: ui.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
    marginBottom: 12,
  },
  heroTitle: {
    color: ui.gold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSub: {
    color: ui.textSub,
    fontSize: 13,
    lineHeight: 20,
  },
  compareCard: {
    backgroundColor: ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 12,
    marginBottom: 12,
  },
  compareTitle: {
    color: ui.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  compareLine: {
    color: ui.textSub,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  termsBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  leadLink: {
    color: ui.gold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  supportLine: {
    color: ui.textSub,
    fontSize: 14,
    marginBottom: 20,
  },
  supportEmail: {
    color: ui.gold,
    fontWeight: '700',
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#DCA3A3',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  retryBtnText: {
    color: ui.text,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: ui.gold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  empty: {
    color: ui.textSub,
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: ui.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  cardName: {
    color: ui.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardPrice: {
    color: ui.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: ui.textSub,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardMeta: {
    color: '#94A0B8',
    fontSize: 12,
    lineHeight: 18,
  },
  note: {
    color: '#94A0B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 8,
  },
  gotoMallBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  gotoMallText: {
    color: ui.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
