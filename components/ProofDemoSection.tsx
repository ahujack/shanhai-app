import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { trackNamedEvent } from '../src/services/analytics';
import { WebTextLink } from './WebTextLink';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type DemoCase = {
  id: string;
  badge: string;
  observation: string;
  verdict: string;
  route: '/(tabs)/zi' | '/(tabs)/reading' | '/(tabs)/bazi';
  href: '/character-divination' | '/i-ching-reading' | '/bazi-calculator';
  cta: string;
};

const CASES: DemoCase[] = [
  {
    id: 'zi_give',
    badge: '测字案例',
    observation: '字里有“合”，却又像在用力往外送——想给，又怕给完了自己空着。',
    verdict: '先定边界再给：不是不爱，是节奏乱了。',
    route: '/(tabs)/zi',
    href: '/character-divination',
    cta: '我也测一字',
  },
  {
    id: 'reading_offer',
    badge: '占卜案例',
    observation: '问“这份 offer 接不接”，卦象不是直接否，而是提醒窗口短、代价高。',
    verdict: '可以谈，但先把试用期目标与退出条件写清楚。',
    route: '/(tabs)/reading',
    href: '/i-ching-reading',
    cta: '去问一卦',
  },
  {
    id: 'bazi_daymaster',
    badge: '八字案例',
    observation: '日主偏弱时，不是“命不好”，而是更容易被环境影响、边界发软。',
    verdict: '本周只练一件事：重要决定先睡一晚再回。',
    route: '/(tabs)/bazi',
    href: '/bazi-calculator',
    cta: '排我的八字',
  },
];

export default function ProofDemoSection() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const current = CASES[active] || CASES[0];

  const goTry = () => {
    const dest = Platform.OS === 'web' ? current.href : current.route;
    trackNamedEvent('home_proof_cta', { caseId: current.id, route: dest });
    router.push(dest as never);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>眼见为实</Text>
      <Text style={styles.subtitle}>先看真实解读节奏：现象 → 扎心结论 → 可执行下一步</Text>

      <View style={styles.tabs}>
        {CASES.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tab, active === index && styles.tabActive, webPointer]}
            onPress={() => {
              setActive(index);
              trackNamedEvent('home_proof_tab', { caseId: item.id });
            }}
          >
            <Text style={[styles.tabText, active === index && styles.tabTextActive]}>{item.badge}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>现象观察</Text>
        <Text style={styles.body}>{current.observation}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>扎心结论</Text>
        <Text style={styles.verdict}>{current.verdict}</Text>
        {Platform.OS === 'web' ? (
          <WebTextLink
            href={current.href}
            onPress={() => trackNamedEvent('home_proof_cta', { caseId: current.id, route: current.href })}
          >
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{current.cta}</Text>
            </View>
          </WebTextLink>
        ) : (
          <TouchableOpacity style={[styles.cta, webPointer]} onPress={goTry}>
            <Text style={styles.ctaText}>{current.cta}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    marginBottom: 4,
  },
  title: {
    color: colors.tabIconSelected,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.palette.plum,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: 'rgba(214, 179, 106, 0.7)',
    backgroundColor: 'rgba(214, 179, 106, 0.12)',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.tabIconSelected,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    backgroundColor: '#14101F',
    padding: 14,
  },
  label: {
    color: 'rgba(232, 236, 243, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(214, 179, 106, 0.18)',
    marginVertical: 12,
  },
  verdict: {
    color: '#F5E6C8',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 14,
  },
  cta: {
    backgroundColor: colors.tabIconSelected,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1A1230',
    fontSize: 14,
    fontWeight: '800',
  },
});
