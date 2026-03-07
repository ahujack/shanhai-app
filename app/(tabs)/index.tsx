import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { usePersonaStore } from '../../src/store/persona';
import { useUserStore } from '../../src/store/user';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { fortuneApi, FortuneSlip } from '../../src/services/api';
import PersonaPicker from '../../components/PersonaPicker';

// 主题颜色
const colors = theme.dark;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { active: persona, personas, setActive } = usePersonaStore();
  const { user, chart, hasChart, generateChart } = useUserStore();
  const { messages, isLoading, sendMessage, clearMessages } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showZiModal, setShowZiModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [detectedZi, setDetectedZi] = useState('');
  const [drawFortune, setDrawFortune] = useState<FortuneSlip | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // 命盘信息
  const [chartGender, setChartGender] = useState<'male' | 'female'>('male');
  
  const scrollViewRef = useRef<ScrollView>(null);

  // 检查输入中是否包含汉字
  useEffect(() => {
    // 检测是否包含汉字
    const ziMatch = inputText.match(/[\u4e00-\u9fa5]/);
    if (ziMatch && ziMatch.length === 1 && ziMatch[0].length === 1) {
      // 用户输入了一个汉字
      setDetectedZi(ziMatch[0]);
      setShowZiModal(true);
    }
  }, [inputText]);

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
    if (!user?.id) {
      Alert.alert('提示', '请先登录后再抽签');
      return;
    }
    
    setIsDrawing(true);
    try {
      const fortune = await fortuneApi.draw(user.id);
      setDrawFortune(fortune);
    } catch (error) {
      Alert.alert('抽签失败', '请稍后重试');
    } finally {
      setIsDrawing(false);
    }
  };

  // 创建命盘
  const handleCreateChart = async () => {
    if (!user?.id) {
      Alert.alert('提示', '请先登录后再创建命盘');
      return;
    }
    
    try {
      await generateChart(chartGender);
      Alert.alert('成功', '命盘已创建');
      setShowChartModal(false);
    } catch (error) {
      Alert.alert('创建失败', '请稍后重试');
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
  };

  // 处理测字
  const handleZiAnalyze = () => {
    setShowZiModal(false);
    setInputText(`帮我测字：${detectedZi}`);
  };

  // 跳转到测字页面
  const goToZiPage = () => {
    setShowZiModal(false);
    router.push('/(tabs)/zi');
  };

  // 跳转到占卜页面
  const goToReadingPage = () => {
    setShowDrawModal(false);
    router.push('/(tabs)/reading');
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
            >
              <Text style={styles.personaSwitchText}>🎭 切换</Text>
            </TouchableOpacity>
            <Text style={styles.title}>山海灵境</Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => user ? router.push('/(tabs)/profile') : router.push('/login')}
            >
              <Text style={styles.loginButtonText}>{user ? '👤' : '登录'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{persona.name}</Text>
        </View>

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
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>🙏 欢迎来到山海灵境</Text>
              <Text style={styles.welcomeText}>
                {persona.greeting}
              </Text>
              <Text style={styles.welcomeHint}>
                你可以问我关于运势、占卜、命盘的问题，或者只是想聊聊。
              </Text>
              
              {/* 快捷功能按钮 - 放在欢迎词里面 */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    if (!user?.id) {
                      Alert.alert('提示', '请先登录后使用此功能');
                      return;
                    }
                    setShowDrawModal(true);
                  }}
                >
                  <Text style={styles.quickActionIcon}>🎯</Text>
                  <Text style={styles.quickActionText}>抽签</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(tabs)/zi')}
                >
                  <Text style={styles.quickActionIcon}>✍️</Text>
                  <Text style={styles.quickActionText}>测字</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(tabs)/reading')}
                >
                  <Text style={styles.quickActionIcon}>🔮</Text>
                  <Text style={styles.quickActionText}>占卜</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => {
                    if (!user?.id) {
                      Alert.alert('提示', '请先登录后使用此功能');
                      return;
                    }
                    setShowChartModal(true);
                  }}
                >
                  <Text style={styles.quickActionIcon}>📊</Text>
                  <Text style={styles.quickActionText}>命盘</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 聊天消息 */}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          
          {/* 加载中 */}
          {isLoading && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.typingText}>{persona.name} 正在思考...</Text>
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

        {/* 悬浮抽签按钮 - 固定在右下角 */}
        {user?.id && (
          <TouchableOpacity 
            style={styles.floatingDrawButton}
            onPress={() => setShowDrawModal(true)}
          >
            <Text style={styles.floatingDrawIcon}>🎯</Text>
          </TouchableOpacity>
        )}
      </View>

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
                  <Text style={styles.fortunePoemTitle}>{drawFortune.poem.title}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line1}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line2}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line3}</Text>
                  <Text style={styles.fortunePoemText}>{drawFortune.poem.line4}</Text>
                  
                  <View style={styles.fortuneDetail}>
                    <Text style={styles.fortuneDetailTitle}>详解</Text>
                    <Text style={styles.fortuneDetailText}>{drawFortune.interpretation}</Text>
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
            <Text style={styles.ziModalHint}>是否对此字进行测字分析？</Text>
            
            <View style={styles.ziModalButtons}>
              <TouchableOpacity 
                style={styles.ziModalButton}
                onPress={handleZiAnalyze}
              >
                <Text style={styles.ziModalButtonText}>在对话中测字</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ziModalButton, styles.ziModalButtonSecondary]}
                onPress={goToZiPage}
              >
                <Text style={[styles.ziModalButtonText, styles.ziModalButtonTextSecondary]}>进入测字页面</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.ziModalButton, styles.ziModalButtonCancel]}
                onPress={() => setShowZiModal(false)}
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
    </KeyboardAvoidingView>
  );
}

// 聊天消息气泡
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
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
        
        {/* 显示Artifacts（如果有时） */}
        {message.artifacts?.fortune && (
          <View style={styles.artifactCard}>
            <Text style={styles.artifactTitle}>📜 运势解读</Text>
            <Text style={styles.artifactText}>{message.artifacts.fortune.day}</Text>
          </View>
        )}
        
        {message.artifacts?.reading && (
          <View style={styles.artifactCard}>
            <Text style={styles.artifactTitle}>🔮 卦象</Text>
            <Text style={styles.artifactText}>{message.artifacts.reading.hexagram.originalName}</Text>
          </View>
        )}

        {/* 测字结果 */}
        {message.artifacts?.zi && (
          <View style={styles.artifactCard}>
            <Text style={styles.artifactTitle}>✍️ 测字</Text>
            <Text style={styles.artifactText}>
              {message.artifacts.zi.zi.zi} - {message.artifacts.zi.zi.wuxing}性 {message.artifacts.zi.zi.jixiong}
            </Text>
            <Text style={styles.artifactSubtext} numberOfLines={2}>
              {message.artifacts.zi.coldReadings[0]}
            </Text>
          </View>
        )}
        
        {/* 操作按钮 */}
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionButtons}>
            {message.actions.map((action, idx) => (
              <TouchableOpacity key={idx} style={styles.actionButton}>
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
    paddingVertical: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  personaSwitchText: {
    color: '#F8D05F',
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2B2342',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 14,
    color: '#B2B4C8',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeCard: {
    backgroundColor: '#161126',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 12,
    textAlign: 'center',
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
    marginBottom: 16,
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
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    color: '#8D8DAA',
    fontSize: 12,
  },
  
  // 悬浮抽签按钮
  floatingDrawButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 28,
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
  luckyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    width: '100%',
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
});
