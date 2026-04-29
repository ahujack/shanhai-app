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

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<PaymentProduct[]>([]);
  const [points, setPoints] = useState<PaymentProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await paymentApi.getProducts();
      setSubs(list.filter((p) => p.type === 'subscription' && p.isActive));
      setPoints(list.filter((p) => p.type === 'points' && p.isActive));
    } catch {
      setError('暂时无法加载价格，请稍后重试或联系客服。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await paymentApi.getProducts();
        if (cancelled) return;
        setSubs(list.filter((p) => p.type === 'subscription' && p.isActive));
        setPoints(list.filter((p) => p.type === 'points' && p.isActive));
      } catch {
        if (!cancelled) setError('暂时无法加载价格，请稍后重试或联系客服。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>价格说明</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          以下为山海灵境当前在售的数字化产品标价（含税费以支付页为准）。购买与退款规则见服务条款。
        </Text>
        <TouchableOpacity onPress={() => router.push('/terms')} style={[styles.termsBtn, webPointer]}>
          <Text style={styles.leadLink}>查看服务条款 →</Text>
        </TouchableOpacity>

        <Text style={styles.supportLine}>
          客服邮箱（与商户信息一致）：
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
              <Text style={styles.retryBtnText}>重新加载</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>会员订阅</Text>
            {subs.length === 0 ? (
              <Text style={styles.empty}>暂无订阅商品或稍后更新。</Text>
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

            <Text style={styles.sectionTitle}>积分充值</Text>
            {points.length === 0 ? (
              <Text style={styles.empty}>暂无积分包或稍后更新。</Text>
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
          实际扣款币种与金额以结账页面（Creem 等支付通道）展示为准；促销或调价将在本页或应用内同步更新。
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/points' as any)} style={[styles.gotoMallBtn, webPointer]}>
          <Text style={styles.gotoMallText}>前往灵石页购买</Text>
        </TouchableOpacity>

        <SiteComplianceFooter variant="full" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(248, 208, 95, 0.2)',
  },
  backBtn: {
    minWidth: 64,
    paddingVertical: 6,
  },
  backText: {
    color: '#F8D05F',
    fontSize: 16,
  },
  pageTitle: {
    color: '#F7F6F0',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lead: {
    color: '#C4B8DC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  termsBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  leadLink: {
    color: '#F8D05F',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  supportLine: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 20,
  },
  supportEmail: {
    color: '#F8D05F',
    fontWeight: '700',
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF8A80',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F8D05F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  retryBtnText: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  empty: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#161126',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.2)',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  cardName: {
    color: '#F7F6F0',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardPrice: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: '#B8A8D8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardMeta: {
    color: '#6F6287',
    fontSize: 12,
    lineHeight: 18,
  },
  note: {
    color: '#6F6287',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 8,
  },
  gotoMallBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  gotoMallText: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '700',
  },
});
