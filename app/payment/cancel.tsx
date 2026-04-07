import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function PaymentCancelScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: '已取消支付' }} />
      <View style={styles.container}>
        <Text style={styles.title}>支付已取消</Text>
        <Text style={styles.body}>未扣款。如需开通 VIP 或充值积分，可随时返回灵石页继续操作。</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace({ pathname: '/(tabs)/points', params: { tab: 'subscription' } } as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>返回订阅</Text>
        </TouchableOpacity>
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
});
