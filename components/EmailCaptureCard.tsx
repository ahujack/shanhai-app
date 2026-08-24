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
  headline?: string;
  summary?: string;
  tip?: string;
  ctaPath?: string;
};

export default function EmailCaptureCard({
  source,
  title = '把这次结论发到邮箱',
  subtitle = '立刻寄出这一次的摘要和今日一招。不是每日运势群发，可随时忽略。',
  headline,
  summary,
  tip,
  ctaPath,
}: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<'sent' | 'saved' | false>(false);
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
      const res = await analyticsApi.subscribeEmailLead({
        email: normalized,
        source,
        headline,
        summary,
        tip,
        ctaPath,
      });
      trackNamedEvent('email_lead_submit', { source, emailed: !!res?.emailed });
      setDone(res?.emailed ? 'sent' : 'saved');
    } catch (e: any) {
      setError(String(e?.message || '提交失败，请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.doneTitle}>{done === 'sent' ? '已发出' : '已记下'}</Text>
        <Text style={styles.doneBody}>
          {done === 'sent'
            ? '这一次的结论已发到邮箱。也看一下垃圾邮件箱。'
            : '邮箱已记下，但这次信没有发出。我们不会假装已经寄到。'}
        </Text>
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
            <Text style={styles.btnText}>发送这次</Text>
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
    minWidth: 88,
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
