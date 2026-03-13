import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'shanhai_has_seen_onboarding';

const slides = [
  { title: '欢迎来到山海灵境', desc: '探索命运、测字占卜、八字命盘\n与 AI 灵伴对话，寻找内心答案', emoji: '🔮' },
  { title: '四大核心功能', desc: '对话 · 测字 · 占卜 · 八字\n抽签、冥想、每日运势', emoji: '✨' },
  { title: '开始探索', desc: '试试问我今日运势，或抽一签\n登录后保存记录、解锁更多', emoji: '🌟' },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) setVisible(true);
      } catch {
        setVisible(true);
      }
    };
    check();
  }, []);

  const handleNext = async () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      try {
        await AsyncStorage.setItem(ONBOARDING_KEY, '1');
      } catch {}
      setVisible(false);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const slide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.desc}>{slide.desc}</Text>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIndex && styles.dotActive]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>{isLast ? '开始探索' : '下一步'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>跳过</Text>
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
    backgroundColor: '#1A1328',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#F8D05F',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    color: '#B2B4C8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A2B5A',
  },
  dotActive: {
    backgroundColor: '#F8D05F',
    width: 20,
  },
  primaryBtn: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipBtn: {
    marginTop: 16,
  },
  skipText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
});
