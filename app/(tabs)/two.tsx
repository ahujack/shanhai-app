import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/Colors';
import { meditationApi, Meditation } from '../../src/services/api';

const colors = theme.dark;

const categoryLabels: Record<string, string> = {
  calm: '静心',
  sleep: '助眠',
  anxiety: '缓解焦虑',
  focus: '专注',
};

const categoryEmojis: Record<string, string> = {
  calm: '🧘',
  sleep: '🌙',
  anxiety: '😌',
  focus: '🎯',
};

export default function MeditationScreen() {
  const insets = useSafeAreaInsets();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeditations();
  }, []);

  const loadMeditations = async () => {
    try {
      const data = await meditationApi.getAll();
      setMeditations(data);
    } catch (error) {
      console.error('加载冥想失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 冥想播放界面
  if (selectedMeditation) {
    return (
      <MeditationPlayer 
        meditation={selectedMeditation} 
        onClose={() => setSelectedMeditation(null)}
        insets={insets}
        colors={colors}
      />
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <Text style={styles.title}>🧘 静心冥想</Text>
      <Text style={styles.subtitle}>在山海世界中寻找内心的宁静</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.list}>
          {meditations.map((meditation) => (
            <TouchableOpacity
              key={meditation.id}
              style={[styles.card, { backgroundColor: colors.surface }]}
              onPress={() => setSelectedMeditation(meditation)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>
                  {categoryEmojis[meditation.category] || '🧘'}
                </Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{meditation.title}</Text>
                  <Text style={styles.cardCategory}>{categoryLabels[meditation.category]}</Text>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{meditation.durationMinutes}分钟</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{meditation.description}</Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => setSelectedMeditation(meditation)}
              >
                <Text style={styles.startButtonText}>开始</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// 冥想播放器组件
function MeditationPlayer({ 
  meditation, 
  onClose, 
  insets, 
  colors 
}: { 
  meditation: Meditation; 
  onClose: () => void;
  insets: any;
  colors: any;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalDuration = meditation.steps.reduce((acc, step) => acc + step.durationSeconds, 0);
  const progress = meditation.steps
    .slice(0, currentStep)
    .reduce((acc, step) => acc + step.durationSeconds, 0) / totalDuration;
  
  return (
    <View style={[styles.playerContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.playerContent}>
        <Text style={styles.playerEmoji}>🧘</Text>
        <Text style={styles.playerTitle}>{meditation.title}</Text>
        <Text style={styles.playerSubtitle}>{meditation.description}</Text>
        
        {/* 进度条 */}
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        
        {/* 当前步骤 */}
        {meditation.steps[currentStep] && (
          <View style={[styles.stepCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.stepTitle}>
              {meditation.steps[currentStep].order}. {meditation.steps[currentStep].title}
            </Text>
            <Text style={styles.stepDesc}>
              {meditation.steps[currentStep].description}
            </Text>
            <Text style={styles.stepDuration}>
              {meditation.steps[currentStep].durationSeconds}秒
            </Text>
          </View>
        )}
        
        {/* 步骤指示器 */}
        <View style={styles.stepIndicators}>
          {meditation.steps.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.stepDot, 
                idx === currentStep && styles.stepDotActive,
                idx < currentStep && styles.stepDotCompleted
              ]} 
            />
          ))}
        </View>
        
        {/* 控制按钮 */}
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: colors.accent }]}
          onPress={() => {
            if (currentStep < meditation.steps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              onClose();
            }
          }}
        >
          <Text style={styles.playButtonText}>
            {currentStep < meditation.steps.length - 1 ? '下一步' : '完成'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
  },
  subtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    marginTop: 4,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7F6F0',
  },
  cardCategory: {
    fontSize: 13,
    color: '#8D8DAA',
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: '#4C2F80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: 14,
    color: '#B2B4C8',
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#1A0A18',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // 播放器样式
  playerContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2B1F3C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#F7F6F0',
    fontSize: 20,
  },
  playerContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  playerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 8,
  },
  playerSubtitle: {
    fontSize: 14,
    color: '#8D8DAA',
    textAlign: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2F2342',
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F8D05F',
    borderRadius: 3,
  },
  stepCard: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7F6F0',
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 16,
    color: '#B2B4C8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  stepDuration: {
    fontSize: 14,
    color: '#F8D05F',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2F2342',
  },
  stepDotActive: {
    backgroundColor: '#F8D05F',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: '#4C2F80',
  },
  playButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  playButtonText: {
    color: '#1A0A18',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
