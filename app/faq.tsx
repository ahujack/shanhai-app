import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const faqItems: FAQItem[] = [
  {
    question: '山海灵境是什么？',
    answer: '山海灵境是一个结合传统命理学的AI命理分析平台。我们提供八字算命、运势预测、命盘分析等服务，帮助用户更好地了解自己的命运走向。',
  },
  {
    question: '八字算命准吗？',
    answer: '我们的命理分析基于中国传统文化中的八字命理理论，结合AI技术进行解读。命理结果仅供参考娱乐，不构成任何人生决策的依据。',
  },
  {
    question: '如何获得更多积分？',
    answer: '您可以通过以下方式获得积分：\n• 每日签到（+10积分）\n• 连续签到3天额外奖励\n• 连续签到7天额外奖励\n• 邀请好友注册（双方各+50积分）',
  },
  {
    question: 'VIP会员有什么特权？',
    answer: 'VIP会员可以享受：\n• 无限制查看完整命盘分析\n• 专属AI命理师咨询服务\n• 优先获取运势预测\n• 解锁高级命理功能\n• 去除广告',
  },
  {
    question: '积分有什么用？',
    answer: '积分可以用于：\n• 解锁高级命理功能\n• 查看详细运势分析\n• 购买VIP会员\n• 参与限时活动',
  },
  {
    question: '如何邀请好友？',
    answer: '在个人中心页面点击"邀请好友"按钮，分享您的邀请链接给朋友。朋友通过您的链接注册成功后，你们都将获得50积分奖励！',
  },
  {
    question: '签到中断了怎么办？',
    answer: '签到中断不会影响您已获得的总积分，但会重置连续签到天数。建议您每日坚持签到，以获得更高的连续签到奖励。',
  },
  {
    question: '数据安全吗？',
    answer: '我们非常重视用户隐私和数据安全。您的个人信息采用加密存储，数据传输使用SSL加密保护。我们不会出售您的个人信息。',
  },
  {
    question: '如何联系客服？',
    answer: '如有任何问题，请发送邮件至：support@shanhai.app我们会尽快回复您。',
  },
];

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>常见问题</Text>
        <Text style={styles.subtitle}>关于山海灵境的常见问题解答</Text>

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
          <Text style={styles.contactTitle}>没有找到答案？</Text>
          <Text style={styles.contactText}>
            请联系我们的客服团队：{"\n"}
            support@shanhai.app
          </Text>
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
