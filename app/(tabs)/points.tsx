import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { paymentApi, PaymentProduct, CheckoutResult, pointsApi, PointsSummary } from '../../src/services/api';

const colors = theme.dark;

export default function PointsMallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loadUser } = useUserStore();

  const [subscriptionProducts, setSubscriptionProducts] = useState<PaymentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [productsData, statusData, pointsData] = await Promise.all([
        paymentApi.getProducts(),
        paymentApi.getStatus(),
        user ? pointsApi.getSummary().catch(() => null) : Promise.resolve(null),
      ]);
      // 只保留订阅产品
      setSubscriptionProducts(productsData.filter((p: PaymentProduct) => p.type === 'subscription'));
      setStripeConfigured(statusData.stripeConfigured);
      setPointsSummary(pointsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
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
      
      const result: CheckoutResult = await paymentApi.createCheckout(product.id);
      
      if (result.mock) {
        Alert.alert(
          '测试模式',
          `Stripe 未配置，这是一个模拟支付。\n\n产品: ${product.name}\n价格: $${product.price}`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '模拟支付成功',
              onPress: async () => {
                try {
                  await paymentApi.mockPayment(result.paymentId);
                  Alert.alert('成功', 'VIP会员已开通！');
                  await loadUser();
                } catch (e) {
                  Alert.alert('错误', '支付处理失败');
                }
              },
            },
          ]
        );
      } else if (result.url) {
        const supported = await Linking.canOpenURL(result.url);
        if (supported) {
          await Linking.openURL(result.url);
        } else {
          Alert.alert('提示', `请在浏览器中打开: ${result.url}`);
        }
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      Alert.alert('错误', error.message || '支付失败');
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

  const isVip = user?.membership === 'vip' || user?.membership === 'premium';

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      {/* VIP状态卡片 */}
      <View style={[styles.vipCard, isVip && styles.vipCardActive]}>
        <View style={styles.vipCardContent}>
          <Text style={styles.vipIcon}>👑</Text>
          <View style={styles.vipInfo}>
            <Text style={styles.vipTitle}>
              {isVip ? 'VIP 会员' : '普通用户'}
            </Text>
            <Text style={styles.vipSubtitle}>
              {isVip ? '有效期至：永久' : '开通VIP，解锁全部功能'}
            </Text>
          </View>
        </View>
        {isVip && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>已开通</Text>
          </View>
        )}
      </View>

      {/* 积分说明 */}
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
        <Text style={styles.pointsUsage}>💡 积分可用于解锁高级功能、查看详细解读等</Text>
      </View>

      {/* VIP 订阅 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ VIP 会员</Text>
        <Text style={styles.sectionSubtitle}>开通VIP，享无限次AI解读</Text>
        
        {subscriptionProducts.map((product) => {
          const isPurchasing = purchasing === product.id;
          const features = product.features ? JSON.parse(product.features) : [];
          
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.vipProductCard}
              onPress={() => handlePurchase(product)}
              disabled={isPurchasing || !user || isVip}
            >
              <View style={styles.vipProductHeader}>
                <Text style={styles.vipProductName}>{product.name}</Text>
                <Text style={styles.vipProductPrice}>${product.price}</Text>
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
                style={[
                  styles.subscribeButton, 
                  (!user || isVip) && styles.subscribeButtonDisabled
                ]}
                onPress={() => handlePurchase(product)}
                disabled={isPurchasing || !user || isVip}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {!user ? '请先登录' : isVip ? '已是VIP' : '立即订阅'}
                  </Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {!stripeConfigured && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Stripe 未配置，当前为测试模式
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    backgroundColor: '#2D2D44',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  vipCardActive: {
    backgroundColor: 'linear-gradient(135deg, #4C2F80 0%, #2D1B5E 100%)',
    borderColor: '#F8D05F',
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
    color: '#F8D05F',
  },
  vipSubtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    marginTop: 4,
  },
  vipBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#16213E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7F6F0',
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
    color: '#B2A0FF',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    marginBottom: 16,
  },
  vipProductCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  vipProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vipProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7F6F0',
  },
  vipProductPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8D05F',
  },
  vipProductDesc: {
    fontSize: 14,
    color: '#8D8DAA',
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
    color: '#4CAF50',
    fontSize: 14,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#B2A0FF',
  },
  subscribeButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    backgroundColor: '#3D3D5C',
  },
  subscribeButtonText: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#fff',
    fontSize: 14,
  },
  bottomPadding: {
    height: 40,
  },
});
