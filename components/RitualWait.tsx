import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { serifTitle } from '../constants/typography';

type Props = {
  active?: boolean;
  title?: string;
  steps: string[];
  compact?: boolean;
  intervalMs?: number;
};

export async function ensureMinDuration(startedAt: number, minMs = 3200) {
  const wait = minMs - (Date.now() - startedAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

/** 3–5 秒轻仪式：步骤文案轮换，不人为卡死请求 */
export default function RitualWait({
  active = true,
  title,
  steps,
  compact = false,
  intervalMs = 1400,
}: Props) {
  const [idx, setIdx] = useState(0);
  const safeSteps = steps.filter((s) => String(s || '').trim());

  useEffect(() => {
    if (!active || safeSteps.length < 2) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % safeSteps.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, safeSteps.length]);

  if (!active || !safeSteps.length) return null;

  const step = safeSteps[idx % safeSteps.length];

  if (compact) {
    return (
      <View style={styles.compact}>
        <ActivityIndicator size="small" color="#D6B36A" />
        <View style={styles.compactCopy}>
          {title ? <Text style={styles.compactTitle}>{title}</Text> : null}
          <Text style={styles.compactStep}>{step}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color="#D6B36A" size="large" />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.step}>{step}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 10,
  },
  title: {
    ...serifTitle,
    color: '#F4EBDC',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  step: {
    color: '#D6B36A',
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#121827',
    marginBottom: 12,
    maxWidth: '92%',
  },
  compactCopy: {
    flexShrink: 1,
    gap: 2,
  },
  compactTitle: {
    color: '#AAB3C5',
    fontSize: 12,
  },
  compactStep: {
    color: '#E9D29B',
    fontSize: 13,
    fontWeight: '600',
  },
});
