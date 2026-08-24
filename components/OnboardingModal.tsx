import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { trackNamedEvent } from '../src/services/analytics';
import { useI18nStore } from '../src/store/i18n';

const ONBOARDING_KEY = 'shanhai_has_seen_onboarding_v2';
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type ChoiceId = 'zi' | 'reading' | 'bazi';

export default function OnboardingModal() {
  const router = useRouter();
  const language = useI18nStore((s) => s.language);
  const [visible, setVisible] = useState(false);
  const cardWidth = Math.min(Dimensions.get('window').width - 48, 380);

  const tx = (zh: string, en: string, tw: string) =>
    language === 'en-US' ? en : language === 'zh-TW' ? tw : zh;

  const choices: Array<{
    id: ChoiceId;
    route: '/(tabs)/zi' | '/(tabs)/reading' | '/(tabs)/bazi';
    title: string;
    desc: string;
    recommended?: boolean;
  }> = [
    {
      id: 'zi',
      route: '/(tabs)/zi',
      recommended: true,
      title: tx('先测一个字', 'Read one character', '先測一個字'),
      desc: tx('不用生日，30 秒看出当下卡住的点。', 'No birth date. See what is stuck in 30 seconds.', '不用生日，30 秒看出當下卡住的點。'),
    },
    {
      id: 'reading',
      route: '/(tabs)/reading',
      title: tx('问一件要做决定的事', 'Ask a decision question', '問一件要做決定的事'),
      desc: tx('工作、去留、要不要继续，先给结论再给下一步。', 'Career, stay-or-go, or a relationship. Conclusion first.', '工作、去留、要不要繼續，先給結論再給下一步。'),
    },
    {
      id: 'bazi',
      route: '/(tabs)/bazi',
      title: tx('排一次八字', 'Cast a birth chart', '排一次八字'),
      desc: tx('看长期节奏。时辰不详也可以先排。', 'For longer rhythm. Unknown birth hour is fine.', '看長期節奏。時辰不詳也可以先排。'),
    },
  ];

  useEffect(() => {
    const check = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) setVisible(true);
      } catch {
        setVisible(true);
      }
    };
    void check();
  }, []);

  const dismiss = async (choice: ChoiceId | 'skip') => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      /* ignore */
    }
    trackNamedEvent('onboarding_choice', { choice });
    setVisible(false);
    const picked = choices.find((item) => item.id === choice);
    if (picked) router.push(picked.route);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { width: cardWidth }]}>
          <Text style={styles.kicker}>{tx('第一次来', 'First visit', '第一次來')}</Text>
          <Text style={styles.title}>{tx('先选一件卡住的事', 'Pick what is stuck', '先選一件卡住的事')}</Text>
          <Text style={styles.desc}>
            {tx(
              '对话留给第二次。现在先带走一次完整解读。',
              'Chat can wait. Finish one reading first.',
              '對話留給第二次。現在先帶走一次完整解讀。',
            )}
          </Text>
          {choices.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.choice, item.recommended && styles.choiceRecommended, webPointer]}
              onPress={() => void dismiss(item.id)}
              accessibilityRole="button"
            >
              <View style={styles.choiceTextCol}>
                <View style={styles.choiceTitleRow}>
                  <Text style={styles.choiceTitle}>{item.title}</Text>
                  {item.recommended ? (
                    <Text style={styles.choiceBadge}>{tx('推荐', 'Start here', '推薦')}</Text>
                  ) : null}
                </View>
                <Text style={styles.choiceDesc}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.skipBtn} onPress={() => void dismiss('skip')} accessibilityRole="button">
            <Text style={styles.skipText}>{tx('先随便看看', 'Look around first', '先隨便看看')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#121018',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.45)',
  },
  kicker: {
    color: 'rgba(214, 179, 106, 0.78)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5E6C8',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#B2B4C8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  choice: {
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.22)',
    backgroundColor: '#0B0D14',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  choiceRecommended: {
    borderColor: 'rgba(214, 179, 106, 0.7)',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
  },
  choiceTextCol: {
    gap: 4,
  },
  choiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choiceTitle: {
    color: '#F5F0E8',
    fontSize: 16,
    fontWeight: '800',
  },
  choiceBadge: {
    color: '#17120A',
    backgroundColor: '#D6B36A',
    overflow: 'hidden',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  choiceDesc: {
    color: '#AAB3C5',
    fontSize: 13,
    lineHeight: 19,
  },
  skipBtn: {
    marginTop: 8,
    alignItems: 'center',
    ...webPointer,
  },
  skipText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
});
