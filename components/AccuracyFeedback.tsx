import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, PanResponder } from 'react-native';
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
  const [dragRating, setDragRating] = useState<number | null>(null);
  const [ratingRowWidth, setRatingRowWidth] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
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

  const resolveDragRating = (x: number): number | null => {
    if (ratingRowWidth <= 0) return null;
    const clampedX = Math.min(Math.max(0, x), ratingRowWidth);
    const ratio = clampedX / ratingRowWidth;
    const next = Math.min(5, Math.max(1, Math.floor(ratio * 5) + 1));
    return next;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !submitting && !done,
    onMoveShouldSetPanResponder: () => !submitting && !done,
    onPanResponderGrant: (evt) => {
      const next = resolveDragRating(evt.nativeEvent.locationX);
      if (next) setDragRating(next);
    },
    onPanResponderMove: (evt) => {
      const next = resolveDragRating(evt.nativeEvent.locationX);
      if (next) setDragRating(next);
    },
    onPanResponderRelease: (evt) => {
      const next = resolveDragRating(evt.nativeEvent.locationX);
      setDragRating(null);
      if (next) submit(next);
    },
    onPanResponderTerminate: () => {
      setDragRating(null);
    },
  });

  const effectiveRating = dragRating ?? rating ?? 0;

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
      <View
        style={styles.row}
        onLayout={(e) => setRatingRowWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.starBtn, n <= effectiveRating && styles.starBtnActive]}
            onPress={() => submit(n)}
            disabled={submitting}
            accessibilityLabel={`${n} 星`}
          >
            <Text style={styles.starText}>{n <= effectiveRating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>1 星偏低，5 星很准（支持点击或滑动评分）</Text>
      <TouchableOpacity
        style={styles.commentToggle}
        onPress={() => setShowCommentInput((v) => !v)}
        disabled={submitting}
      >
        <Text style={styles.commentToggleText}>{showCommentInput ? '收起补充说明' : '补充说明（可选）'}</Text>
      </TouchableOpacity>
      {showCommentInput ? (
        <TextInput
          style={styles.input}
          placeholder="一句话说说哪里准/不准"
          placeholderTextColor="#888"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={200}
          editable={!submitting}
        />
      ) : null}
      {submitting ? <ActivityIndicator color="#c9a227" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.25)',
  },
  title: {
    color: '#f0e6d8',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  starBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  starBtnActive: {
    backgroundColor: 'rgba(201,162,39,0.22)',
    borderColor: 'rgba(201,162,39,0.55)',
  },
  starText: {
    fontSize: 18,
    color: '#e8c547',
  },
  hint: {
    color: '#9a8f80',
    fontSize: 11,
    marginTop: 6,
  },
  commentToggle: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  commentToggleText: {
    color: '#b7a47f',
    fontSize: 11,
  },
  input: {
    marginTop: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#eee',
    fontSize: 13,
  },
  thanks: {
    color: '#b8a88c',
    fontSize: 14,
    textAlign: 'center',
  },
});
