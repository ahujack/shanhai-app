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

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>服务条款</Text>
        <Text style={styles.lastUpdate}>最后更新：2026年3月8日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 服务说明</Text>
          <Text style={styles.text}>
            山海灵境（以下简称"本服务"）是一个提供命理分析、八字算命、运势预测等传统文化服务的平台。我们致力于为用户提供有价值的命理咨询服务。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 用户资格</Text>
          <Text style={styles.text}>
            您必须年满13岁才能使用本服务。如果您未满18岁，请在父母或监护人的指导下使用本服务。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 账户责任</Text>
          <Text style={styles.text}>
            • 您需要注册账户才能使用部分功能{"\n"}
            • 您应妥善保管账户信息的安全{"\n"}
            • 您对账户下所有活动负全部责任{"\n"}
            • 如发现账户被盗用，请立即联系我们
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 服务使用规范</Text>
          <Text style={styles.text}>
            使用本服务时，您不得：
          </Text>
          <Text style={styles.text}>
            • 违反任何适用法律或法规{"\n"}
            • 侵犯他人知识产权或隐私权{"\n"}
            • 传播恶意软件或病毒{"\n"}
            • 试图未经授权访问本服务{"\n"}
            • 滥用、骚扰或威胁他人{"\n"}
            • 将本服务用于任何非法目的
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 命理服务声明</Text>
          <Text style={styles.text}>
            • 命理分析仅供娱乐参考，不构成任何形式的决策依据{"\n"}
            • 我们不保证命理预测的准确性{"\n"}
            • 用户应理性对待命理服务，不应过度依赖{"\n"}
            • 本服务不提供医疗、法律、金融等专业建议
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 积分与付费</Text>
          <Text style={styles.text}>
            • 部分功能需要积分或付费才能使用{"\n"}
            • 积分一旦购买，概不退换{"\n"}
            • 我们保留调整价格的权利{"\n"}
            • 虚拟商品（积分）没有退款期限，但在账户有效期内有效
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 知识产权</Text>
          <Text style={styles.text}>
            本服务及其内容的所有权归山海灵境所有。用户不得复制、分发、修改或使用本服务用于商业目的。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 免责声明</Text>
          <Text style={styles.text}>
            本服务按"原样"提供。在法律允许的范围内，我们不对本服务做出任何明示或暗示的保证，包括但不限于适销性、特定用途适用性和非侵权性。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 责任限制</Text>
          <Text style={styles.text}>
            在任何情况下，我们不对任何间接、偶然、特殊或后果性的损害负责，即使已被告知可能发生此类损害。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 服务变更</Text>
          <Text style={styles.text}>
            我们保留随时修改、暂停或终止本服务（或任何部分）的权利，恕不另行通知。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 终止</Text>
          <Text style={styles.text}>
            我们可以在任何时候因任何原因终止您的账户或限制您访问本服务，无需对您承担责任。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. 适用法律</Text>
          <Text style={styles.text}>
            本服务条款受美国法律管辖。您同意因本服务条款产生的任何争议将在美国法院解决。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. 联系我们</Text>
          <Text style={styles.text}>
            如有任何问题，请联系我们：{"\n"}
            邮箱：support@shanhai.app
          </Text>
        </View>

        <Text style={styles.footer}>
          使用山海灵境服务即表示您已阅读并同意本服务条款。
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
