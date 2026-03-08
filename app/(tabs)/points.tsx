import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { paymentApi, PaymentProduct, CheckoutResult } from '../../src/services/api';

const colors = theme.dark;

export default function PointsMallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loadUser } = useUserStore();

  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [productsData, statusData] = await Promise.all([
        paymentApi.getProducts(),
        paymentApi.getStatus(),
      ]);
      setProducts(productsData);
      setStripeConfigured(statusData.stripeConfigured);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('错误', '无法加载产品列表');
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
        // 模拟支付（测试用）
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
                  Alert.alert('成功', '积分已到账！');
                  await loadUser();
                } catch (e) {
                  Alert.alert('错误', '支付处理失败');
                }
              },
            },
          ]
        );
      } else if (result.url) {
        // 跳转到 Stripe 支付页面
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

  // 分离积分产品和订阅产品
  const pointsProducts = products.filter(p => p.type === 'points');
  const subscriptionProducts = products.filter(p => p.type === 'subscription');

  const renderProductCard = (product: PaymentProduct) => {
    const isPurchasing = purchasing === product.id;
    
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => handlePurchase(product)}
        disabled={isPurchasing || !user}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price}</Text>
        </View>
        
        <Text style={styles.productDescription}>
          {product.description}
        </Text>
        
        {product.type === 'points' && (
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{product.points} 积分</Text>
          </View>
        )}
        
        {product.type === 'subscription' && product.features && (
          <View style={styles.featuresList}>
            {JSON.parse(product.features).map((feature: string, index: number) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.buyButton, !user && styles.buyButtonDisabled]}
          onPress={() => handlePurchase(product)}
          disabled={isPurchasing || !user}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buyButtonText}>
              {user ? '购买' : '请先登录'}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>积分商城</Text>
      </View>

      {!stripeConfigured && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Stripe 未配置，当前为测试模式
          </Text>
        </View>
      )}

      {/* 积分包 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💎 积分包</Text>
        <View style={styles.productsGrid}>
          {pointsProducts.map(renderProductCard)}
        </View>
      </View>

      {/* VIP 订阅 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ VIP 会员</Text>
        <View style={styles.productsGrid}>
          {subscriptionProducts.map(renderProductCard)}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          支付完成后，积分将自动添加到您的账户
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningBanner: {
    backgroundColor: '#ff9800',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  productDescription: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 10,
    minHeight: 36,
  },
  pointsBadge: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  pointsText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  featuresList: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    color: '#4ade80',
    marginRight: 6,
    fontSize: 12,
  },
  featureText: {
    color: '#a0a0a0',
    fontSize: 11,
  },
  buyButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#666',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
