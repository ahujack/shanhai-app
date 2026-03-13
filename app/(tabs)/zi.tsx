import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../constants/Colors';
import { ziApi, ZiResult, handwritingApi } from '../../src/services/api';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { usePersonaStore } from '../../src/store/persona';
import { useUserStore } from '../../src/store/user';
import HandwritingCanvas from '../../components/HandwritingCanvas';

export default function ZiScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillZi?: string; fromChat?: string }>();
  const fromChat = (Array.isArray(params.fromChat) ? params.fromChat[0] : params.fromChat) === '1';
  const [inputZi, setInputZi] = useState('');
  const [result, setResult] = useState<ZiResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [handwritingStage, setHandwritingStage] = useState<'idle' | 'recognizing' | 'analyzing'>('idle');
  const [ritualReady, setRitualReady] = useState(false);
  const [ritualCountdown, setRitualCountdown] = useState(0);
  const [showColdReading, setShowColdReading] = useState(true);
  // 新增：手写模式
  const [isHandwritingMode, setIsHandwritingMode] = useState(false);
  // 用户选择的测字方向（单选）
  const [selectedAspect, setSelectedAspect] = useState('');
  const [customAspect, setCustomAspect] = useState('');
  const oracleUnlockAnim = useRef(new Animated.Value(0)).current;
  
  // 可选的测字方面
  const aspectOptions = ['事业', '财运', '婚姻', '学业', '健康', '人际关系'];
  
  // 切换方向（单选，再次点击可取消）
  const toggleAspect = (aspect: string) => {
    setSelectedAspect((prev) => (prev === aspect ? '' : aspect));
  };

  const getFocusAspect = (): string | undefined => {
    const custom = customAspect.trim();
    if (custom) return custom;
    if (selectedAspect) return selectedAspect;
    return undefined;
  };

  const getWuxingTheme = (wuxing?: string) => {
    const map: Record<string, { bg: string; glow: string }> = {
      木: { bg: '#102317', glow: 'rgba(76, 175, 80, 0.16)' },
      火: { bg: '#2A1515', glow: 'rgba(244, 67, 54, 0.16)' },
      土: { bg: '#231B15', glow: 'rgba(141, 110, 99, 0.18)' },
      金: { bg: '#262315', glow: 'rgba(255, 193, 7, 0.18)' },
      水: { bg: '#121E2D', glow: 'rgba(33, 150, 243, 0.18)' },
    };
    return map[wuxing || ''] || { bg: '#1a1a2e', glow: 'rgba(255,255,255,0.06)' };
  };
  
  // 聊天相关
  const { messages, sendMessage } = useChatStore();
  const { active: persona } = usePersonaStore();
  const { user } = useUserStore();
  const wuxingTheme = getWuxingTheme(result?.zi?.wuxing);
  const shouldShowOracleUnlock = !!(
    result?.zi.oracleBone?.previewLocked &&
    (result.zi.oracleBone.totalImages || 0) > (result.zi.oracleBone.shownImages || 0)
  );
  const lockedImageCount = shouldShowOracleUnlock
    ? (result?.zi.oracleBone?.totalImages || 0) - (result?.zi.oracleBone?.shownImages || 0)
    : 0;
  const ziStateStorageKey = `zi_screen_state_${user?.id || 'guest'}`;

  useEffect(() => {
    if (!shouldShowOracleUnlock) {
      oracleUnlockAnim.setValue(0);
      return;
    }
    oracleUnlockAnim.setValue(0);
    Animated.sequence([
      Animated.timing(oracleUnlockAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(oracleUnlockAnim, {
        toValue: 0.85,
        duration: 240,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(oracleUnlockAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [oracleUnlockAnim, shouldShowOracleUnlock, result?.zi.zi]);

  const oracleUnlockAnimStyle = {
    opacity: oracleUnlockAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 1],
    }),
    transform: [
      {
        scale: oracleUnlockAnim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [0.96, 1.03, 1],
        }),
      },
    ],
  };

  const analyzeZiInput = async (rawZi: string, focusAspect?: string) => {
    const zi = rawZi.trim().charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) {
      Alert.alert('提示', '请输入一个有效的汉字');
      return;
    }

    setIsLoading(true);
    try {
      const data = await ziApi.analyze(zi, user?.id, focusAspect);
      setResult(data);
    } catch (err) {
      console.error('测字失败:', err);
      Alert.alert(
        '测字失败',
        '连接出现问题，请检查网络后重试',
        [
          { text: '知道了', style: 'cancel' },
          { text: '重试', onPress: () => analyzeZiInput(rawZi, focusAspect) },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const prefill = (params.prefillZi || '').trim();
    if (!prefill) return;
    const zi = prefill.charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) return;
    setInputZi(zi);
    analyzeZiInput(zi).catch(() => null);
  }, [params.prefillZi]);

  React.useEffect(() => {
    const prefill = (params.prefillZi || '').trim();
    if (prefill) return;
    let cancelled = false;
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(ziStateStorageKey);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw) as {
          inputZi?: string;
          result?: ZiResult | null;
          selectedAspect?: string;
          customAspect?: string;
          isHandwritingMode?: boolean;
          showColdReading?: boolean;
        };
        if (parsed.inputZi) setInputZi(parsed.inputZi);
        if (parsed.result) setResult(parsed.result);
        if (parsed.selectedAspect) setSelectedAspect(parsed.selectedAspect);
        if (parsed.customAspect) setCustomAspect(parsed.customAspect);
        if (typeof parsed.isHandwritingMode === 'boolean') setIsHandwritingMode(parsed.isHandwritingMode);
        if (typeof parsed.showColdReading === 'boolean') setShowColdReading(parsed.showColdReading);
      } catch {
        // ignore restore failure
      }
    };
    loadState();
    return () => {
      cancelled = true;
    };
  }, [params.prefillZi, ziStateStorageKey]);

  React.useEffect(() => {
    const payload = {
      inputZi,
      result,
      selectedAspect,
      customAspect,
      isHandwritingMode,
      showColdReading,
    };
    AsyncStorage.setItem(ziStateStorageKey, JSON.stringify(payload)).catch(() => null);
  }, [ziStateStorageKey, inputZi, result, selectedAspect, customAspect, isHandwritingMode, showColdReading]);

  React.useEffect(() => {
    if (!isHandwritingMode) return;
    setRitualReady(false);
    setRitualCountdown(0);
  }, [isHandwritingMode]);

  React.useEffect(() => {
    if (ritualCountdown <= 0) return;
    const timer = setTimeout(() => {
      setRitualCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setRitualReady(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [ritualCountdown]);

  // 打字模式测字
  const handleAnalyze = async () => {
    if (!inputZi.trim()) {
      Alert.alert('提示', '请输入一个汉字');
      return;
    }
    await analyzeZiInput(inputZi.trim(), getFocusAspect());
  };

  // 手写模式识别并测字
  const handleHandwritingRecognize = async (svgString: string) => {
    if (!ritualReady) {
      Alert.alert('提示', '先做3秒静心，再开始写字（也可以点击“跳过，直接写字”）。');
      return;
    }
    console.log('开始手写识别，SVG长度:', svgString.length);
    setIsLoading(true);
    setHandwritingStage('recognizing');
    try {
      console.log('调用 handwritingApi.recognize...');
      const recognized = await handwritingApi.recognize(svgString);
      const recognizedZi = recognized.recognizedZi?.trim().charAt(0);
      if (!recognizedZi || !/[\u4e00-\u9fa5]/.test(recognizedZi)) {
        Alert.alert('😔 识别失败', '未能识别出汉字，请重新书写');
        return;
      }
      setInputZi(recognizedZi);
      setHandwritingStage('analyzing');
      const analysis = await ziApi.analyze(recognizedZi, user?.id, getFocusAspect());
      setResult(analysis);
      Alert.alert('🎉 识别成功', `识别到汉字：${recognizedZi}\n\n当前已完成首轮解读，你可以继续做方向深挖。`);
    } catch (error: any) {
      console.error('手写识别失败:', error);
      Alert.alert('错误', error?.message || '手写识别失败，请稍后重试');
    } finally {
      setHandwritingStage('idle');
      setIsLoading(false);
    }
  };

  const startRitualCountdown = () => {
    if (isLoading) return;
    setRitualReady(false);
    setRitualCountdown(3);
  };

  const skipRitual = () => {
    setRitualCountdown(0);
    setRitualReady(true);
  };

  const getWuxingColor = (wuxing: string) => {
    const colors: Record<string, string> = {
      木: '#4CAF50',
      火: '#F44336',
      土: '#8D6E63',
      金: '#FFC107',
      水: '#2196F3',
    };
    return colors[wuxing] || '#999';
  };

  const getJixiongColor = (jixiong: string) => {
    return jixiong === '吉' ? '#4CAF50' : jixiong === '凶' ? '#F44336' : '#FF9800';
  };

  const parseGuaDetail = (text?: string) => {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return {
        core: '卦义主线：当前卦象偏中性，先稳态观察。',
        reminder: '当下提醒：先把关键变量看清，再决定推进节奏。',
        action: '可执行动作：先做一件最小可执行动作，24小时内验证反馈。',
      };
    }
    const parts = normalized
      .split(/[。！？]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const core = parts[0] || normalized;
    const reminder =
      parts.find((item) => /当前|宜|忌|建议|窗口|风险|收敛|推进/.test(item)) ||
      parts[1] ||
      '先稳住节奏，再看外部反馈。';
    const action =
      parts.find((item) => /先|再|可以|适合|行动|执行|步骤|复盘/.test(item)) ||
      parts[2] ||
      '先做一件最小可执行动作，并在48小时内复盘。';
    return {
      core: `卦义主线：${core}`,
      reminder: `当下提醒：${reminder}`,
      action: `可执行动作：${action}`,
    };
  };

  const handleFocusedReanalyze = async () => {
    const zi = (result?.zi?.zi || inputZi || '').trim().charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) {
      Alert.alert('提示', '请先识别或输入一个字');
      return;
    }
    const focus = getFocusAspect();
    if (!focus) {
      Alert.alert('提示', '请先选择一个解读方向');
      return;
    }
    await analyzeZiInput(zi, focus);
  };

  const goChatWithZiCooldown = () => {
    const cooldownUntil = Date.now() + 15 * 60 * 1000;
    router.push({
      pathname: '/',
      params: { skipZiNudgeUntil: String(cooldownUntil) },
    });
  };

  const goProbingChat = () => {
    if (!result) return;
    const focus = getFocusAspect() || result.interpretation.focusReading?.focus || '综合';
    const probing = result.zi.probingQuestion || `围绕「${focus}」，你最想先解决哪一步？`;
    const aiMessage: ChatMessage = {
      id: `ai_probe_${Date.now()}`,
      role: 'assistant',
      content: `我们围绕「${focus}」继续深聊。\n${probing}`,
      timestamp: new Date(),
    };
    goChatWithZiCooldown();
    setTimeout(() => {
      useChatStore.setState((state) => ({
        messages: [...state.messages, aiMessage],
      }));
    }, 450);
  };
  const goActionPlanChat = () => {
    if (!result?.interpretation.focusReading) return;
    const focus = result.interpretation.focusReading.focus;
    const action = result.interpretation.focusReading.actionPlan[0] || '先从一件最小动作开始。';
    const aiMessage: ChatMessage = {
      id: `ai_action_${Date.now()}`,
      role: 'assistant',
      content: `我们围绕「${focus}」把行动计划落地。\n第一步建议：${action}\n你做完这一步后告诉我，我继续给你下一步。`,
      timestamp: new Date(),
    };
    goChatWithZiCooldown();
    setTimeout(() => {
      useChatStore.setState((state) => ({
        messages: [...state.messages, aiMessage],
      }));
    }, 450);
  };
  const guaDetail = parseGuaDetail(result?.zi?.guaXiang);
  const handwritingProgress = handwritingStage === 'recognizing' ? 42 : handwritingStage === 'analyzing' ? 86 : 0;
  const handwritingProgressText =
    handwritingStage === 'recognizing'
      ? '识别中（1/2）'
      : handwritingStage === 'analyzing'
      ? '解读中（2/2）'
      : '';
  const ritualBreathHint =
    ritualCountdown <= 0
      ? '准备好了就落笔。'
      : ritualCountdown >= 2
      ? `吸气... ${ritualCountdown}`
      : '呼气... 1';
  
  // 点击继续聊聊，AI自动发送一个问题，等待用户回答
  const handleFollowUpQuestion = async (_question: string) => {
    const zi = result?.zi?.zi || '';
    const followUpQuestions = [
      `你写的"${zi}"字，中间的部分你想表达什么？`,
      `对于"${zi}"这个字，你首先想到的是什么？`,
      `为什么选择写"${zi}"这个字？有什么特别的意义吗？`,
      `写"${zi}"字的时候，你的心情是怎样的？`,
      `如果让你用"${zi}"字来形容最近的生活，你会怎么解释？`,
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    
    // 跳转到聊天界面
    goChatWithZiCooldown();
    
    // 直接添加AI消息（不是用户消息）
    setTimeout(() => {
      // 模拟AI发送问题
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: randomQuestion,
        timestamp: new Date(),
      };
      // 添加到聊天记录
      useChatStore.setState((state) => ({ 
        messages: [...state.messages, aiMessage] 
      }));
    }, 500);
  };
  
  // 打字模式测字完成后自动发送后续问题
  const autoSendFollowUpQuestion = async (zi: string) => {
    const followUpQuestions = [
      `你写的"${zi}"字，中间的部分你想表达什么？`,
      `对于"${zi}"这个字，你首先想到的是什么？`,
      `为什么选择写"${zi}"这个字？有什么特别的意义吗？`,
      `写"${zi}"字的时候，你的心情是怎样的？`,
      `如果让你用"${zi}"字来形容最近的生活，你会怎么解释？`,
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    
    // 跳转到聊天界面并发送问题
    goChatWithZiCooldown();
    
    setTimeout(() => {
      // 模拟AI发送问题
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: randomQuestion,
        timestamp: new Date(),
      };
      // 添加到聊天记录
      useChatStore.setState((state) => ({ 
        messages: [...state.messages, aiMessage] 
      }));
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: wuxingTheme.bg }]}>
      <View pointerEvents="none" style={[styles.wuxingAura, { backgroundColor: wuxingTheme.glow }]} />
      <View style={styles.header}>
        <Text style={styles.title}>🔮 测字问心</Text>
        <Text style={styles.subtitle}>字是心画，写一字可窥心</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 输入模式切换 - 精简置顶 */}
        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isHandwritingMode && styles.modeButtonActive,
            ]}
            onPress={() => setIsHandwritingMode(false)}
          >
            <Text style={[
              styles.modeButtonText,
              !isHandwritingMode && styles.modeButtonTextActive,
            ]}>
              ⌨️ 打字输入
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              isHandwritingMode && styles.modeButtonActive,
            ]}
            onPress={() => setIsHandwritingMode(true)}
          >
            <Text style={[
              styles.modeButtonText,
              isHandwritingMode && styles.modeButtonTextActive,
            ]}>
              ✍️ 手写输入
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入区域 - 书写框优先展示 */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {isHandwritingMode ? '请在手写板写字' : '请写一字'}
          </Text>
          <Text style={styles.hint}>
            {isHandwritingMode 
              ? '在下方手写板上写下你想测的汉字'
              : '根据《测字有术》，字如其人。心有所想，字有所现。'}
          </Text>
          
          {isHandwritingMode ? (
            // 手写模式 - 书写框在上，静心提示在下
            <View style={styles.handwritingSection}>
              <View
                style={[styles.handwritingCanvasWrap, !ritualReady && styles.handwritingCanvasWrapLocked]}
                pointerEvents={ritualReady ? 'auto' : 'none'}
              >
                <HandwritingCanvas 
                  onRecognize={handleHandwritingRecognize}
                  isRecognizing={isLoading}
                  wuxing={result?.zi?.wuxing}
                />
              </View>
              {/* 静心提示 - 放在书写框下方 */}
              {!ritualReady && (
                <View style={styles.ritualCountdownCard}>
                  <Text style={styles.ritualCountdownTitle}>🫧 写字前先静心</Text>
                  <Text style={styles.ritualCountdownText}>
                    把注意力放在你此刻最想问的一件事上，再落笔，解读会更聚焦。
                  </Text>
                  {ritualCountdown > 0 && (
                    <Text style={styles.ritualBreathHint}>{ritualBreathHint}</Text>
                  )}
                  <View style={styles.ritualCountdownActions}>
                    <TouchableOpacity
                      style={[
                        styles.ritualCountdownPrimary,
                        ritualCountdown > 0 && styles.ritualCountdownPrimaryDisabled,
                      ]}
                      onPress={startRitualCountdown}
                      disabled={ritualCountdown > 0}
                    >
                      <Text style={styles.ritualCountdownPrimaryText}>
                        {ritualCountdown > 0 ? `静心中 ${ritualCountdown}s` : '开始3秒静心'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ritualCountdownSecondary} onPress={skipRitual}>
                      <Text style={styles.ritualCountdownSecondaryText}>跳过，直接写字</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {handwritingStage !== 'idle' && (
                <View style={styles.progressWrap}>
                  <Text style={styles.progressText}>{handwritingProgressText}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${handwritingProgress}%` }]} />
                  </View>
                </View>
              )}
            </View>
          ) : (
            // 打字模式
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputZi}
                onChangeText={setInputZi}
                placeholder="输入一个汉字"
                placeholderTextColor="#999"
                maxLength={1}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.dark.tint }]}
                onPress={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>开始测字</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 结果展示 */}
        {result && (
          <>
            {/* 冷读话术 - 首先展示 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.collapseHeader, { backgroundColor: theme.dark.card }]}
                onPress={() => setShowColdReading(!showColdReading)}
              >
                <Text style={styles.collapseTitle}>💫 AI直觉解读</Text>
                <Text style={styles.collapseIcon}>{showColdReading ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              
              {showColdReading && (
                <View style={[styles.collapseContent, { backgroundColor: theme.dark.card }]}>
                  {result.coldReadings.map((reading, index) => (
                    <Text key={index} style={styles.coldReadingText}>
                      {reading}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* 汉字解析 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 字形拆解</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.ziDisplay}>
                  <Text style={styles.ziText}>{result.zi.zi}</Text>
                </View>
                
                <View style={styles.ziInfo}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>笔画</Text>
                      <Text style={styles.infoValue}>{result.zi.bihua} 画</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>部首</Text>
                      <Text style={styles.infoValue}>{result.zi.bushou}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>五行</Text>
                      <Text style={[styles.infoValue, { color: getWuxingColor(result.zi.wuxing) }]}>
                        {result.zi.wuxing}
                      </Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>阴阳</Text>
                      <Text style={styles.infoValue}>{result.zi.yinyang}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>吉凶</Text>
                      <Text style={[styles.infoValue, { color: getJixiongColor(result.zi.jixiong) }]}>
                        {result.zi.jixiong}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ziMetaSource}>
                  数据来源：笔画/部首-汉典；五行-部首五行归属；阴阳-笔画奇偶；吉凶-字义传统分类
                </Text>
              </View>
            </View>

            {/* 我想测哪方面 - 放在识别结果下面 */}
            <View style={styles.aspectSection}>
              <Text style={styles.aspectTitle}>💭 我想测：</Text>
              <View style={styles.aspectTags}>
                {aspectOptions.map((aspect) => (
                  <TouchableOpacity
                    key={aspect}
                    style={[
                      styles.aspectTag,
                      selectedAspect === aspect && styles.aspectTagSelected
                    ]}
                    onPress={() => toggleAspect(aspect)}
                  >
                    <Text style={[
                      styles.aspectTagText,
                      selectedAspect === aspect && styles.aspectTagTextSelected
                    ]}>
                      {aspect}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.customAspectInput}
                value={customAspect}
                onChangeText={setCustomAspect}
                placeholder="或输入其他方面..."
                placeholderTextColor="#666"
              />
              <View style={styles.refineInlineWrap}>
                <Text style={styles.refineInlineHint}>
                  已识别「{result.zi.zi}」，选择方向后可重解读
                </Text>
                <TouchableOpacity
                  style={[
                    styles.refineInlineBtn,
                    (!result || isLoading) && styles.refineInlineBtnDisabled,
                  ]}
                  onPress={handleFocusedReanalyze}
                  disabled={!result || isLoading}
                >
                  <Text style={styles.refineInlineBtnText}>
                    {isLoading
                      ? (result?.interpretation.focusReading ? '重解读中...' : '解读中...')
                      : '按方向重解读'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 部件拆解 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧩 部件拆解</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.componentsRow}>
                  {result.zi.components.map((comp, index) => (
                    <View key={index} style={styles.componentBox}>
                      <Text style={styles.componentText}>{comp}</Text>
                      <Text style={styles.componentMeaning}>
                        {result.zi.componentMeanings[index]}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.associativeText}>
                  💡 {result.zi.associativeMeaning}
                </Text>
              </View>
            </View>

            {/* 技法细化 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧠 技法细化（离合 / 填字 / 投射）</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <Text style={styles.skillHead}>离合法</Text>
                {(result.zi.lihefa || []).map((line, index) => (
                  <Text key={`lihefa_${index}`} style={styles.skillText}>- {line}</Text>
                ))}

                <Text style={styles.skillHead}>填字格</Text>
                {(result.zi.tianziGe || []).map((line, index) => (
                  <Text key={`tianzi_${index}`} style={styles.skillText}>- {line}</Text>
                ))}

                <Text style={styles.skillHead}>象形投射</Text>
                <Text style={styles.skillText}>{result.zi.imageryInference || '当前暂无象形投射结果。'}</Text>

                <Text style={styles.skillHead}>反问引导</Text>
                <Text style={styles.skillText}>{result.zi.probingQuestion || '这个字里你最在意哪一部分？'}</Text>
                <TouchableOpacity style={styles.probingChatBtn} onPress={goProbingChat}>
                  <Text style={styles.probingChatText}>💬 去对话里深聊这个反问</Text>
                </TouchableOpacity>
              </View>
            </View>

            {result.interpretation.focusReading && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧭 方向详细解读：{result.interpretation.focusReading.focus}</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  <Text style={styles.focusSummary}>{result.interpretation.focusReading.summary}</Text>
                  <Text style={styles.focusSubhead}>关键锚点</Text>
                  {result.interpretation.focusReading.anchors.map((item, idx) => (
                    <Text key={`anchor_${idx}`} style={styles.focusItem}>- {item}</Text>
                  ))}
                  <Text style={styles.focusSubhead}>风险信号</Text>
                  {result.interpretation.focusReading.riskSignals.map((item, idx) => (
                    <Text key={`risk_${idx}`} style={styles.focusItem}>- {item}</Text>
                  ))}
                  <Text style={styles.focusSubhead}>行动计划</Text>
                  {result.interpretation.focusReading.actionPlan.map((item, idx) => (
                    <Text key={`plan_${idx}`} style={styles.focusItem}>- {item}</Text>
                  ))}
                  <TouchableOpacity style={styles.focusChatBtn} onPress={goActionPlanChat}>
                    <Text style={styles.focusChatBtnText}>💬 去对话里执行行动计划</Text>
                  </TouchableOpacity>
                  {!!result.interpretation.focusReading.llmEnhanced && (
                    <Text style={styles.focusLlmTag}>已启用大模型定向增强</Text>
                  )}
                </View>
              </View>
            )}
            {!!result.interpretation.premiumHint && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.premiumHintCard}
                  onPress={() => router.push({ pathname: '/points', params: { focus: 'vip' } })}
                >
                  <Text style={styles.premiumHintText}>🔓 {result.interpretation.premiumHint}</Text>
                  <Text style={styles.premiumHintLink}>点击升级解锁完整版方向推演</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 甲骨文象形维度 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🪨 甲骨文象形</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <Text style={styles.skillText}>
                  {result.zi.oracleBone?.interpretation || '甲骨象形：当前暂无该字图像，先用部件与意象进行辅助解读。'}
                </Text>
                <Text style={styles.oracleTip}>
                  {result.zi.oracleBone?.note || '说明：部分字暂无公开甲骨图像。'}
                </Text>
                {!!result.zi.oracleBone?.imageUrls?.length && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.oracleImageRow}
                  >
                    {result.zi.oracleBone.imageUrls.map((url, idx) => (
                      <View key={`${url}_${idx}`} style={styles.oracleImageBox}>
                        <Image source={{ uri: url }} style={styles.oracleImage} resizeMode="contain" />
                      </View>
                    ))}
                  </ScrollView>
                )}
                {!!result.zi.oracleBone?.totalImages && (
                  <Text style={styles.oracleCounter}>
                    已展示 {result.zi.oracleBone.shownImages}/{result.zi.oracleBone.totalImages} 张异体图
                  </Text>
                )}
                {shouldShowOracleUnlock && (
                    <>
                      <Text style={styles.oracleRemainText}>
                        还差 {lockedImageCount} 张未解锁
                      </Text>
                      <Animated.View style={oracleUnlockAnimStyle}>
                        <TouchableOpacity
                          style={styles.oracleUnlockBtn}
                          onPress={() => router.push({ pathname: '/points', params: { focus: 'vip' } })}
                        >
                          <Text style={styles.oracleUnlockText}>查看完整异体图与差异解读</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </>
                  )}
                <Text style={styles.oracleSource}>
                  图源：{result.zi.oracleBone?.source || 'JiaGuWen 开源字表'}
                </Text>
              </View>
            </View>

            {/* 易经对应 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📜 易经对应</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.yijingRow}>
                  <View style={styles.yijingBox}>
                    <Text style={styles.yijingLabel}>卦象</Text>
                    <Text style={styles.yijingValue}>{result.zi.yijing}</Text>
                  </View>
                  <View style={styles.yijingBox}>
                    <Text style={styles.yijingLabel}>五行</Text>
                    <Text style={[styles.yijingValue, { color: getWuxingColor(result.zi.wuxing) }]}>
                      {result.zi.wuxing}
                    </Text>
                  </View>
                </View>
                <View style={styles.guaDetailWrap}>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>🧭</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.core}</Text>
                  </View>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>⚠️</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.reminder}</Text>
                  </View>
                  <View style={styles.guaDetailItemRow}>
                    <Text style={styles.guaDetailIcon}>✅</Text>
                    <Text style={styles.guaDetailItem}>{guaDetail.action}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 笔迹分析 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✍️ 笔迹心理学</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.handwritingItem}>
                  <Text style={styles.handwritingLabel}>力度</Text>
                  <Text style={styles.handwritingValue}>
                    {result.handwriting.pressure === 'heavy' ? '较重' : 
                     result.handwriting.pressure === 'light' ? '较轻' : '适中'}
                  </Text>
                </View>
                <Text style={styles.handwritingInterpretation}>
                  {result.handwriting.pressureInterpretation}
                </Text>

                <View style={styles.handwritingItem}>
                  <Text style={styles.handwritingLabel}>稳定性</Text>
                  <Text style={styles.handwritingValue}>
                    {result.handwriting.stability === 'stable' ? '稳定' : 
                     result.handwriting.stability === 'shaky' ? '波动' : '一般'}
                  </Text>
                </View>
                <Text style={styles.handwritingInterpretation}>
                  {result.handwriting.stabilityInterpretation}
                </Text>

                <View style={styles.handwritingItem}>
                  <Text style={styles.handwritingLabel}>结构</Text>
                  <Text style={styles.handwritingValue}>
                    {result.handwriting.structure === 'compact' ? '紧凑' : 
                     result.handwriting.structure === 'loose' ? '松散' : '均衡'}
                  </Text>
                </View>
                <Text style={styles.handwritingInterpretation}>
                  {result.handwriting.structureInterpretation}
                </Text>
              </View>
            </View>

            {/* 性格特点 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 性格画像</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.traitsRow}>
                  {result.handwriting.personalityInsights.map((trait, index) => (
                    <View key={index} style={[styles.traitTag, { backgroundColor: '#FFD700' }]}>
                      <Text style={[styles.traitText, { color: '#1a1a2e' }]}>{trait}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 运势解读 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌟 运势解读</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>💼 事业</Text>
                  <Text style={styles.fortuneText}>{result.interpretation.career}</Text>
                </View>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>💕 感情</Text>
                  <Text style={styles.fortuneText}>{result.interpretation.love}</Text>
                </View>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>💰 财运</Text>
                  <Text style={styles.fortuneText}>{result.interpretation.wealth}</Text>
                </View>
                <View style={styles.fortuneItem}>
                  <Text style={styles.fortuneLabel}>🏥 健康</Text>
                  <Text style={styles.fortuneText}>{result.interpretation.health}</Text>
                </View>
              </View>
            </View>

            {/* 建议 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 建议</Text>
              <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                {result.interpretation.advice.map((advice, index) => (
                  <Text key={index} style={styles.adviceText}>
                    {index + 1}. {advice}
                  </Text>
                ))}
              </View>
            </View>

            {/* 后续问题 - 可点击跳转聊天 */}
            {result.followUpQuestions.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.continueChatButton}
                  onPress={() => handleFollowUpQuestion('')}
                >
                  <Text style={styles.continueChatText}>💬 继续聊聊这个字</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  wuxingAura: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ritualHintCard: {
    backgroundColor: '#1A2238',
    borderWidth: 1,
    borderColor: '#3A4670',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ritualHintTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  ritualHintText: {
    color: '#C8D0E8',
    fontSize: 13,
    lineHeight: 20,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFD700',
  },
  modeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#1a1a2e',
  },
  inputSection: {
    marginBottom: 20,
  },
  aspectSection: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  aspectTitle: {
    fontSize: 15,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 10,
  },
  aspectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  aspectTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  aspectTagSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  aspectTagText: {
    color: '#999',
    fontSize: 14,
  },
  aspectTagTextSelected: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  customAspectInput: {
    height: 40,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  handwritingSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  ritualCountdownCard: {
    width: '92%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334B7C',
    padding: 12,
    marginTop: 12,
  },
  ritualCountdownTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  ritualCountdownText: {
    color: '#BFC8E8',
    fontSize: 13,
    lineHeight: 19,
  },
  ritualBreathHint: {
    marginTop: 8,
    color: '#FFD88A',
    fontSize: 13,
    fontWeight: '700',
  },
  ritualCountdownActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  ritualCountdownPrimary: {
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ritualCountdownPrimaryDisabled: {
    backgroundColor: '#4B3A75',
  },
  ritualCountdownPrimaryText: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '700',
  },
  ritualCountdownSecondary: {
    borderWidth: 1,
    borderColor: '#4E5E88',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ritualCountdownSecondaryText: {
    color: '#BFC8E8',
    fontSize: 12,
    fontWeight: '600',
  },
  handwritingCanvasWrap: {
    width: '100%',
    alignItems: 'center',
  },
  handwritingCanvasWrapLocked: {
    opacity: 0.45,
  },
  progressWrap: {
    marginTop: 10,
    width: '92%',
  },
  progressText: {
    color: '#C7CBE3',
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#2A2D44',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#6D50A6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  refineInlineWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2B2E45',
  },
  refineInlineHint: {
    color: '#AEB3CE',
    fontSize: 12,
    marginBottom: 8,
  },
  refineInlineBtn: {
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  refineInlineBtnDisabled: {
    backgroundColor: '#5A5870',
  },
  refineInlineBtnText: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '700',
  },
  focusSummary: {
    color: '#E6E7F2',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  focusSubhead: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  focusItem: {
    color: '#D0D2E3',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  focusLlmTag: {
    marginTop: 8,
    color: '#B6F3C9',
    fontSize: 12,
  },
  focusChatBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(72, 134, 244, 0.18)',
    borderColor: 'rgba(72, 134, 244, 0.45)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  focusChatBtnText: {
    color: '#BFD8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  premiumHintCard: {
    backgroundColor: '#241B3B',
    borderColor: '#4D3A7A',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  premiumHintText: {
    color: '#E8D4FF',
    fontSize: 13,
    lineHeight: 20,
  },
  premiumHintLink: {
    marginTop: 6,
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 12,
    padding: 15,
  },
  ziDisplay: {
    alignItems: 'center',
    marginBottom: 15,
  },
  ziText: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  ziInfo: {
    alignItems: 'center',
  },
  infoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  infoCard: {
    width: 104,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ziMetaSource: {
    marginTop: 12,
    color: '#6F6287',
    fontSize: 11,
    lineHeight: 16,
  },
  componentsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  },
  componentBox: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
  },
  componentText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  componentMeaning: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  associativeText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  skillHead: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  skillText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  probingChatBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(109,80,166,0.22)',
    borderColor: 'rgba(109,80,166,0.55)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  probingChatText: {
    color: '#D7C8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  oracleTip: {
    color: '#999',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  oracleImageRow: {
    gap: 10,
    paddingVertical: 4,
  },
  oracleImageBox: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d45',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  oracleImage: {
    width: 100,
    height: 100,
  },
  oracleSource: {
    color: '#777',
    fontSize: 12,
    marginTop: 10,
  },
  oracleCounter: {
    color: '#C7C7D2',
    fontSize: 12,
    marginTop: 8,
  },
  oracleUnlockBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderColor: 'rgba(255, 215, 0, 0.45)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  oracleUnlockText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  oracleRemainText: {
    color: '#BDBDCA',
    fontSize: 12,
    marginTop: 6,
  },
  yijingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  yijingBox: {
    alignItems: 'center',
  },
  yijingLabel: {
    color: '#999',
    fontSize: 12,
  },
  yijingValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  guaXiangText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guaDetailWrap: {
    marginTop: 4,
    gap: 8,
  },
  guaDetailItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  guaDetailIcon: {
    fontSize: 14,
    lineHeight: 20,
  },
  guaDetailItem: {
    color: '#C9CBDD',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  collapseTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  collapseIcon: {
    color: '#FFD700',
    fontSize: 12,
  },
  collapseContent: {
    padding: 15,
    borderRadius: 10,
  },
  coldReadingText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  handwritingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  handwritingLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  handwritingValue: {
    color: '#fff',
    fontSize: 14,
  },
  handwritingInterpretation: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  traitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fortuneItem: {
    marginBottom: 12,
  },
  fortuneLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  fortuneText: {
    color: '#ddd',
    fontSize: 13,
    lineHeight: 20,
  },
  adviceText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  questionText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 5,
  },
  questionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  continueChatButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  continueChatText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
