import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = {
  background: '#1A1A2E',
  card: '#16213E',
  text: '#F7F6F0',
  textSecondary: '#8D8DAA',
  accent: '#F8D05F',
  border: '#2D2D44',
};

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>隐私政策</Text>
        <Text style={styles.lastUpdate}>最后更新：2026年3月8日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 收集的信息</Text>
          <Text style={styles.text}>
            山海灵境（以下简称"我们"）尊重并保护用户隐私。我们收集的信息包括：
          </Text>
          <Text style={styles.text}>
            • 账户信息：邮箱、用户名、头像（通过第三方登录获取）{"\n"}
            • 个人信息：出生日期、出生时间、性别（用于命理分析）{"\n"}
            • 使用数据：登录时间、功能使用偏好{"\n"}
            • 设备信息：设备类型、操作系统版本
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 信息使用</Text>
          <Text style={styles.text}>
            我们将使用收集的信息用于：
          </Text>
          <Text style={styles.text}>
            • 提供和优化我们的命理分析服务{"\n"}
            • 个性化用户体验{"\n"}
            • 账户安全和身份验证{"\n"}
            • 发送服务通知和更新{"\n"}
            • 改进我们的产品和服务
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 信息保护</Text>
          <Text style={styles.text}>
            我们采用行业标准的安全措施保护您的个人信息：
          </Text>
          <Text style={styles.text}>
            • 数据传输使用SSL加密{"\n"}
            • 数据库访问权限严格控制{"\n"}
            • 定期安全审计和更新{"\n"}
            • 敏感信息加密存储
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 信息共享</Text>
          <Text style={styles.text}>
            我们不会出售您的个人信息。在以下情况下，我们可能共享信息：
          </Text>
          <Text style={styles.text}>
            • 法律要求时{"\n"}
            • 保护我们或用户的权利时{"\n"}
            • 服务提供商协助运营时（需签署保密协议）
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 用户权利</Text>
          <Text style={styles.text}>
            您对自己的信息享有以下权利：
          </Text>
          <Text style={styles.text}>
            • 访问和查看您的信息{"\n"}
            • 更正不准确的信息{"\n"}
            • 删除您的账户和数据{"\n"}
            • 导出您的数据{"\n"}
            • 撤回同意
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 数据存储</Text>
          <Text style={styles.text}>
            您的信息存储在位于美国的服务器上。我们会根据需要保留您的信息，除非法律要求或您主动要求删除。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 儿童隐私</Text>
          <Text style={styles.text}>
            我们的服务不面向13岁以下儿童。我们不会故意收集儿童的个人信息。如果您发现我们收集了儿童信息，请联系我们删除。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 政策变更</Text>
          <Text style={styles.text}>
            我们可能会不时更新本隐私政策。任何重大变更将通过应用内通知或邮件告知您。继续使用我们的服务即表示您同意更新后的政策。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 联系我们</Text>
          <Text style={styles.text}>
            如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
          </Text>
          <Text style={styles.text}>
            邮箱：support@shanhai.app
          </Text>
        </View>

        <Text style={styles.footer}>
          使用山海灵境服务即表示您已阅读并同意本隐私政策。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  footer: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
