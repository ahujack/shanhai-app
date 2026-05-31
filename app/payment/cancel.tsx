import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { trackNamedEvent } from '../../src/services/analytics';

const ui = {
  bg: '#0B0D14',
  card: '#121827',
  border: '#2A3448',
  text: '#E8ECF3',
  textSub: '#AAB3C5',
  gold: '#D6B36A',
  primary: '#7C6CFF',
};

export default function PaymentCancelScreen() {
  const router = useRouter();
  React.useEffect(() => {
    trackNamedEvent('paywall_show', { source: 'payment_cancel_page' });
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '已取消支付' }} />
      <View style={styles.container}>
        <View style={styles.panel}>
          <Text style={styles.title}>支付已取消</Text>
          <Text style={styles.body}>未发生扣款。你可以回到灵石页继续选择方案，或先用积分包体验。</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              trackNamedEvent('plan_select', { plan: 'subscription_tab', source: 'payment_cancel_page' });
              router.replace({ pathname: '/points', params: { tab: 'subscription' } } as any);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>返回订阅方案</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              trackNamedEvent('plan_select', { plan: 'points_tab', source: 'payment_cancel_page' });
              router.replace({ pathname: '/points', params: { tab: 'mall' } } as any);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>去积分包体验</Text>
          </TouchableOpacity>
          <Text style={styles.tip}>若你已扣款但页面显示取消，请前往「支付成功页」复制订单号并联系客服。</Text>
        </View>
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
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: ui.textSub,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: ui.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnText: {
    color: '#F5F7FB',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: ui.border,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: ui.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tip: {
    marginTop: 18,
    color: ui.textSub,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 340,
  },
});
