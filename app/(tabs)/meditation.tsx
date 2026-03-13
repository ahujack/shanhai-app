import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import theme from '../../constants/Colors';
import { meditationApi, Meditation } from '../../src/services/api';

const colors = theme.dark;

const categoryLabels: Record<string, string> = {
  calm: '静心',
  sleep: '助眠',
  anxiety: '缓解焦虑',
};

const categoryEmojis: Record<string, string> = {
  calm: '🧘',
  sleep: '🌙',
  anxiety: '😌',
};

const noiseAudioUrls: Record<'rain' | 'stream' | 'wind', string> = {
  rain: 'https://www.soundjay.com/nature/rain-01.mp3',
  stream: 'https://www.soundjay.com/nature/creek-flowing-01.mp3',
  wind: 'https://www.soundjay.com/nature/wind-01.mp3',
};

export default function MeditationScreen() {
  const insets = useSafeAreaInsets();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Meditation['category']>('all');

  useEffect(() => {
    loadMeditations();
  }, []);

  const loadMeditations = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await meditationApi.getAll();
      setMeditations(data);
    } catch (error) {
      console.error('加载冥想失败:', error);
      setError('冥想内容加载失败，请检查网络后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeditations = useMemo(() => {
    if (selectedCategory === 'all') return meditations;
    return meditations.filter((item) => item.category === selectedCategory);
  }, [meditations, selectedCategory]);

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
      <Text style={styles.guideHint}>建议：戴上耳机，跟随节奏呼吸（吸气4秒-停2秒-呼气6秒）</Text>

      <View style={styles.categoryFilterRow}>
        {(['all', 'calm', 'sleep', 'anxiety'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryChip, selectedCategory === key && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === key && styles.categoryChipTextActive]}>
              {key === 'all' ? '全部' : categoryLabels[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMeditations}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredMeditations.map((meditation) => (
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
          {filteredMeditations.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.cardDesc}>当前分类暂无冥想内容</Text>
            </View>
          )}
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [noiseMode, setNoiseMode] = useState<'none' | 'rain' | 'stream' | 'wind'>('none');
  const [audioHint, setAudioHint] = useState('白噪声已关闭');
  const soundRef = useRef<Audio.Sound | null>(null);
  const totalDuration = meditation.steps.reduce((acc, step) => acc + step.durationSeconds, 0);
  const currentStepDuration = meditation.steps[currentStep]?.durationSeconds || 0;
  const [stepRemaining, setStepRemaining] = useState(currentStepDuration);
  const elapsedDuration =
    meditation.steps.slice(0, currentStep).reduce((acc, step) => acc + step.durationSeconds, 0) +
    (currentStepDuration - stepRemaining);
  const progress = totalDuration > 0 ? elapsedDuration / totalDuration : 0;

  useEffect(() => {
    setStepRemaining(currentStepDuration);
  }, [currentStep, currentStepDuration]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch((err) => {
      console.error('设置音频模式失败:', err);
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (!meditation.steps[currentStep]) return;

    const timer = setInterval(() => {
      setStepRemaining((prev) => {
        if (prev <= 1) {
          if (currentStep < meditation.steps.length - 1) {
            setCurrentStep((idx) => idx + 1);
            return meditation.steps[currentStep + 1]?.durationSeconds || 0;
          }
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, meditation.steps]);

  useEffect(() => {
    let cancelled = false;

    const syncNoisePlayback = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        if (noiseMode === 'none') {
          setAudioHint('白噪声已关闭');
          return;
        }

        const modeLabel = noiseMode === 'rain' ? '雨声' : noiseMode === 'stream' ? '溪流' : '风声';
        if (!isPlaying) {
          setAudioHint(`已选择${modeLabel}，点击"开始"后播放`);
          return;
        }

        const sourceUrl = noiseAudioUrls[noiseMode];
        const { sound } = await Audio.Sound.createAsync(
          { uri: sourceUrl },
          { shouldPlay: true, isLooping: true, volume: 0.45 },
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setAudioHint(`${modeLabel}播放中`);
      } catch (err) {
        console.error('白噪声音频播放失败:', err);
        setAudioHint('白噪声加载失败，请切换其他模式重试');
      }
    };

    syncNoisePlayback();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => null);
        soundRef.current = null;
      }
    };
  }, [noiseMode, isPlaying]);
  
  return (
    <View style={[styles.playerContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      <View style={styles.playerContent}>
        <Text style={styles.playerEmoji}>🧘</Text>
        <Text style={styles.playerTitle}>{meditation.title}</Text>
        <Text style={styles.playerSubtitle}>{meditation.description}</Text>
        <Text style={styles.breathingHint}>呼吸节奏：吸气 4 秒 - 停 2 秒 - 呼气 6 秒</Text>
        
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
              剩余 {stepRemaining} 秒
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

        <View style={styles.noiseRow}>
          {(['none', 'rain', 'stream', 'wind'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.noiseChip, noiseMode === mode && styles.noiseChipActive]}
              onPress={() => setNoiseMode(mode)}
            >
              <Text style={[styles.noiseChipText, noiseMode === mode && styles.noiseChipTextActive]}>
                {mode === 'none' ? '静音' : mode === 'rain' ? '雨声' : mode === 'stream' ? '溪流' : '风声'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.audioHint}>{audioHint}</Text>

        <View style={styles.playerControls}>
          <TouchableOpacity
            style={styles.minorButton}
            onPress={() => setCurrentStep((v) => Math.max(0, v - 1))}
          >
            <Text style={styles.minorButtonText}>上一步</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.accent }]}
            onPress={() => setIsPlaying((v) => !v)}
          >
            <Text style={styles.playButtonText}>{isPlaying ? '暂停' : '开始'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.minorButton}
            onPress={() => {
              if (currentStep < meditation.steps.length - 1) {
                setCurrentStep((v) => v + 1);
              } else {
                onClose();
              }
            }}
          >
            <Text style={styles.minorButtonText}>{currentStep < meditation.steps.length - 1 ? '下一步' : '完成'}</Text>
          </TouchableOpacity>
        </View>
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
  guideHint: {
    color: '#9A8DB4',
    fontSize: 13,
    marginBottom: 14,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3B2C56',
    backgroundColor: '#1A1328',
  },
  categoryChipActive: {
    borderColor: '#F8D05F',
    backgroundColor: '#4C2F80',
  },
  categoryChipText: {
    color: '#9C8FB2',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#F8D05F',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    color: '#EFB7C1',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#1A0A18',
    fontWeight: 'bold',
  },
  list: {
    gap: 16,
  },
  emptyBox: {
    backgroundColor: '#161126',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
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
  breathingHint: {
    color: '#A89DBB',
    fontSize: 13,
    marginBottom: 18,
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
  noiseRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  noiseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#3B2C56',
  },
  noiseChipActive: {
    borderColor: '#F8D05F',
  },
  noiseChipText: {
    color: '#9C8FB2',
    fontSize: 12,
  },
  noiseChipTextActive: {
    color: '#F8D05F',
  },
  audioHint: {
    color: '#9689AD',
    fontSize: 12,
    marginBottom: 12,
  },
  playerControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  minorButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4C2F80',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 78,
    alignItems: 'center',
  },
  minorButtonText: {
    color: '#C8B9E0',
    fontSize: 13,
  },
  playButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 30,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  playButtonText: {
    color: '#1A0A18',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
