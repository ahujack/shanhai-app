import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'shanhai_has_seen_onboarding';

const slides = [
  { title: '先说出卡住你的事', desc: '关系、工作、身份规划、家庭压力\n不用整理得很完美，直接说就好', emoji: '🔮' },
  { title: '先给结论，再拆依据', desc: '灵伴会先回应你真正纠结的点\n再用八字、测字或卦象给下一步', emoji: '✨' },
  { title: '把陪伴留下来', desc: '登录后保存命盘、解读和积分\n让每次追问都接得上上一次', emoji: '🌟' },
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
            <Text style={styles.primaryBtnText}>{isLast ? '先说一件事' : '下一步'}</Text>
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
