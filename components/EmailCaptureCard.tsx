import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import theme from '../constants/Colors';
import { analyticsApi } from '../src/services/api';
import { trackNamedEvent } from '../src/services/analytics';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  source: string;
  title?: string;
  subtitle?: string;
};

export default function EmailCaptureCard({
  source,
  title = '把完整版发到邮箱',
  subtitle = 'Web 没有推送提醒。留下邮箱，我们会把每日运势/完整解读摘要发到你的收件箱（可随时退订）。',
}: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('请输入有效邮箱');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await analyticsApi.subscribeEmailLead({ email: normalized, source });
      trackNamedEvent('email_lead_submit', { source });
      setDone(true);
    } catch (e: any) {
      setError(String(e?.message || '提交失败，请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.doneTitle}>已收下 ✓</Text>
        <Text style={styles.doneBody}>完整版摘要会发到你的邮箱。记得也看一下垃圾邮件箱。</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor="#6B6280"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled, webPointer]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1230" size="small" />
          ) : (
            <Text style={styles.btnText}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
  },
  title: {
    color: colors.tabIconSelected,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.palette.plum,
    backgroundColor: '#120C1C',
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    fontSize: 14,
  },
  btn: {
    backgroundColor: colors.tabIconSelected,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#1A1230',
    fontSize: 14,
    fontWeight: '800',
  },
  error: {
    marginTop: 8,
    color: '#FCA5A5',
    fontSize: 12,
  },
  doneTitle: {
    color: colors.tabIconSelected,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  doneBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
