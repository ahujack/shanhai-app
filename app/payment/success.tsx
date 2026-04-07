import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { paymentApi, userApi, chartApi, type BaziChart } from '../../src/services/api';
import { useUserStore } from '../../src/store/user';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentId?: string;
    paymentid?: string;
    session_id?: string;
  }>();
  const loadUser = useUserStore((s) => s.loadUser);

  const [phase, setPhase] = useState<'polling' | 'done' | 'error' | 'missing'>('polling');
  const [message, setMessage] = useState('正在确认支付结果…');
  /** 用于成功页主按钮：积分走灵石商城，订阅走订阅 Tab */
  const [doneProductType, setDoneProductType] = useState<'subscription' | 'points' | null>(null);

  const paymentId = (() => {
    const a = params.paymentId ?? params.paymentid;
    const v = Array.isArray(a) ? a[0] : a;
    return v && String(v).trim() && !String(v).includes('CHECKOUT_SESSION') ? String(v).trim() : '';
  })();

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
      if (!paymentId) {
        setPhase('missing');
        setMessage('缺少支付单号，请在山海灵境内打开「灵石」页的订阅查看订单状态，或联系客服。');
        return;
      }

      for (let i = 0; i < 30; i++) {
        if (cancelled) return;
        try {
          const st = await paymentApi.getByIdStatus(paymentId);
          if (st.status === 'completed') {
            if (!cancelled) {
              setDoneProductType(st.productType);
              setMessage(
                st.productType === 'subscription'
                  ? '支付已确认，正在同步会员信息…'
                  : '支付已确认，正在同步积分与账户…',
              );
              await syncUser();
              setPhase('done');
              let msg =
                st.productType === 'subscription'
                  ? '会员权益已生效，感谢支持！'
                  : '积分已到账，感谢支持！';
              if (st.productType === 'subscription' && st.membershipExpiryAt) {
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
              setMessage(`支付状态：${st.status}，如有疑问请联系客服。`);
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
          '等待支付确认超时。若已扣款，会员或积分通常会在 1～3 分钟内到账，请稍后在「灵石」页下拉刷新，或从首页重新进入。',
        );
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [paymentId, loadUser]);

  const goHome = () => router.replace('/(tabs)/index' as any);
  const goSubscription = () =>
    router.replace({ pathname: '/(tabs)/points', params: { tab: 'subscription' } } as any);
  const goPointsMall = () =>
    router.replace({ pathname: '/(tabs)/points', params: { tab: 'mall' } } as any);

  return (
    <>
      <Stack.Screen options={{ title: '支付结果 · 山海灵境' }} />
      <View style={styles.container}>
        {phase === 'polling' && <ActivityIndicator size="large" color="#F8D05F" style={{ marginBottom: 20 }} />}
        <Text style={styles.title}>
          {phase === 'done' ? '✅ 支付成功' : phase === 'error' || phase === 'missing' ? '提示' : '处理中'}
        </Text>
        <Text style={styles.body}>{message}</Text>
        {phase !== 'polling' && (
          <View style={styles.actions}>
            {phase === 'done' && doneProductType === 'points' ? (
              <TouchableOpacity style={styles.primary} onPress={goPointsMall} activeOpacity={0.85}>
                <Text style={styles.primaryText}>查看积分</Text>
              </TouchableOpacity>
            ) : phase === 'done' && doneProductType === 'subscription' ? (
              <TouchableOpacity style={styles.primary} onPress={goSubscription} activeOpacity={0.85}>
                <Text style={styles.primaryText}>查看订阅与到期时间</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primary}
                onPress={() => router.replace('/(tabs)/points' as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryText}>前往灵石</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondary} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.secondaryText}>进入山海灵境</Text>
            </TouchableOpacity>
          </View>
        )}
        {Platform.OS === 'web' && phase === 'polling' && (
          <Text style={styles.hint}>
            支付平台回调服务器可能需要几秒；本页约每秒自动刷新状态，请勿关闭。
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F7F6F0',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#BFC8E8',
    textAlign: 'center',
    maxWidth: 360,
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: '#6F6287',
  },
  actions: {
    marginTop: 28,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primary: {
    backgroundColor: '#F8D05F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    borderWidth: 1,
    borderColor: 'rgba(248, 208, 95, 0.45)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#F8D05F',
    fontSize: 15,
    fontWeight: '600',
  },
});
