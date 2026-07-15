import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'shanhai_has_seen_onboarding';

const slides = [
  { title: '先说一件真实的事', desc: '关系、工作、身份规划、家庭压力\n不用整理得很完美，直接说就好', emoji: '🔮' },
  { title: '先给结论，再拆依据', desc: '先回应你真正纠结的点\n再用测字、卦象或命盘给下一步', emoji: '✨' },
  { title: '让每次追问接得上', desc: '登录后保存命盘、解读和积分\n下次回来不用从头讲起', emoji: '🌟' },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const cardWidth = Math.min(Dimensions.get('window').width - 48, 340);

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
        <View style={[styles.card, { width: cardWidth }]}>
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
            <Text style={styles.primaryBtnText}>{isLast ? '开始提问' : '下一步'}</Text>
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
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#F8D05F',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 52,
    marginBottom: 18,
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
