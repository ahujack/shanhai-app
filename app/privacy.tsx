import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18nStore } from '../src/store/i18n';

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
  const language = useI18nStore((state) => state.language);
  const copy =
    language === 'en-US'
      ? {
          title: 'Privacy Policy',
          lastUpdate: 'Last updated: Mar 8, 2026',
          sections: [
            {
              title: '1. Information We Collect',
              lines: [
                'Shanhai Realm ("we") respects and protects user privacy. We may collect:',
                '• Account info: email, username, avatar (from third-party login)\n• Profile info: birth date, birth time, gender (for destiny analysis)\n• Usage data: login time, feature preferences\n• Device info: device type and OS version',
              ],
            },
            {
              title: '2. How We Use Information',
              lines: [
                'We use collected information to:',
                '• Provide and improve our services\n• Personalize user experience\n• Account security and verification\n• Service notifications and updates\n• Product and service optimization',
              ],
            },
            {
              title: '3. Information Protection',
              lines: [
                'We use industry-standard security measures:',
                '• SSL encryption in transit\n• Strict database access control\n• Regular security audits and updates\n• Encrypted storage for sensitive data',
              ],
            },
            {
              title: '4. Information Sharing',
              lines: [
                'We do not sell your personal information. We may share only when:',
                '• Required by law\n• Protecting our rights or user rights\n• Working with service providers under confidentiality obligations',
              ],
            },
            {
              title: '5. Your Rights',
              lines: [
                'You may:',
                '• Access and review your data\n• Correct inaccurate information\n• Delete your account and data\n• Export your data\n• Withdraw consent',
              ],
            },
            {
              title: '6. Data Storage',
              lines: [
                'Your data is stored on servers located in the United States. We retain data as needed unless deletion is required by law or requested by you.',
              ],
            },
            {
              title: '7. Children Privacy',
              lines: [
                'Our service is not intended for children under 13. If you believe we collected such information, contact us and we will remove it.',
              ],
            },
            {
              title: '8. Policy Changes',
              lines: [
                'We may update this policy from time to time. Major changes will be notified in-app or by email.',
              ],
            },
            {
              title: '9. Contact',
              lines: ['If you have any privacy questions, contact us at:', 'Email: support@shanhai.app'],
            },
          ],
          footer: 'By using Shanhai Realm, you acknowledge that you have read and agreed to this Privacy Policy.',
        }
      : language === 'zh-TW'
      ? {
          title: '隱私政策',
          lastUpdate: '最後更新：2026年3月8日',
          sections: [
            {
              title: '1. 收集的資訊',
              lines: [
                '山海靈境（以下簡稱「我們」）尊重並保護用戶隱私。我們收集的資訊包括：',
                '• 帳戶資訊：郵箱、用戶名、頭像（透過第三方登入獲取）\n• 個人資訊：出生日期、出生時間、性別（用於命理分析）\n• 使用數據：登入時間、功能使用偏好\n• 設備資訊：設備類型、作業系統版本',
              ],
            },
            {
              title: '2. 資訊使用',
              lines: [
                '我們將使用收集的資訊用於：',
                '• 提供與優化命理分析服務\n• 個性化用戶體驗\n• 帳戶安全與身份驗證\n• 發送服務通知與更新\n• 改進產品與服務',
              ],
            },
            {
              title: '3. 資訊保護',
              lines: [
                '我們採用業界標準安全措施保護您的個人資訊：',
                '• 數據傳輸使用 SSL 加密\n• 嚴格控制資料庫訪問權限\n• 定期安全審計與更新\n• 敏感資訊加密存儲',
              ],
            },
            {
              title: '4. 資訊共享',
              lines: [
                '我們不會出售您的個人資訊。僅在以下情況可能共享：',
                '• 法律要求時\n• 保護我們或用戶權益時\n• 服務供應商協助運營時（需簽署保密協議）',
              ],
            },
            {
              title: '5. 用戶權利',
              lines: [
                '您對自身資訊享有以下權利：',
                '• 存取與查看資訊\n• 更正不準確資訊\n• 刪除帳戶與數據\n• 匯出數據\n• 撤回同意',
              ],
            },
            {
              title: '6. 數據存儲',
              lines: ['您的資訊存儲於位於美國的伺服器上。我們將依需要保留資訊，除非法律要求或您主動要求刪除。'],
            },
            {
              title: '7. 兒童隱私',
              lines: ['本服務不面向 13 歲以下兒童。如您發現我們收集了兒童資訊，請聯繫我們刪除。'],
            },
            {
              title: '8. 政策變更',
              lines: ['我們可能不定期更新本政策。重大變更將透過應用內通知或郵件告知。'],
            },
            {
              title: '9. 聯絡我們',
              lines: ['如對本政策有疑問，請聯繫我們：', '郵箱：support@shanhai.app'],
            },
          ],
          footer: '使用山海靈境服務即表示您已閱讀並同意本隱私政策。',
        }
      : {
          title: '隐私政策',
          lastUpdate: '最后更新：2026年3月8日',
          sections: [
            {
              title: '1. 收集的信息',
              lines: [
                '山海灵境（以下简称"我们"）尊重并保护用户隐私。我们收集的信息包括：',
                '• 账户信息：邮箱、用户名、头像（通过第三方登录获取）\n• 个人信息：出生日期、出生时间、性别（用于命理分析）\n• 使用数据：登录时间、功能使用偏好\n• 设备信息：设备类型、操作系统版本',
              ],
            },
            {
              title: '2. 信息使用',
              lines: [
                '我们将使用收集的信息用于：',
                '• 提供和优化我们的命理分析服务\n• 个性化用户体验\n• 账户安全和身份验证\n• 发送服务通知和更新\n• 改进我们的产品和服务',
              ],
            },
            {
              title: '3. 信息保护',
              lines: [
                '我们采用行业标准的安全措施保护您的个人信息：',
                '• 数据传输使用SSL加密\n• 数据库访问权限严格控制\n• 定期安全审计和更新\n• 敏感信息加密存储',
              ],
            },
            {
              title: '4. 信息共享',
              lines: [
                '我们不会出售您的个人信息。在以下情况下，我们可能共享信息：',
                '• 法律要求时\n• 保护我们或用户的权利时\n• 服务提供商协助运营时（需签署保密协议）',
              ],
            },
            {
              title: '5. 用户权利',
              lines: [
                '您对自己的信息享有以下权利：',
                '• 访问和查看您的信息\n• 更正不准确的信息\n• 删除您的账户和数据\n• 导出您的数据\n• 撤回同意',
              ],
            },
            {
              title: '6. 数据存储',
              lines: ['您的信息存储在位于美国的服务器上。我们会根据需要保留您的信息，除非法律要求或您主动要求删除。'],
            },
            {
              title: '7. 儿童隐私',
              lines: ['我们的服务不面向13岁以下儿童。我们不会故意收集儿童的个人信息。如果您发现我们收集了儿童信息，请联系我们删除。'],
            },
            {
              title: '8. 政策变更',
              lines: ['我们可能会不时更新本隐私政策。任何重大变更将通过应用内通知或邮件告知您。继续使用我们的服务即表示您同意更新后的政策。'],
            },
            {
              title: '9. 联系我们',
              lines: ['如果您对本隐私政策有任何疑问，请通过以下方式联系我们：', '邮箱：support@shanhai.app'],
            },
          ],
          footer: '使用山海灵境服务即表示您已阅读并同意本隐私政策。',
        };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.lastUpdate}>{copy.lastUpdate}</Text>

        {copy.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.lines.map((line) => (
              <Text key={line} style={styles.text}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>{copy.footer}</Text>
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
