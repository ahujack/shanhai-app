import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { affiliateApi, type AffiliatePortalSummary } from '../src/services/api';
import { SeoHead } from '../components/SeoHead';
import { SEO_SITE } from '../src/seo/site';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};
const ui = {
  bg: '#0B0D14',
  surface: '#121827',
  panel: '#171E2D',
  border: '#2A3448',
  text: '#E8ECF3',
  sub: '#AAB3C5',
  muted: '#7F8AA3',
  gold: '#D6B36A',
  green: '#4FAF8E',
  red: '#C96A6A',
};

function money(value: number, currency = 'USD') {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${currency.toUpperCase()} $0.00`;
  return `${currency.toUpperCase()} $${n.toFixed(2)}`;
}

function dateLabel(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusLabel(status: string) {
  if (status === 'paid') return '已结算';
  if (status === 'approved') return '待打款';
  if (status === 'void') return '已作废';
  return '待结算';
}

function shortId(id?: string | null) {
  const text = String(id || '');
  if (text.length <= 12) return text || '—';
  return `${text.slice(0, 8)}…${text.slice(-4)}`;
}

export default function PartnerPortalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; token?: string }>();
  const code = String(Array.isArray(params.code) ? params.code[0] : params.code || '');
  const token = String(Array.isArray(params.token) ? params.token[0] : params.token || '');
  const [data, setData] = useState<AffiliatePortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!code || !token) {
      setError('链接缺少推广码或访问密钥，请使用山海灵境提供的专属推广看板链接。');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await affiliateApi.portal(code, token));
    } catch (e: any) {
      setError(e?.message || '暂时无法读取推广数据，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [code, token]);

  const shareLink = useMemo(() => {
    if (!data?.partner.code) return '';
    return `${SEO_SITE.url}/invite?ref=${encodeURIComponent(data.partner.code)}`;
  }, [data?.partner.code]);

  const pending = data?.summary.pending;
  const paid = data?.summary.paid;
  const approved = data?.summary.approved;
  const overridePending = data?.overrideSummary.pending;
  const overridePaid = data?.overrideSummary.paid;
  const overrideApproved = data?.overrideSummary.approved;
  const payable = (pending?.commissionAmount || 0) + (approved?.commissionAmount || 0);
  const overridePayable = (overridePending?.overrideAmount || 0) + (overrideApproved?.overrideAmount || 0);

  return (
    <>
      <SeoHead
        title="Partner Dashboard | Shanhai Realm"
        description="Private Shanhai Realm partner dashboard for referral performance and commission tracking."
        canonical={`${SEO_SITE.url}/partner`}
        noindex
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.backBtn, webPointer]} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>山海灵境</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>推广看板</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={ui.gold} />
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>无法打开看板</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={load}>
                <Text style={styles.primaryBtnText}>重新加载</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.kicker}>PARTNER</Text>
                <Text style={styles.title}>{data.partner.name}</Text>
                <Text style={styles.sub}>
                  推广码 {data.partner.code} · 佣金比例 {(data.partner.commissionRate * 100).toFixed(0)}%
                </Text>
                <View style={styles.linkBox}>
                  <Text style={styles.linkLabel}>你的推广注册链接</Text>
                  <Text style={styles.linkText} selectable>{shareLink}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <Metric label="点击" value={String(data.funnel.clicks)} />
                <Metric label="注册" value={String(data.funnel.registeredUsers)} />
                <Metric label="付费用户" value={String(data.funnel.paidUsers)} />
                <Metric label="注册到付费" value={`${(data.funnel.conversionRate * 100).toFixed(1)}%`} />
              </View>

              <View style={styles.settlementCard}>
                <View>
                  <Text style={styles.cardLabel}>待结算佣金</Text>
                  <Text style={styles.moneyText}>{money(payable)}</Text>
                </View>
                <View style={styles.settlementRight}>
                  <Text style={styles.settlementLine}>
                    {data.partner.settlementCycle === 'weekly' ? '周结' : '月结'}
                  </Text>
                  <Text style={styles.settlementSub}>下次结算：{dateLabel(data.partner.nextSettlementAt)}</Text>
                  <Text style={styles.settlementSub}>最低打款：{money(data.partner.minimumPayout)}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Summary label="待结算" count={pending?.orderCount || 0} amount={pending?.commissionAmount || 0} />
                <Summary label="待打款" count={approved?.orderCount || 0} amount={approved?.commissionAmount || 0} />
                <Summary label="已结算" count={paid?.orderCount || 0} amount={paid?.commissionAmount || 0} />
              </View>

              {data.subPartners.length > 0 || data.overrideCommissions.length > 0 ? (
                <>
                  <View style={styles.settlementCard}>
                    <View>
                      <Text style={styles.cardLabel}>二级代理分润</Text>
                      <Text style={styles.moneyText}>{money(overridePayable)}</Text>
                    </View>
                    <View style={styles.settlementRight}>
                      <Text style={styles.settlementLine}>下级 {data.subPartners.length} 个</Text>
                      <Text style={styles.settlementSub}>默认按下级佣金的 {(data.partner.overrideCommissionRate * 100).toFixed(0)}%</Text>
                      <Text style={styles.settlementSub}>已结算：{money(overridePaid?.overrideAmount || 0)}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>下级推广员</Text>
                  <View style={styles.userList}>
                    {data.subPartners.map((item) => (
                      <View key={item.id} style={styles.userRow}>
                        <View style={styles.userMain}>
                          <Text style={styles.userId}>{item.name}</Text>
                          <Text style={styles.userDate}>推广码 {item.code} · 佣金 {(item.commissionRate * 100).toFixed(0)}%</Text>
                        </View>
                        <Text style={[styles.userStatus, item.isActive && styles.userStatusPaid]}>
                          {item.isActive ? '启用' : '停用'}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>二级分润记录</Text>
                  {data.overrideCommissions.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyText}>暂无二级分润。下级推广员产生付费订单后，这里会显示分润记录。</Text>
                    </View>
                  ) : (
                    data.overrideCommissions.map((item) => (
                      <View key={item.id} style={styles.orderCard}>
                        <View style={styles.orderTop}>
                          <Text style={styles.orderName}>{item.childPartner.name}</Text>
                          <Text style={[styles.status, item.status === 'paid' && styles.statusPaid]}>
                            {statusLabel(item.status)}
                          </Text>
                        </View>
                        <Text style={styles.orderMeta}>
                          基础佣金 {money(item.baseCommissionAmount, item.currency)} · 二级分润 {money(item.overrideAmount, item.currency)}
                        </Text>
                        <Text style={styles.orderUser} selectable>付费用户：{shortId(item.user?.id)}</Text>
                        <Text style={styles.orderDate}>{dateLabel(item.completedAt || item.createdAt)}</Text>
                      </View>
                    ))
                  )}
                </>
              ) : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>注册用户</Text>
                <Text style={styles.sectionMeta}>最近 {data.registeredUsers.length} 个</Text>
              </View>
              {data.registeredUsers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>暂无注册用户。用户通过你的推广链接注册后，这里会显示 userId。</Text>
                </View>
              ) : (
                <View style={styles.userList}>
                  {data.registeredUsers.slice(0, 20).map((user) => (
                    <View key={user.id} style={styles.userRow}>
                      <View style={styles.userMain}>
                        <Text style={styles.userId} selectable>{shortId(user.id)}</Text>
                        <Text style={styles.userDate}>{dateLabel(user.createdAt)}</Text>
                      </View>
                      <Text style={[styles.userStatus, user.paid && styles.userStatusPaid]}>
                        {user.paid ? '已付费' : '未付费'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>最近订单</Text>
              {data.commissions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>暂无付费订单。推广链接产生支付后，这里会自动出现佣金记录。</Text>
                </View>
              ) : (
                data.commissions.map((item) => (
                  <View key={item.id} style={styles.orderCard}>
                    <View style={styles.orderTop}>
                      <Text style={styles.orderName}>{item.productName}</Text>
                      <Text style={[styles.status, item.status === 'paid' && styles.statusPaid]}>
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                    <Text style={styles.orderMeta}>
                      成交 {money(item.grossAmount, item.currency)} · 佣金 {money(item.commissionAmount, item.currency)}
                    </Text>
                    <Text style={styles.orderUser} selectable>付费用户：{shortId(item.user?.id)}</Text>
                    <Text style={styles.orderDate}>{dateLabel(item.completedAt || item.createdAt)}</Text>
                  </View>
                ))
              )}

              <Text style={styles.note}>
                说明：本页展示的是山海灵境系统内已归因订单。退款、拒付或异常订单会在结算前扣除或作废；最终打款以结算确认记录为准。
              </Text>
            </>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Summary({ label, count, amount }: { label: string; count: number; amount: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryAmount}>{money(amount)}</Text>
      <Text style={styles.summaryCount}>{count} 笔订单</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.bg,
  },
  topBar: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 179, 106, 0.14)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    minWidth: 76,
  },
  backText: {
    color: ui.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  topTitle: {
    color: ui.text,
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 48,
  },
  center: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.25)',
    backgroundColor: ui.surface,
    padding: 18,
    marginBottom: 14,
  },
  kicker: {
    color: ui.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  title: {
    color: ui.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '900',
  },
  sub: {
    color: ui.sub,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  linkBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#0D111B',
    borderWidth: 1,
    borderColor: ui.border,
  },
  linkLabel: {
    color: ui.muted,
    fontSize: 11,
    marginBottom: 6,
  },
  linkText: {
    color: ui.gold,
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 132,
    borderRadius: 8,
    backgroundColor: ui.panel,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
  },
  metricValue: {
    color: ui.text,
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    color: ui.sub,
    fontSize: 12,
    marginTop: 4,
  },
  settlementCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.26)',
    backgroundColor: '#151A25',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLabel: {
    color: ui.sub,
    fontSize: 12,
    marginBottom: 6,
  },
  moneyText: {
    color: ui.gold,
    fontSize: 28,
    fontWeight: '900',
  },
  settlementRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  settlementLine: {
    color: ui.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  settlementSub: {
    color: ui.sub,
    fontSize: 11,
    lineHeight: 17,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: ui.surface,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 12,
  },
  summaryLabel: {
    color: ui.sub,
    fontSize: 12,
  },
  summaryAmount: {
    color: ui.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  summaryCount: {
    color: ui.muted,
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: ui.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  sectionMeta: {
    color: ui.muted,
    fontSize: 12,
    marginBottom: 10,
  },
  userList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.surface,
    marginBottom: 18,
    overflow: 'hidden',
  },
  userRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 52, 72, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  userMain: {
    flex: 1,
    minWidth: 0,
  },
  userId: {
    color: ui.text,
    fontSize: 13,
    fontWeight: '800',
  },
  userDate: {
    color: ui.muted,
    fontSize: 11,
    marginTop: 3,
  },
  userStatus: {
    color: ui.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  userStatusPaid: {
    color: ui.green,
  },
  orderCard: {
    borderRadius: 8,
    backgroundColor: ui.surface,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 14,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderName: {
    flex: 1,
    color: ui.text,
    fontSize: 14,
    fontWeight: '800',
  },
  status: {
    color: ui.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  statusPaid: {
    color: ui.green,
  },
  orderMeta: {
    color: ui.sub,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  orderUser: {
    color: ui.gold,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '800',
  },
  orderDate: {
    color: ui.muted,
    fontSize: 11,
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
    backgroundColor: ui.surface,
  },
  emptyText: {
    color: ui.sub,
    fontSize: 13,
    lineHeight: 20,
  },
  note: {
    color: ui.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },
  errorCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 106, 106, 0.42)',
    backgroundColor: ui.surface,
    padding: 18,
    marginTop: 32,
  },
  errorTitle: {
    color: ui.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  errorText: {
    color: ui.sub,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: ui.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#17120D',
    fontSize: 13,
    fontWeight: '900',
  },
});
