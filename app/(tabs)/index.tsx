import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, Animated, Easing, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../constants/Colors';
import { usePersonaStore } from '../../src/store/persona';
import { useUserStore } from '../../src/store/user';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { useDivinationStore } from '../../src/store/divination';
import { fortuneApi, FortuneSlip } from '../../src/services/api';
import PersonaPicker from '../../components/PersonaPicker';
import OnboardingModal from '../../components/OnboardingModal';

// 主题颜色
const colors = theme.dark;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ skipZiNudgeUntil?: string }>();
  const { active: persona, personas, setActive } = usePersonaStore();
  const { user, chart, hasChart, generateChart, checkIn, checkInStatus, loadCheckInStatus } = useUserStore();
  const { messages, isLoading, sendMessage, clearMessages, removeMessage } = useChatStore();
  const { setLastFortune } = useDivinationStore();
  
  // 加载签到状态
  useEffect(() => {
    if (user?.id) {
      loadCheckInStatus();
    }
  }, [user?.id]);
  
  const [inputText, setInputText] = useState('');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showZiModal, setShowZiModal] = useState(false);
  const [showZiNudge, setShowZiNudge] = useState(false);
  const [ziNudgeCooldownUntil, setZiNudgeCooldownUntil] = useState(0);
  const [ziNudgeShownDate, setZiNudgeShownDate] = useState('');
  const [showChartModal, setShowChartModal] = useState(false);
  const [detectedZi, setDetectedZi] = useState('');
  const [drawFortune, setDrawFortune] = useState<FortuneSlip | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [achievementUnlock, setAchievementUnlock] = useState<{ name: string; description: string; icon: string } | null>(null);
  const [lastCheckInPoints, setLastCheckInPoints] = useState(0);
  
  // 神秘特效动画
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // 启动神秘特效
  const startMysticAnimation = () => {
    rotateAnim.setValue(0);
    glowAnim.setValue(0);
    Animated.parallel([
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ),
    ]).start();
  };
  
  // 停止神秘特效
  const stopMysticAnimation = () => {
    rotateAnim.stopAnimation();
    glowAnim.stopAnimation();
  };
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  
  // Toast显示函数
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'info' });
    }, 2500);
  };
  
  // 命盘信息
  const [chartGender, setChartGender] = useState<'male' | 'female'>('male');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const ziNudgeDailyStorageKey = `zi_nudge_daily_${user?.id || 'guest'}`;

  const getLocalDateKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const hasShownZiNudgeToday = ziNudgeShownDate === getLocalDateKey();

  const extractZiCandidate = (text: string): string => {
    const quoted = text.match(/[「“"']([\u4e00-\u9fa5])[」”"']/);
    if (quoted?.[1]) return quoted[1];
    const chars = text.match(/[\u4e00-\u9fa5]/g) || [];
    if (!chars.length) return '心';
    // 对较长文本，优先给中间位置的字，避免总是首字触发
    return chars[Math.floor(chars.length / 2)] || '心';
  };

  const shouldSuggestZi = (text: string): boolean => {
    const clean = text.trim();
    if (Date.now() < ziNudgeCooldownUntil) return false;
    if (hasShownZiNudgeToday) return false;
    if (clean.length < 8) return false;
    if (/(测字|看字|这个字|写个字|帮我测)/.test(clean)) return false;
    return /(工作|事业|感情|关系|焦虑|纠结|压力|财务|健康|家庭|矛盾|怎么办|要不要|该不该)/.test(clean);
  };

  useEffect(() => {
    let cancelled = false;
    const loadZiNudgeDailyState = async () => {
      try {
        const storedDate = await AsyncStorage.getItem(ziNudgeDailyStorageKey);
        if (!cancelled && storedDate) {
          setZiNudgeShownDate(storedDate);
        }
      } catch {
        // ignore persistence read failure
      }
    };
    loadZiNudgeDailyState();
    return () => {
      cancelled = true;
    };
  }, [ziNudgeDailyStorageKey]);

  useEffect(() => {
    const untilRaw = params.skipZiNudgeUntil;
    if (!untilRaw) return;
    const parsed = Number(Array.isArray(untilRaw) ? untilRaw[0] : untilRaw);
    if (!Number.isFinite(parsed)) return;
    setZiNudgeCooldownUntil((prev) => (parsed > prev ? parsed : prev));
  }, [params.skipZiNudgeUntil]);

  useEffect(() => {
    // 滚动到底部
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 抽签
  const handleDrawFortune = async () => {
    setIsDrawing(true);
    try {
      const fortune = await fortuneApi.draw();
      setDrawFortune(fortune);
      setLastFortune(fortune);
    } catch (error) {
      showToast('抽签失败，请稍后重试', 'error');
    } finally {
      setIsDrawing(false);
    }
  };

  const getFortuneGrade = (fortune: FortuneSlip): { label: string; color: string } => {
    if (fortune.fortuneRank) {
      const colorMap: Record<string, string> = {
        上上签: '#F8D05F',
        上签: '#7EDC8A',
        中签: '#B2A0FF',
        下签: '#FF6B6B',
      };
      return { label: fortune.fortuneRank, color: colorMap[fortune.fortuneRank] || '#B2A0FF' };
    }
    const text = `${fortune.day} ${fortune.month} ${fortune.year} ${fortune.interpretation.overall}`;
    if (/(大吉|上吉|诸事大吉|万事皆宜|亨通|丰收之年)/.test(text)) {
      return { label: '上上签', color: '#F8D05F' };
    }
    if (/(凶|闭塞|不通|争讼|阻滞|不宜冒进)/.test(text)) {
      return { label: '下签', color: '#FF6B6B' };
    }
    if (/(吉|有喜|顺利|平稳|贵人)/.test(text)) {
      return { label: '中上签', color: '#7EDC8A' };
    }
    return { label: '中平签', color: '#B2A0FF' };
  };

  const openDrawModal = () => {
    setShowDrawModal(true);
  };

  // 创建命盘
  const handleCreateChart = async () => {
    if (!user?.id) {
      showToast('请先登录后再创建命盘', 'error');
      return;
    }
    
    try {
      await generateChart(chartGender);
      showToast('命盘已创建', 'success');
      setShowChartModal(false);
    } catch (error) {
      showToast('命盘创建失败，请稍后重试', 'error');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const message = inputText.trim();
    setInputText('');
    
    await sendMessage(
      message, 
      persona.id, 
      user?.id,
      'calm'
    );

    // 聊到具体问题时再轻量引导测字，不自动弹窗
    if (shouldSuggestZi(message)) {
      setDetectedZi(extractZiCandidate(message));
      setShowZiNudge(true);
      const todayKey = getLocalDateKey();
      setZiNudgeShownDate(todayKey);
      AsyncStorage.setItem(ziNudgeDailyStorageKey, todayKey).catch(() => null);
    }
  };

  // 跳转到测字页面
  const goToZiPage = () => {
    setShowZiNudge(false);
    setShowZiModal(false);
    router.push({
      pathname: '/(tabs)/zi',
      params: detectedZi ? { prefillZi: detectedZi, fromChat: '1' } : { fromChat: '1' },
    });
  };

  // 跳转到占卜页面
  const goToReadingPage = () => {
    setShowDrawModal(false);
    router.push({
      pathname: '/(tabs)/reading',
      params: {
        fromFortune: drawFortune ? '1' : '0',
      },
    });
  };

  // 签到
  const handleCheckIn = async () => {
    console.log('[签到] user:', user, 'checkInStatus:', checkInStatus);
    if (!user?.id) {
      showToast('请先登录后签到', 'error');
      return;
    }
    console.log('[签到] 开始签到');
    try {
      const result = await checkIn();
      console.log('[签到] 结果:', result);
      if (result?.success) {
        setLastCheckInPoints(result.points || 0);
        if (result.achievement) {
          setAchievementUnlock(result.achievement);
        } else {
          showToast(`🎉 签到成功！+${result.points}积分${result.reward ? `\n${result.reward}` : ''}`, 'success');
        }
      } else {
        showToast(result?.message || '签到失败', 'error');
      }
    } catch (error) {
      console.error('[签到] 错误:', error);
      showToast('签到失败，请稍后重试', 'error');
    }
  };

  // 分享功能
  const handleShare = async () => {
    if (!user) {
      showToast('请先登录后分享', 'error');
      return;
    }
    
    let shareText = '🔮 山海灵境 - 命运探索之旅\n\n';
    
    // 分享今日运势
    try {
      const fortune = await fortuneApi.getDaily(user.id);
      shareText += `✨ 今日运势：${fortune.poem.title}\n`;
      shareText += `📝 ${fortune.day}\n`;
      shareText += `💫 幸运数字：${fortune.lucky.number} | 幸运颜色：${fortune.lucky.color}\n\n`;
    } catch (e) {
      // ignore
    }
    
    shareText += '🌟 加入我，一起探索命运的奥秘！\n';
    shareText += '📱 下载山海灵境App';
    
    try {
      await Share.share({
        message: shareText,
        title: '山海灵境 - 命运探索',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 解读分享功能 - 分享用户的命盘解读
  const handleShareReading = async () => {
    if (!user || !chart) {
      showToast('请先生成命盘', 'error');
      return;
    }
    
    let shareText = '🔮 我的山海灵境命盘解读\n\n';
    
    // 添加八字信息
    shareText += `📅 八字：${chart.yearGanZhi} ${chart.monthGanZhi} ${chart.dayGanZhi} ${chart.hourGanZhi}\n\n`;
    
    // 添加今日运势
    try {
      const fortune = await fortuneApi.getDaily(user.id);
      shareText += `✨ 今日运势：${fortune.poem.title}\n`;
      shareText += `📝 ${fortune.day}\n`;
      shareText += `💫 幸运数字：${fortune.lucky.number} | 幸运颜色：${fortune.lucky.color}\n\n`;
    } catch (e) {
      // ignore
    }
    
    shareText += '🌟 加入我，一起探索命运的奥秘！\n';
    shareText += '🔗 https://shanhai.app';
    
    try {
      await Share.share({
        message: shareText,
        title: '山海灵境 - 命盘解读分享',
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 顶部标题 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.personaSwitchButton}
              onPress={() => setShowPersonaPicker(true)}
              accessibilityLabel="切换灵伴"
            >
              <Text style={styles.personaSwitchText}>🎭 切换</Text>
            </TouchableOpacity>
            <Text style={styles.title}>山海灵境</Text>
            <View style={styles.headerRight}>
              {user && (
                <TouchableOpacity 
                  style={styles.checkInButton}
                  onPress={handleCheckIn}
                  activeOpacity={0.7}
                  accessibilityLabel={checkInStatus?.todayCheckedIn ? '已签到' : '签到'}
                >
                  <Text style={styles.checkInButtonText}>
                    {checkInStatus?.todayCheckedIn ? '✓ 已签到' : '📝 签到'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => user ? router.push('/(tabs)/profile') : router.push('/login')}
              >
                <Text style={styles.loginButtonText}>{user ? '👤 我的' : '登录'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerBottom}>
            <Text style={styles.subtitle}>{persona.name}</Text>
          </View>
        </View>

        {/* 新用户引导 */}
        <OnboardingModal />

        {/* 角色选择弹窗 */}
        {showPersonaPicker && (
          <PersonaPicker
            personas={personas}
            active={persona}
            onSelect={(p) => {
              setActive(p.id);
              setShowPersonaPicker(false);
            }}
            onClose={() => setShowPersonaPicker(false)}
          />
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 欢迎消息 */}
          {messages.length === 0 && (
            <>
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTag}>今日灵感</Text>
                <Text style={styles.welcomeText}>
                  {persona.greeting}
                </Text>
                <Text style={styles.welcomeHint}>
                  你可以问我关于运势、占卜、命盘的问题，或者只是想聊聊。
                </Text>
                {/* 试试问我 - 示例问题 */}
                <Text style={styles.suggestedTitle}>试试问我</Text>
                <View style={styles.suggestedChips}>
                  {['今日运势如何？', '帮我抽一签', '测「心」字', '感情该不该继续？', '我的命盘'].map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.suggestedChip}
                      onPress={() => !isLoading && sendMessage(q, persona.id, user?.id, 'calm')}
                      disabled={isLoading}
                      accessibilityLabel={`提问：${q}`}
                    >
                      <Text style={styles.suggestedChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* 快捷入口 */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickAction} onPress={() => !isLoading && sendMessage('今日运势如何？', persona.id, user?.id, 'calm')} disabled={isLoading}>
                  <Text style={styles.quickActionIcon}>✨</Text>
                  <Text style={styles.quickActionText}>运势</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={openDrawModal}>
                  <Text style={styles.quickActionIcon}>🎯</Text>
                  <Text style={styles.quickActionText}>抽签</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={goToZiPage}>
                  <Text style={styles.quickActionIcon}>✍️</Text>
                  <Text style={styles.quickActionText}>测字</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/reading')}>
                  <Text style={styles.quickActionIcon}>🔮</Text>
                  <Text style={styles.quickActionText}>占卜</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => hasChart ? router.push('/(tabs)/bazi') : setShowChartModal(true)}>
                  <Text style={styles.quickActionIcon}>📊</Text>
                  <Text style={styles.quickActionText}>命盘</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/meditation')}>
                  <Text style={styles.quickActionIcon}>🧘</Text>
                  <Text style={styles.quickActionText}>冥想</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 聊天消息 */}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onRetry={msg.retryWith ? () => { removeMessage(msg.id); sendMessage(msg.retryWith!, persona.id, user?.id, 'calm'); } : undefined}
            />
          ))}
          
          {/* 加载中 */}
          {isLoading && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.typingText}>{persona.name} 正在思考...</Text>
            </View>
          )}

          {showZiNudge && !showZiModal && (
            <View style={styles.ziNudgeCard}>
              <Text style={styles.ziNudgeTitle}>✍️ 要不要试试测字小游戏？</Text>
              <Text style={styles.ziNudgeText}>
                你刚聊到一个具体困扰，我可以用「{detectedZi || '心'}」这个字帮你做一版轻量拆解。
              </Text>
              <View style={styles.ziNudgeActions}>
                <TouchableOpacity
                  style={styles.ziNudgePrimary}
                  onPress={() => setShowZiModal(true)}
                >
                  <Text style={styles.ziNudgePrimaryText}>试一下</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ziNudgeSecondary}
                  onPress={() => setShowZiNudge(false)}
                >
                  <Text style={styles.ziNudgeSecondaryText}>先继续聊</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 输入区域 */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="输入你的问题或心声..."
              placeholderTextColor="#6F6287"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>发送</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 悬浮抽签按钮 - 与占卜功能独立 */}
        <TouchableOpacity style={styles.floatingDrawButton} onPress={openDrawModal}>
          <Text style={styles.floatingDrawIcon}>🎯</Text>
          <Text style={styles.floatingDrawText}>抽签</Text>
        </TouchableOpacity>

      </View>

      {/* Toast提示 */}
      {toast.visible && (
        <View style={[styles.toastContainer, toast.type === 'error' && styles.toastError, toast.type === 'success' && styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* 抽签弹窗 */}
      <Modal
        visible={showDrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 抽签</Text>
              <TouchableOpacity onPress={() => setShowDrawModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {drawFortune ? (
                <FortuneResultAnimation>
                  <View style={[styles.fortuneGradeBadge, { borderColor: getFortuneGrade(drawFortune).color }]}>
                    <Text style={[styles.fortuneGradeText, { color: getFortuneGrade(drawFortune).color }]}>
                      {getFortuneGrade(drawFortune).label}
                    </Text>
                  </View>
                  {!!drawFortune.drawCode && (
                    <Text style={styles.drawCodeText}>签号：{drawFortune.drawCode}</Text>
                  )}
                  <Text style={styles.fortunePoemTitle}>{drawFortune.poem.title}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line1}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line2}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line3}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line4}</Text>
                  
                  <View style={styles.fortuneDetail}>
                    <Text style={styles.fortuneDetailTitle}>详解</Text>
                    <Text style={styles.fortuneDetailText}>
                      {typeof drawFortune.interpretation === 'string' 
                        ? drawFortune.interpretation 
                        : drawFortune.interpretation?.overall || ''}
                    </Text>
                    {!!drawFortune.funTip && (
                      <View style={styles.funCard}>
                        <Text style={styles.funCardTitle}>🎲 今日趣味提示</Text>
                        <Text style={styles.funCardText}>{drawFortune.funTip}</Text>
                      </View>
                    )}
                    {!!drawFortune.mission && (
                      <View style={styles.funCard}>
                        <Text style={styles.funCardTitle}>🧩 今日任务</Text>
                        <Text style={styles.funCardText}>{drawFortune.mission}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.luckyInfo}>
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyLabel}>幸运数字</Text>
                      <Text style={styles.luckyValue}>{drawFortune.lucky.number}</Text>
                    </View>
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyLabel}>幸运颜色</Text>
                      <Text style={styles.luckyValue}>{drawFortune.lucky.color}</Text>
                    </View>
                    <View style={styles.luckyItem}>
                      <Text style={styles.luckyLabel}>幸运方向</Text>
                      <Text style={styles.luckyValue}>{drawFortune.lucky.direction}</Text>
                    </View>
                  </View>
                  {!!drawFortune.socialLine && (
                    <Text style={styles.socialLineText}>{drawFortune.socialLine}</Text>
                  )}
                  {!user?.id && (
                    <Text style={styles.guestHint}>登录后可保存抽签记录、查看历史</Text>
                  )}
                </FortuneResultAnimation>
              ) : (
                <View style={styles.drawPrompt}>
                  {/* 抽签动画 */}
                  <DrawAnimation visible={isDrawing} />
                  
                  {!isDrawing && (
                    <>
                      <Text style={styles.drawPromptText}>
                        诚心默念您的疑问
                      </Text>
                      <Text style={styles.drawPromptSubtext}>
                        然后点击下方按钮抽取灵签
                      </Text>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              {drawFortune ? (
                <>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={() => {
                      setDrawFortune(null);
                    }}
                  >
                    <Text style={styles.modalButtonText}>再抽一次</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonOutline]}
                    onPress={goToReadingPage}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextOutline]}>详细解卦</Text>
                  </TouchableOpacity>
                </>
              ) : isDrawing ? (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonDisabled]}
                  disabled={true}
                >
                  <Text style={styles.modalButtonText}>感应中...</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={handleDrawFortune}
                >
                  <Text style={styles.modalButtonText}>诚心抽签</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 测字检测弹窗 */}
      <Modal
        visible={showZiModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowZiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ziModalContent}>
            <Text style={styles.ziModalTitle}>检测到汉字</Text>
            <Text style={styles.ziModalZi}>{detectedZi}</Text>
            <Text style={styles.ziModalHint}>建议先静心想着这件事，再进入测字页面书写，会更聚焦。</Text>
            
            <View style={styles.ziModalButtons}>
              <TouchableOpacity 
                style={styles.ziModalButton}
                onPress={goToZiPage}
              >
                <Text style={styles.ziModalButtonText}>进入测字页面</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ziModalButton, styles.ziModalButtonCancel]}
                onPress={() => {
                  setShowZiModal(false);
                  setShowZiNudge(false);
                }}
              >
                <Text style={styles.ziModalButtonTextCancel}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 命盘创建弹窗 */}
      <Modal
        visible={showChartModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 创建命盘</Text>
              <TouchableOpacity onPress={() => setShowChartModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {hasChart && chart ? (
                <View style={styles.chartInfo}>
                  <Text style={styles.chartInfoTitle}>您已有命盘</Text>
                  <Text style={styles.chartInfoText}>
                    性别：{chart.gender === 'male' ? '男' : '女'}
                  </Text>
                  <Text style={styles.chartInfoText}>
                    出生：{chart.birthDate} {chart.birthTime}
                  </Text>
                  <TouchableOpacity 
                    style={styles.chartInfoButton}
                    onPress={() => router.push('/(tabs)/profile')}
                  >
                    <Text style={styles.chartInfoButtonText}>在"我的"中查看</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.chartCreate}>
                  <Text style={styles.chartCreateTitle}>输入您的出生信息</Text>
                  
                  <Text style={styles.chartCreateLabel}>性别</Text>
                  <View style={styles.genderSelector}>
                    <TouchableOpacity 
                      style={[styles.genderButton, chartGender === 'male' && styles.genderButtonActive]}
                      onPress={() => setChartGender('male')}
                    >
                      <Text style={[styles.genderButtonText, chartGender === 'male' && styles.genderButtonTextActive]}>
                        男
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, chartGender === 'female' && styles.genderButtonActive]}
                      onPress={() => setChartGender('female')}
                    >
                      <Text style={[styles.genderButtonText, chartGender === 'female' && styles.genderButtonTextActive]}>
                        女
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.chartCreateHint}>
                    创建后可在"我的"页面查看详细命盘信息
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {!hasChart && (
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleCreateChart}
              >
                <Text style={styles.modalButtonText}>创建命盘</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* 成就解锁弹窗 */}
      <Modal
        visible={!!achievementUnlock}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAchievementUnlock(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.achievementModalContent}>
            <Text style={styles.achievementModalBadge}>{achievementUnlock?.icon || '🏆'}</Text>
            <Text style={styles.achievementModalTitle}>成就解锁</Text>
            <Text style={styles.achievementModalName}>{achievementUnlock?.name}</Text>
            <Text style={styles.achievementModalDesc}>{achievementUnlock?.description}</Text>
            <Text style={styles.achievementModalPoints}>+{lastCheckInPoints} 积分</Text>
            <TouchableOpacity
              style={styles.achievementModalButton}
              onPress={() => setAchievementUnlock(null)}
            >
              <Text style={styles.achievementModalButtonText}>太棒了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 聊天消息气泡
function ChatBubble({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
  const isUser = message.role === 'user';
  const router = useRouter();
  const { setLastReading } = useDivinationStore();
  const extractFirstZi = (text?: string): string | undefined => {
    if (!text) return undefined;
    const match = text.match(/[\u4e00-\u9fa5]/);
    return match?.[0];
  };

  const openZiDetail = () => {
    const ziFromFullResult = message.artifacts?.zi?.zi?.zi;
    const ziFromSuggestion = (message.artifacts as any)?.ziSuggestion?.zi;
    const ziFromContent = extractFirstZi(message.content);
    const zi = ziFromFullResult || ziFromSuggestion || ziFromContent;
    router.push({
      pathname: '/(tabs)/zi',
      params: zi ? { prefillZi: zi, fromChat: '1' } : { fromChat: '1' },
    });
  };

  const openReadingDetail = () => {
    const reading = (message.artifacts as any)?.reading;
    if (reading) {
      setLastReading(reading);
      router.push({
        pathname: '/(tabs)/reading',
        params: { fromChatReading: '1' },
      });
      return;
    }
    router.push('/(tabs)/reading');
  };

  const handleActionPress = (type: string) => {
    if (type === 'view_zi') {
      openZiDetail();
      return;
    }
    if (type === 'view_reading') {
      openReadingDetail();
      return;
    }
    if (type === 'view_chart') {
      router.push('/(tabs)/bazi');
      return;
    }
    if (type === 'view_fortune') {
      router.push('/');
      return;
    }
    if (type === 'start_meditation') {
      router.push('/(tabs)/meditation');
      return;
    }
  };
  
  return (
    <View style={[
      styles.bubbleContainer,
      isUser ? styles.bubbleRight : styles.bubbleLeft
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.bubbleText,
          isUser ? styles.userBubbleText : styles.assistantBubbleText
        ]}>
          {message.content}
        </Text>
        
        {/* 连接失败时显示重试按钮 */}
        {!isUser && message.retryWith && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
        
        {/* 显示Artifacts（如果有时） */}
        {message.artifacts?.fortune && (
          <View style={styles.artifactCard}>
            <Text style={styles.artifactTitle}>📜 运势解读</Text>
            <Text style={styles.artifactText}>{message.artifacts.fortune.day}</Text>
          </View>
        )}
        
        {message.artifacts?.reading && (
          <TouchableOpacity style={styles.artifactCard} onPress={openReadingDetail}>
            <Text style={styles.artifactTitle}>🔮 卦象</Text>
            <Text style={styles.artifactText}>{message.artifacts.reading.hexagram.originalName}</Text>
            <Text style={styles.artifactLink}>点击查看完整解读</Text>
          </TouchableOpacity>
        )}

        {/* 测字结果 */}
        {message.artifacts?.zi?.zi?.zi && Array.isArray(message.artifacts?.zi?.coldReadings) && (
          <TouchableOpacity style={styles.artifactCard} onPress={openZiDetail}>
            <Text style={styles.artifactTitle}>✍️ 测字</Text>
            <Text style={styles.artifactText}>
              {message.artifacts.zi.zi.zi} - {message.artifacts.zi.zi.wuxing}性 {message.artifacts.zi.zi.jixiong}
            </Text>
            <Text style={styles.artifactSubtext} numberOfLines={2}>
              {message.artifacts.zi.coldReadings[0]}
            </Text>
            <Text style={styles.artifactLink}>点击查看测字详情</Text>
          </TouchableOpacity>
        )}
        
        {/* 操作按钮 */}
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionButtons}>
            {message.actions.map((action, idx) => (
              <TouchableOpacity key={idx} style={styles.actionButton} onPress={() => handleActionPress(action.type)}>
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ========== 抽签动画组件 ==========
function DrawAnimation({ visible, onComplete }: { visible: boolean; onComplete?: () => void }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // 粒子动画值
  const particle1Anim = useRef(new Animated.Value(0)).current;
  const particle2Anim = useRef(new Animated.Value(0)).current;
  const particle3Anim = useRef(new Animated.Value(0)).current;
  const particle4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 中心旋转动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 中心缩放动画
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // 脉冲效果
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // 粒子旋转动画
      const particleAnims = [particle1Anim, particle2Anim, particle3Anim, particle4Anim];
      particleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000 + index * 500,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      rotateAnim.setValue(0);
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      glowAnim.setValue(0);
      particle1Anim.setValue(0);
      particle2Anim.setValue(0);
      particle3Anim.setValue(0);
      particle4Anim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // 粒子位置计算
  const getParticlePosition = (anim: Animated.Value, angleOffset: number) => {
    return {
      transform: [
        {
          rotate: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [`${angleOffset}deg`, `${angleOffset + 360}deg`],
          }),
        },
        {
          translateY: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [-60, -100, -60],
          }),
        },
      ],
      opacity: anim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0, 1, 1, 0],
      }),
    };
  };

  return (
    <View style={styles.animationContainer}>
      {/* 背景光晕 */}
      <Animated.View 
        style={[
          styles.glowCircle,
          { opacity: glow }
        ]} 
      />
      
      {/* 外圈粒子 */}
      <Animated.View style={[styles.particle, getParticlePosition(particle1Anim, 0)]}>
        <Text style={styles.particleText}>✦</Text>
      </Animated.View>
      <Animated.View style={[styles.particle, getParticlePosition(particle2Anim, 90)]}>
        <Text style={styles.particleText}>✧</Text>
      </Animated.View>
      <Animated.View style={[styles.particle, getParticlePosition(particle3Anim, 180)]}>
        <Text style={styles.particleText}>✦</Text>
      </Animated.View>
      <Animated.View style={[styles.particle, getParticlePosition(particle4Anim, 270)]}>
        <Text style={styles.particleText}>✧</Text>
      </Animated.View>

      {/* 中心八卦 */}
      <Animated.View 
        style={[
          styles.baguaContainer,
          { 
            transform: [
              { rotate: spin },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          }
        ]}
      >
        <Text style={styles.baguaText}>☯</Text>
      </Animated.View>

      {/* 内圈符文 */}
      <Animated.View 
        style={[
          styles.innerCircle,
          { 
            transform: [{ rotate: spin }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Text style={styles.runeText}>⚶</Text>
      </Animated.View>

      {/* 提示文字 */}
      <Animated.View style={[styles.loadingTextContainer, { opacity: opacityAnim }]}>
        <Text style={styles.loadingText}>正在感应天地...</Text>
      </Animated.View>
    </View>
  );
}

// ========== 抽签结果动画组件 ==========
function FortuneResultAnimation({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 入场动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // 循环发光效果
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const borderGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fortuneResult,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* 结果光晕边框 */}
      <Animated.View style={styles.fortuneGlowBorder}>
        <Animated.View 
          style={[
            styles.fortuneGlowInner,
            {
              borderColor: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#322243', '#F8D05F'],
              }),
            }
          ]}
        />
      </Animated.View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
    position: 'relative',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F2342',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personaSwitchButton: {
    backgroundColor: '#2B2342',
    minWidth: 86,
    height: 34,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A2B5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaSwitchText: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2B2342',
    minWidth: 92,
    height: 34,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A2B5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8D05F',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#B2B4C8',
    marginTop: 6,
    backgroundColor: '#1B1430',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
    minWidth: 92,
    height: 34,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#77D07E',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareText: {
    color: '#B2A0FF',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 28,
  },
  welcomeCard: {
    backgroundColor: '#161126',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  welcomeTag: {
    alignSelf: 'center',
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 15,
    color: '#F7F6F0',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeHint: {
    fontSize: 13,
    color: '#8D8DAA',
    textAlign: 'center',
    marginBottom: 4,
  },
  suggestedTitle: {
    color: '#C8A6FF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
  },
  suggestedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    backgroundColor: '#2B1F3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A2B5A',
  },
  suggestedChipText: {
    color: '#B2B4C8',
    fontSize: 13,
  },
  bubbleContainer: {
    marginBottom: 12,
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#F8D05F',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2B1F3C',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#1A0A18',
  },
  assistantBubbleText: {
    color: '#F7F6F0',
  },
  artifactCard: {
    backgroundColor: '#1D152B',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#322243',
  },
  artifactTitle: {
    color: '#C8A6FF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  artifactText: {
    color: '#B2B4C8',
    fontSize: 14,
  },
  artifactSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  artifactLink: {
    color: '#BFA7FF',
    fontSize: 12,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#4C2F80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  retryButtonText: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: '#4C2F80',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionButtonText: {
    color: '#F7F6F0',
    fontSize: 13,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  typingText: {
    color: '#8D8DAA',
    fontSize: 13,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#0A0716',
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1A1328',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#322243',
  },
  input: {
    flex: 1,
    color: '#F7F6F0',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  sendButtonText: {
    color: '#1A0A18',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#161126',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
    gap: 12,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 52,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    color: '#8D8DAA',
    fontSize: 12,
  },
  floatingDrawButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F8D05F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F8D05F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingDrawIcon: {
    fontSize: 20,
  },
  floatingDrawText: {
    fontSize: 11,
    color: '#1A1328',
    fontWeight: 'bold',
    marginTop: 2,
  },
  
  // Toast提示样式
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 47, 128, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B2A0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(178, 160, 255, 0.3)',
  },
  toastError: {
    backgroundColor: 'rgba(211, 47, 47, 0.95)',
    borderColor: 'rgba(255, 118, 118, 0.3)',
  },
  toastSuccess: {
    backgroundColor: 'rgba(56, 142, 60, 0.95)',
    borderColor: 'rgba(102, 187, 106, 0.3)',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // ========== 抽签动画样式 ==========
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  glowCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F8D05F',
    shadowColor: '#F8D05F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  baguaContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1328',
    borderWidth: 3,
    borderColor: '#F8D05F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F8D05F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  baguaText: {
    fontSize: 48,
    color: '#F8D05F',
  },
  innerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#B2A0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runeText: {
    fontSize: 24,
    color: '#B2A0FF',
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleText: {
    fontSize: 16,
    color: '#F8D05F',
    textShadowColor: '#F8D05F',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingTextContainer: {
    position: 'absolute',
    bottom: 0,
  },
  loadingText: {
    color: '#B2A0FF',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // 结果发光边框
  fortuneGlowBorder: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fortuneGlowInner: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    opacity: 0.5,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1328',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#322243',
  },
  modalTitle: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#8D8DAA',
    fontSize: 20,
  },
  modalScroll: {
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    backgroundColor: '#F8D05F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  modalButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  modalButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextOutline: {
    color: '#F8D05F',
  },
  
  // Draw fortune styles
  drawPrompt: {
    alignItems: 'center',
    padding: 40,
  },
  drawPromptText: {
    color: '#F8D05F',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  drawPromptSubtext: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  fortuneResult: {
    alignItems: 'center',
  },
  fortunePoemTitle: {
    color: '#F8D05F',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fortuneGradeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  fortuneGradeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  drawCodeText: {
    color: '#8D8DAA',
    fontSize: 12,
    marginBottom: 6,
  },
  fortunePoemText: {
    color: '#F7F6F0',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  fortuneDetail: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#161126',
    borderRadius: 12,
    width: '100%',
  },
  fortuneDetailTitle: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fortuneDetailText: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
  },
  funCard: {
    marginTop: 10,
    backgroundColor: '#1D152B',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#322243',
  },
  funCardTitle: {
    color: '#C8A6FF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  funCardText: {
    color: '#B9ACD3',
    fontSize: 13,
    lineHeight: 19,
  },
  luckyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    width: '100%',
  },
  socialLineText: {
    color: '#F8D05F',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  guestHint: {
    color: '#8D8DAA',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  luckyItem: {
    alignItems: 'center',
  },
  luckyLabel: {
    color: '#8D8DAA',
    fontSize: 12,
  },
  luckyValue: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  
  // Zi detection modal
  ziModalContent: {
    backgroundColor: '#1A1328',
    borderRadius: 20,
    padding: 24,
    margin: 40,
    alignItems: 'center',
  },
  ziModalTitle: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ziModalZi: {
    fontSize: 64,
    color: '#F8D05F',
    marginBottom: 16,
  },
  ziModalHint: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 24,
  },
  ziModalButtons: {
    width: '100%',
    gap: 12,
  },
  ziModalButton: {
    backgroundColor: '#F8D05F',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ziModalButtonSecondary: {
    backgroundColor: '#4C2F80',
  },
  ziModalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4C4A5A',
  },
  ziModalButtonText: {
    color: '#1A0A18',
    fontSize: 15,
    fontWeight: 'bold',
  },
  ziModalButtonTextSecondary: {
    color: '#F8D05F',
  },
  ziModalButtonTextCancel: {
    color: '#8D8DAA',
    fontSize: 15,
  },

  ziNudgeCard: {
    marginTop: 8,
    backgroundColor: '#1B1430',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A2B5A',
    padding: 12,
  },
  ziNudgeTitle: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  ziNudgeText: {
    color: '#B9ACD3',
    fontSize: 13,
    lineHeight: 20,
  },
  ziNudgeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ziNudgePrimary: {
    backgroundColor: '#6D50A6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ziNudgePrimaryText: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '600',
  },
  ziNudgeSecondary: {
    borderColor: '#4A3C6D',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ziNudgeSecondaryText: {
    color: '#B9ACD3',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Chart modal
  chartInfo: {
    alignItems: 'center',
    padding: 20,
  },
  chartInfoTitle: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartInfoText: {
    color: '#B2B4C8',
    fontSize: 14,
    marginBottom: 8,
  },
  chartInfoButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4C2F80',
    borderRadius: 20,
  },
  chartInfoButtonText: {
    color: '#F8D05F',
    fontSize: 14,
  },
  chartCreate: {
    padding: 20,
  },
  chartCreateTitle: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartCreateLabel: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 8,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#161126',
    borderWidth: 1,
    borderColor: '#322243',
  },
  genderButtonActive: {
    backgroundColor: '#4C2F80',
    borderColor: '#F8D05F',
  },
  genderButtonText: {
    color: '#8D8DAA',
    fontSize: 16,
  },
  genderButtonTextActive: {
    color: '#F8D05F',
    fontWeight: 'bold',
  },
  chartCreateHint: {
    color: '#6F6287',
    fontSize: 13,
    textAlign: 'center',
  },
  // 成就解锁弹窗
  achievementModalContent: {
    backgroundColor: '#1A1328',
    borderRadius: 24,
    padding: 28,
    margin: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8D05F',
  },
  achievementModalBadge: {
    fontSize: 64,
    marginBottom: 16,
  },
  achievementModalTitle: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  achievementModalName: {
    color: '#F7F6F0',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  achievementModalDesc: {
    color: '#B2B4C8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  achievementModalPoints: {
    color: '#F8D05F',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
  },
  achievementModalButton: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
  },
  achievementModalButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
