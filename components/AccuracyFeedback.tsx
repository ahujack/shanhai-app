import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { analyticsApi, apiDebugLog } from '../src/services/api';

export type AccuracyFeedbackCategory = 'fortune_draw' | 'zi_analysis' | 'divination_reading';

type Props = {
  category: AccuracyFeedbackCategory;
  title?: string;
  context?: Record<string, unknown>;
};

const LABELS: Record<AccuracyFeedbackCategory, string> = {
  fortune_draw: '这次灵签对你有启发吗？',
  zi_analysis: '测字解读符合你的感受吗？',
  divination_reading: '这次卦象解读有帮助吗？',
};

export default function AccuracyFeedback({ category, title, context }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (stars: number) => {
    if (submitting || done) return;
    setRating(stars);
    setSubmitting(true);
    try {
      await analyticsApi.submitFeedback({
        category,
        rating: stars,
        comment: comment.trim() || undefined,
        context,
      });
      setDone(true);
    } catch (e) {
      apiDebugLog('[AccuracyFeedback] submit failed', e);
      setRating(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.thanks}>感谢你的反馈，我们会持续改进解读质量。</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title || LABELS[category]}</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.starBtn, rating === n && styles.starBtnActive]}
            onPress={() => submit(n)}
            disabled={submitting}
            accessibilityLabel={`${n} 星`}
          >
            <Text style={styles.starText}>{n <= (rating ?? 0) ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>1 星偏低，5 星很准</Text>
      <TextInput
        style={styles.input}
        placeholder="可选：一句话说说哪里准/不准"
        placeholderTextColor="#888"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
        editable={!submitting}
      />
      {submitting ? <ActivityIndicator color="#c9a227" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
  },
  title: {
    color: '#f0e6d8',
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  starBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  starBtnActive: {
    backgroundColor: 'rgba(201,162,39,0.25)',
  },
  starText: {
    fontSize: 22,
    color: '#e8c547',
  },
  hint: {
    color: '#9a8f80',
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#eee',
    fontSize: 14,
  },
  thanks: {
    color: '#b8a88c',
    fontSize: 14,
    textAlign: 'center',
  },
});
