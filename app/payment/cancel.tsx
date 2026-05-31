import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { trackNamedEvent } from '../../src/services/analytics';

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
          <Text style={styles.body}>未扣款。你可以先回到灵石页继续选择套餐，或切换积分包先小额体验。</Text>
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
    backgroundColor: '#0A0716',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
    backgroundColor: '#161126',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F7F6F0',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#BFC8E8',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: '#F8D05F',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F8D05F',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '700',
  },
  tip: {
    marginTop: 18,
    color: '#8D8DAA',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 340,
  },
});
