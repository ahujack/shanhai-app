import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/Colors';
import { readingApi, CreateReadingDto, DivinationResult } from '../../src/services/api';
import { useUserStore } from '../../src/store/user';

const colors = theme.dark;

export default function ReadingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<CreateReadingDto['category']>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DivinationResult | null>(null);

  const categories = [
    { value: 'general', label: '综合' },
    { value: 'career', label: '事业' },
    { value: 'love', label: '感情' },
    { value: 'wealth', label: '财运' },
    { value: 'health', label: '健康' },
    { value: 'growth', label: '成长' },
  ] as const;

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const dto: CreateReadingDto = {
        question: question.trim(),
        category,
        userId: user?.id,
      };
      const reading = await readingApi.create(dto);
      setResult(reading);
    } catch (error) {
      console.error('占卜失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
  };

  if (result) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.sectionTitle}>🔮 占卜结果</Text>
        
        {/* 卦象信息 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.hexagramHeader}>
            <Text style={styles.hexagramName}>{result.hexagram.originalName}</Text>
            <Text style={styles.hexagramOriginal}>本卦：{result.hexagram.original}</Text>
            {result.hexagram.original !== result.hexagram.changed && (
              <Text style={styles.hexagramChanged}>变卦：{result.hexagram.changedName}</Text>
            )}
          </View>
          
          {/* 爻辞 */}
          <View style={styles.yaoContainer}>
            <Text style={styles.yaoTitle}>六爻</Text>
            {result.hexagram.yaoDescriptions.map((yao, idx) => (
              <Text key={idx} style={styles.yaoText}>{yao}</Text>
            ))}
          </View>
        </View>

        {/* 解读 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>📖 解读</Text>
          <Text style={styles.interpretationText}>{result.interpretation.overall}</Text>
          <Text style={styles.interpretationText}>{result.interpretation.situation}</Text>
          <Text style={styles.interpretationText}>{result.interpretation.guidance}</Text>
        </View>

        {/* 建议 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>💡 建议</Text>
          {result.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recItem}>
              <Text style={styles.recNumber}>{idx + 1}</Text>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* 时机 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>⏰ 时机判断</Text>
          <Text style={styles.timingText}>✅ {result.timing.suitable}</Text>
          <Text style={styles.timingText}>⚠️ {result.timing.caution}</Text>
        </View>

        {/* 再次占卜 */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>再次占卜</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <Text style={styles.sectionTitle}>🔮 深度解读</Text>
      
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.hint}>将心中困惑如实道来，字数不限，可附加时间、人物或地点，以便匹配更精准的卦象。</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="例：我即将换工作，但对新团队心里没底，也担心签证问题..."
          placeholderTextColor="#6F6287"
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        {/* 分类选择 */}
        <Text style={styles.categoryLabel}>选择占卜类型</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryButton,
                category === cat.value && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={[
                styles.categoryText,
                category === cat.value && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A0A18" />
          ) : (
            <Text style={styles.submitButtonText}>开始解读</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* 说明 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.cardTitle}>📋 解读包含内容</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 卦象摘要：六爻起卦 + 变爻提示</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 多维解读：事业 / 情感 / 心理</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 行动建议：下一步可执行的三条建议</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• 文化溯源：相关典籍出处与启发</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  hint: {
    color: '#8D8DAA',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1A1328',
    borderRadius: 16,
    padding: 16,
    color: '#F7F6F0',
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#322243',
    marginBottom: 16,
  },
  categoryLabel: {
    color: '#B2B4C8',
    fontSize: 14,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#322243',
  },
  categoryButtonActive: {
    backgroundColor: '#4C2F80',
    borderColor: '#F8D05F',
  },
  categoryText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#F8D05F',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  submitButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 结果页样式
  hexagramHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  hexagramName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 8,
  },
  hexagramOriginal: {
    color: '#B2B4C8',
    fontSize: 16,
  },
  hexagramChanged: {
    color: '#C8A6FF',
    fontSize: 16,
    marginTop: 4,
  },
  yaoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
    paddingTop: 16,
  },
  yaoTitle: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  yaoText: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 16,
  },
  interpretationText: {
    color: '#F7F6F0',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recNumber: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  recText: {
    color: '#B2B4C8',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  timingText: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#4C2F80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
});
