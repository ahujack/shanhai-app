import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
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

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const language = useI18nStore((state) => state.language);

  const faqItems: FAQItem[] =
    language === 'en-US'
      ? [
          { question: 'What is Shanhai Realm?', answer: 'Shanhai Realm is an AI-assisted destiny interpretation product inspired by traditional metaphysics.' },
          { question: 'Are readings guaranteed accurate?', answer: 'Readings are for inspiration and reference only. Please avoid using them as the sole basis for major decisions.' },
          { question: 'How can I get more points?', answer: 'You can get points by:\n• Daily check-in (+10)\n• Consecutive check-in rewards\n• Inviting friends (both get +50)' },
          { question: 'What are VIP benefits?', answer: 'VIP typically includes:\n• More complete readings\n• More advanced guidance\n• Priority access to premium features' },
          { question: 'What can points be used for?', answer: 'Points can unlock advanced modules and deeper analysis results.' },
          { question: 'How do I invite friends?', answer: 'Go to profile and share your invite link. Both sides receive points after successful registration.' },
          { question: 'What if I miss a check-in day?', answer: 'Missing a day resets streak days but does not remove points already earned.' },
          { question: 'Is my data secure?', answer: 'We use encryption and access controls to protect your data and do not sell personal information.' },
          { question: 'How can I contact support?', answer: 'Email us at support@shanhai.app.' },
        ]
      : language === 'zh-TW'
      ? [
          { question: '山海靈境是什麼？', answer: '山海靈境是結合傳統命理與 AI 的解讀平台，提供命盤、運勢與行動建議。' },
          { question: '命理解讀一定準嗎？', answer: '解讀內容僅供參考與娛樂，請勿作為唯一決策依據。' },
          { question: '如何獲得更多積分？', answer: '可透過：\n• 每日簽到（+10積分）\n• 連續簽到獎勵\n• 邀請好友註冊（雙方各+50積分）' },
          { question: 'VIP 有哪些權益？', answer: 'VIP 通常可享：\n• 更完整的解讀內容\n• 更高階的建議能力\n• 優先體驗進階功能' },
          { question: '積分可以做什麼？', answer: '積分可用於解鎖進階模組與深度解讀。' },
          { question: '如何邀請好友？', answer: '在個人中心分享邀請連結，好友註冊成功後雙方都可獲得積分。' },
          { question: '簽到中斷怎麼辦？', answer: '中斷不影響已獲得總積分，但會重置連續簽到天數。' },
          { question: '資料安全嗎？', answer: '我們使用加密傳輸與存儲保護資料，並不會出售個人資訊。' },
          { question: '如何聯繫客服？', answer: '請寄信至 support@shanhai.app。' },
        ]
      : [
          { question: '山海灵境是什么？', answer: '山海灵境是结合传统命理学与 AI 的命理解读平台，提供命盘、运势和行动建议。' },
          { question: '八字算命准吗？', answer: '命理解读仅供参考娱乐，不构成任何人生决策的唯一依据。' },
          { question: '如何获得更多积分？', answer: '你可以通过：\n• 每日签到（+10积分）\n• 连续签到奖励\n• 邀请好友注册（双方各+50积分）' },
          { question: 'VIP会员有什么特权？', answer: 'VIP通常可享：\n• 更完整的解读内容\n• 更高阶的建议能力\n• 优先体验高级功能' },
          { question: '积分有什么用？', answer: '积分可用于解锁高级模块和深度解读内容。' },
          { question: '如何邀请好友？', answer: '在个人中心点击邀请并分享链接，好友注册成功后双方可获得积分。' },
          { question: '签到中断了怎么办？', answer: '中断不会影响已获得积分，但会重置连续签到天数。' },
          { question: '数据安全吗？', answer: '我们重视隐私与数据安全，采用加密传输和存储，并且不会出售个人信息。' },
          { question: '如何联系客服？', answer: '如有问题请邮件联系 support@shanhai.app。' },
        ];

  const pageTitle = language === 'en-US' ? 'FAQ' : language === 'zh-TW' ? '常見問題' : '常见问题';
  const subtitle =
    language === 'en-US'
      ? 'Common questions about Shanhai Realm'
      : language === 'zh-TW'
      ? '關於山海靈境的常見問題解答'
      : '关于山海灵境的常见问题解答';
  const contactTitle = language === 'en-US' ? 'Still need help?' : language === 'zh-TW' ? '沒有找到答案？' : '没有找到答案？';
  const contactText =
    language === 'en-US'
      ? 'Contact our support team:\nsupport@shanhai.app'
      : language === 'zh-TW'
      ? '請聯繫客服團隊：\nsupport@shanhai.app'
      : '请联系我们的客服团队：\nsupport@shanhai.app';

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{pageTitle}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {faqItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.faqItem}
            onPress={() => toggleItem(index)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Text style={styles.questionText}>{item.question}</Text>
              <Text style={styles.arrow}>{openIndex === index ? '−' : '+'}</Text>
            </View>
            {openIndex === index && (
              <Text style={styles.answerText}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{contactTitle}</Text>
          <Text style={styles.contactText}>{contactText}</Text>
        </View>
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: colors.accent,
    marginLeft: 12,
    fontWeight: 'bold',
  },
  answerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 22,
  },
  contactSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
