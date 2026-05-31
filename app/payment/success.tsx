import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { paymentApi, userApi, chartApi, type BaziChart } from '../../src/services/api';
import { useUserStore } from '../../src/store/user';
import * as Clipboard from 'expo-clipboard';
import { trackNamedEvent } from '../../src/services/analytics';
import { useI18nStore } from '../../src/store/i18n';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
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

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const t = useI18nStore((state) => state.t);
  const params = useLocalSearchParams<{
    paymentId?: string;
    paymentid?: string;
    session_id?: string;
  }>();
  const loadUser = useUserStore((s) => s.loadUser);

  const [phase, setPhase] = useState<'polling' | 'done' | 'error' | 'missing'>('polling');
  const [message, setMessage] = useState(t('payment.success.checking', '正在确认支付结果…'));
  const [retryTick, setRetryTick] = useState(0);
  /**
   * 支付完成时的商品类型：必须在 await 之前同步写入 ref，避免 setState 批处理与异步间隔导致
   * 「文案已是积分、按钮仍显示订阅」的错配。
   */
  const paymentKindRef = useRef<'points' | 'subscription' | null>(null);

  const donePrimaryKind = useMemo((): 'points' | 'subscription' | 'neutral' => {
    if (phase !== 'done') return 'neutral';
    const r = paymentKindRef.current;
    if (r === 'points' || r === 'subscription') return r;
    if (message.includes('积分已到账')) return 'points';
    if (message.includes('会员权益已生效')) return 'subscription';
    return 'neutral';
  }, [phase, message]);
  const nextStepTip = useMemo(() => {
    if (phase !== 'done') return '';
    if (donePrimaryKind === 'points') {
      return '下一步建议：先确认积分余额，再继续占卜或深度解签。';
    }
    if (donePrimaryKind === 'subscription') {
      return '下一步建议：先确认会员有效期，再进入占卜页继续当前问题。';
    }
    return '下一步建议：回到灵石页确认权益状态后继续使用。';
  }, [phase, donePrimaryKind]);

  const paymentId = (() => {
    const a = params.paymentId ?? params.paymentid;
    const v = Array.isArray(a) ? a[0] : a;
    return v && String(v).trim() && !String(v).includes('CHECKOUT_SESSION') ? String(v).trim() : '';
  })();

  useEffect(() => {
    trackNamedEvent('paywall_show', { source: 'payment_success_page', paymentId: paymentId || null });
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;

    const syncUser = async () => {
      const u = useUserStore.getState().user;
      if (u?.id) {
        try {
          const [latest, chartResp] = await Promise.all([
            userApi.get(u.id),
            chartApi.get(u.id).catch(() => ({ hasChart: false as const, chart: null as null })),
          ]);
          let latestChart: BaziChart | null = null;
          if (chartResp.hasChart && chartResp.chart) latestChart = chartResp.chart;
          useUserStore.setState((state) => ({
            user: latest,
            chart: latestChart ?? state.chart,
            hasChart: latestChart ? true : state.hasChart,
          }));
        } catch {
          await loadUser();
        }
      } else {
        await loadUser();
      }
    };

    const run = async () => {
      paymentKindRef.current = null;
      if (!paymentId) {
        setPhase('missing');
        setMessage(t('payment.success.missingId', '缺少支付单号，请在山海灵境内打开「灵石」页的订阅查看订单状态，或联系客服。'));
        return;
      }

      for (let i = 0; i < 30; i++) {
        if (cancelled) return;
        try {
          const st = await paymentApi.getByIdStatus(paymentId);
          if (st.status === 'completed') {
            if (!cancelled) {
              const kind = st.productType === 'subscription' ? 'subscription' : 'points';
              paymentKindRef.current = kind;
              setMessage(
                kind === 'subscription'
                  ? t('payment.success.syncMembership', '支付已确认，正在同步会员信息…')
                  : t('payment.success.syncPoints', '支付已确认，正在同步积分与账户…'),
              );
              await syncUser();
              setPhase('done');
              trackNamedEvent('payment_success', {
                source: 'success_page_polling',
                paymentId,
                productType: kind,
              });
              let msg =
                kind === 'subscription'
                  ? t('payment.success.membershipDone', '会员权益已生效，感谢支持！')
                  : t('payment.success.pointsDone', '积分已到账，感谢支持！');
              if (kind === 'subscription' && st.membershipExpiryAt) {
                const zh = new Date(st.membershipExpiryAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                msg += `\n\n会员有效期至：${zh}`;
              }
              setMessage(msg);
            }
            return;
          }
          if (st.status === 'failed' || st.status === 'refunded') {
            if (!cancelled) {
              setPhase('error');
              setMessage(t('payment.success.statusError', `支付状态：${st.status}，如有疑问请联系客服。`));
            }
            return;
          }
        } catch {
          /* 继续轮询 */
        }
        await sleep(1000);
      }
      if (!cancelled) {
        setPhase('error');
        setMessage(
          t(
            'payment.success.timeout',
            '等待支付确认超时。若已扣款，会员或积分通常会在 1～3 分钟内到账，请稍后在「灵石」页下拉刷新，或从首页重新进入。',
          ),
        );
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [paymentId, loadUser, retryTick]);

  const goHome = () => router.replace('/' as any);
  const retryCheck = () => {
    setPhase('polling');
    setMessage(t('payment.success.rechecking', '正在重新确认支付结果…'));
    setRetryTick((v) => v + 1);
  };
  const copyPaymentId = async () => {
    if (!paymentId) return;
    await Clipboard.setStringAsync(paymentId);
    Alert.alert(
      t('payment.success.copiedTitle', '已复制订单号'),
      t('payment.success.copiedBody', '订单号已复制，可发给客服 support@shanhai.app 快速排查。'),
    );
  };
  const goSubscription = () =>
    router.replace({ pathname: '/points', params: { tab: 'subscription' } } as any);
  const goPointsMall = () =>
    router.replace({ pathname: '/points', params: { tab: 'mall' } } as any);
  const goReading = () => {
    trackNamedEvent('plan_select', { plan: 'continue_reading', source: 'payment_success_page' });
    router.replace('/(tabs)/reading' as any);
  };

  return (
    <>
      <Stack.Screen options={{ title: t('payment.success.pageTitle', '支付结果 · 山海灵境') }} />
      <View style={styles.container}>
        <View style={styles.panel}>
          {phase === 'polling' && <ActivityIndicator size="large" color={ui.gold} style={{ marginBottom: 20 }} />}
          <Text style={styles.title}>
            {phase === 'done'
              ? t('payment.success.doneTitle', '✅ 陪伴已续上')
              : phase === 'error' || phase === 'missing'
                ? t('common.notice', '提示')
                : t('common.processing', '处理中')}
          </Text>
          <Text style={styles.body}>{message}</Text>
          {nextStepTip ? <Text style={styles.nextStepTip}>{nextStepTip}</Text> : null}
          {phase !== 'polling' && (
            <View style={styles.actions}>
            {phase === 'done' && donePrimaryKind === 'points' ? (
              <TouchableOpacity style={styles.primary} onPress={goPointsMall} activeOpacity={0.85}>
                <Text style={styles.primaryText}>{t('payment.success.primary.points', '查看积分并继续任务')}</Text>
              </TouchableOpacity>
            ) : phase === 'done' && donePrimaryKind === 'subscription' ? (
              <TouchableOpacity style={styles.primary} onPress={goSubscription} activeOpacity={0.85}>
                <Text style={styles.primaryText}>{t('payment.success.primary.subscription', '查看订阅权益与到期时间')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primary}
                onPress={() => router.replace('/points' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryText}>{t('payment.success.primary.default', '前往灵石继续配置')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondary} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.secondaryText}>
                {phase === 'done'
                  ? t('payment.success.secondary.done', '返回首页聊天')
                  : t('payment.success.secondary.default', '返回首页')}
              </Text>
            </TouchableOpacity>
            {phase === 'done' ? (
              <TouchableOpacity style={styles.ghost} onPress={goReading} activeOpacity={0.85}>
                <Text style={styles.ghostText}>{t('payment.success.goReading', '去占卜页继续')}</Text>
              </TouchableOpacity>
            ) : null}
            {(phase === 'error' || phase === 'missing') && paymentId ? (
              <TouchableOpacity style={styles.ghost} onPress={retryCheck} activeOpacity={0.85}>
                <Text style={styles.ghostText}>{t('payment.success.retryStatus', '重新查询支付状态')}</Text>
              </TouchableOpacity>
            ) : null}
            {paymentId ? (
              <TouchableOpacity style={styles.ghost} onPress={copyPaymentId} activeOpacity={0.85}>
                <Text style={styles.ghostText}>{t('payment.success.copyOrderId', '复制订单号')}</Text>
              </TouchableOpacity>
            ) : null}
            </View>
          )}
        </View>
        {Platform.OS === 'web' && phase === 'polling' && (
          <Text style={styles.hint}>
            {t('payment.success.pollHint', '支付平台回调服务器可能需要几秒；本页约每秒自动刷新状态，请勿关闭。')}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.bg,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ui.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: ui.textSub,
    textAlign: 'center',
    maxWidth: 360,
  },
  nextStepTip: {
    marginTop: 10,
    color: ui.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: '#94A0B8',
  },
  actions: {
    marginTop: 28,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primary: {
    backgroundColor: ui.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#F5F7FB',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    borderWidth: 1,
    borderColor: ui.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: ui.text,
    fontSize: 15,
    fontWeight: '600',
  },
  ghost: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ui.border,
  },
  ghostText: {
    color: ui.textSub,
    fontSize: 14,
    fontWeight: '600',
  },
});
