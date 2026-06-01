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

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const language = useI18nStore((state) => state.language);
  const copy =
    language === 'en-US'
      ? {
          title: 'Terms of Service',
          lastUpdate: 'Last updated: Mar 8, 2026',
          sections: [
            { title: '1. Service Overview', lines: ['Shanhai Realm provides culture-inspired interpretation services such as destiny analysis, chart reading and trend insights.'] },
            { title: '2. Eligibility', lines: ['You must be at least 13 years old to use this service. If under 18, please use under parent or guardian guidance.'] },
            { title: '3. Account Responsibility', lines: ['• An account is required for some features\n• Keep your account credentials secure\n• You are responsible for account activities\n• Contact us immediately if your account is compromised'] },
            { title: '4. Acceptable Use', lines: ['When using the service, you must not:', '• Violate laws or regulations\n• Infringe others\' rights\n• Spread malware\n• Attempt unauthorized access\n• Harass or threaten others\n• Use the service for illegal purposes'] },
            { title: '5. Service Disclaimer', lines: ['• All interpretations are for reference and entertainment only\n• We do not guarantee prediction accuracy\n• Do not over-rely on the service for life decisions\n• No medical, legal or financial advice is provided'] },
            { title: '6. Points and Payments', lines: ['• Some features require points or payment\n• Purchased points are non-refundable\n• We may adjust pricing\n• Virtual goods remain valid during account validity period'] },
            { title: '7. Intellectual Property', lines: ['All content and service rights belong to Shanhai Realm. Commercial reuse, copying or redistribution is prohibited.'] },
            { title: '8. Warranty Disclaimer', lines: ['The service is provided "as is". To the extent permitted by law, we disclaim all warranties.'] },
            { title: '9. Limitation of Liability', lines: ['We are not liable for indirect, incidental, special, or consequential damages.'] },
            { title: '10. Service Changes', lines: ['We may modify, suspend, or discontinue any part of the service at any time.'] },
            { title: '11. Termination', lines: ['We may terminate or restrict access to your account at any time for any reason.'] },
            { title: '12. Governing Law', lines: ['These terms are governed by U.S. law. Disputes shall be resolved in U.S. courts.'] },
            { title: '13. Contact', lines: ['Questions? Contact us at:\nEmail: support@shanhai.app'] },
          ],
          footer: 'By using Shanhai Realm, you acknowledge that you have read and agree to these Terms.',
        }
      : language === 'zh-TW'
      ? {
          title: '服務條款',
          lastUpdate: '最後更新：2026年3月8日',
          sections: [
            { title: '1. 服務說明', lines: ['山海靈境（以下簡稱「本服務」）提供命理分析、八字看盤與運勢參考等傳統文化相關服務。'] },
            { title: '2. 用戶資格', lines: ['您需年滿 13 歲方可使用本服務；未滿 18 歲請在監護人指導下使用。'] },
            { title: '3. 帳戶責任', lines: ['• 部分功能需註冊帳戶\n• 請妥善保管帳戶資訊\n• 帳戶下活動由您負責\n• 若發現被盜用請立即聯繫我們'] },
            { title: '4. 使用規範', lines: ['使用本服務時，您不得：', '• 違反法律法規\n• 侵犯他人權利\n• 傳播惡意程式\n• 未授權存取服務\n• 騷擾或威脅他人\n• 用於非法目的'] },
            { title: '5. 命理服務聲明', lines: ['• 命理解讀僅供參考與娛樂\n• 我們不保證預測準確性\n• 請理性使用，不宜過度依賴\n• 本服務不提供醫療、法律、金融等專業建議'] },
            { title: '6. 積分與付費', lines: ['• 部分功能需積分或付費\n• 積分購買後不退換\n• 我們保留調整價格權利\n• 虛擬商品在帳戶有效期內有效'] },
            { title: '7. 智慧財產', lines: ['本服務及內容權利歸山海靈境所有，未經授權不得商業使用或分發。'] },
            { title: '8. 免責聲明', lines: ['本服務按「現狀」提供，在法律允許範圍內不作任何明示或默示保證。'] },
            { title: '9. 責任限制', lines: ['任何情況下，我們均不對間接、附帶、特殊或後果性損害承擔責任。'] },
            { title: '10. 服務變更', lines: ['我們可隨時修改、暫停或終止服務（或其任何部分）。'] },
            { title: '11. 終止', lines: ['我們可在任何時候因任何原因終止或限制您對本服務的使用。'] },
            { title: '12. 準據法', lines: ['本條款受美國法律管轄，爭議由美國法院處理。'] },
            { title: '13. 聯絡我們', lines: ['如有問題，請聯繫我們：\n郵箱：support@shanhai.app'] },
          ],
          footer: '使用山海靈境服務即表示您已閱讀並同意本服務條款。',
        }
      : {
          title: '服务条款',
          lastUpdate: '最后更新：2026年3月8日',
          sections: [
            { title: '1. 服务说明', lines: ['山海灵境（以下简称"本服务"）是一个提供命理分析、八字算命、运势预测等传统文化服务的平台。'] },
            { title: '2. 用户资格', lines: ['您必须年满13岁才能使用本服务。如果您未满18岁，请在父母或监护人的指导下使用本服务。'] },
            { title: '3. 账户责任', lines: ['• 您需要注册账户才能使用部分功能\n• 您应妥善保管账户信息的安全\n• 您对账户下所有活动负全部责任\n• 如发现账户被盗用，请立即联系我们'] },
            { title: '4. 服务使用规范', lines: ['使用本服务时，您不得：', '• 违反任何适用法律或法规\n• 侵犯他人知识产权或隐私权\n• 传播恶意软件或病毒\n• 试图未经授权访问本服务\n• 滥用、骚扰或威胁他人\n• 将本服务用于任何非法目的'] },
            { title: '5. 命理服务声明', lines: ['• 命理分析仅供娱乐参考，不构成决策依据\n• 我们不保证命理预测的准确性\n• 用户应理性对待命理服务\n• 本服务不提供医疗、法律、金融等专业建议'] },
            { title: '6. 积分与付费', lines: ['• 部分功能需要积分或付费才能使用\n• 积分一旦购买，概不退换\n• 我们保留调整价格的权利\n• 虚拟商品在账户有效期内有效'] },
            { title: '7. 知识产权', lines: ['本服务及其内容的所有权归山海灵境所有。用户不得复制、分发、修改或用于商业目的。'] },
            { title: '8. 免责声明', lines: ['本服务按"原样"提供。在法律允许范围内，我们不做任何明示或暗示保证。'] },
            { title: '9. 责任限制', lines: ['在任何情况下，我们不对任何间接、偶然、特殊或后果性损害负责。'] },
            { title: '10. 服务变更', lines: ['我们保留随时修改、暂停或终止本服务（或任何部分）的权利。'] },
            { title: '11. 终止', lines: ['我们可以在任何时候因任何原因终止您的账户或限制您访问本服务。'] },
            { title: '12. 适用法律', lines: ['本服务条款受美国法律管辖。争议将在美国法院解决。'] },
            { title: '13. 联系我们', lines: ['如有任何问题，请联系我们：\n邮箱：support@shanhai.app'] },
          ],
          footer: '使用山海灵境服务即表示您已阅读并同意本服务条款。',
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
