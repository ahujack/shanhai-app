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
          const latest = await userApi.get(u.id);
          let latestChart: BaziChart | null = null;
          try {
            const cr = await chartApi.get(u.id);
            if (cr.hasChart && cr.chart) latestChart = cr.chart;
          } catch {
            /* ignore */
          }
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
        setMessage('缺少支付单号，请从「灵石 → 订阅」查看订单状态，或联系客服。');
        return;
      }

      for (let i = 0; i < 30; i++) {
        if (cancelled) return;
        try {
          const st = await paymentApi.getByIdStatus(paymentId);
          if (st.status === 'completed') {
            if (!cancelled) {
              setMessage('支付已确认，正在同步会员信息…');
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
        await sleep(2000);
      }
      if (!cancelled) {
        setPhase('error');
        setMessage('等待支付确认超时。若已扣款，会员通常会在 1～3 分钟内生效，请稍后在「灵石」页下拉刷新。');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [paymentId, loadUser]);

  const goHome = () => router.replace('/(tabs)/points' as any);
  const goSubscription = () =>
    router.replace({ pathname: '/(tabs)/points', params: { tab: 'subscription' } } as any);

  return (
    <>
      <Stack.Screen options={{ title: '支付结果' }} />
      <View style={styles.container}>
        {phase === 'polling' && <ActivityIndicator size="large" color="#F8D05F" style={{ marginBottom: 20 }} />}
        <Text style={styles.title}>
          {phase === 'done' ? '✅ 支付成功' : phase === 'error' || phase === 'missing' ? '提示' : '处理中'}
        </Text>
        <Text style={styles.body}>{message}</Text>
        {phase !== 'polling' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primary} onPress={goSubscription} activeOpacity={0.85}>
              <Text style={styles.primaryText}>查看订阅与到期时间</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.secondaryText}>返回灵石</Text>
            </TouchableOpacity>
          </View>
        )}
        {Platform.OS === 'web' && phase === 'polling' && (
          <Text style={styles.hint}>请勿关闭本页，正在与服务器同步…</Text>
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
