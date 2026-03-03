import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/Colors';
import { usePersonaStore } from '../../src/store/persona';
import { useUserStore } from '../../src/store/user';
import { useChatStore, ChatMessage } from '../../src/store/chat';
import { FortuneSlip } from '../../src/services/api';
import PersonaPicker from '../../components/PersonaPicker';

// 主题颜色
const colors = theme.dark;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { active: persona, personas, setActive } = usePersonaStore();
  const { user, dailyFortune, loadDailyFortune } = useUserStore();
  const { messages, isLoading, sendMessage, clearMessages } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDailyFortune();
  }, []);

  useEffect(() => {
    // 滚动到底部
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  const handleQuickAction = (action: string) => {
    setInputText(action);
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
            <Text style={styles.title}>山海灵境</Text>
            <TouchableOpacity 
              style={styles.personaSwitchButton}
              onPress={() => setShowPersonaPicker(true)}
            >
              <Text style={styles.personaSwitchText}>🎭 切换角色</Text>
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
          {/* 每日一签卡片 */}
          {dailyFortune && (
            <FortuneCard fortune={dailyFortune} />
          )}

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
              
              {/* 快捷操作 */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => handleQuickAction('今日运势')}
                >
                  <Text style={styles.quickButtonText}>📜 今日运势</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => handleQuickAction('我想占卜')}
                >
                  <Text style={styles.quickButtonText}>🔮 占卜问卦</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => handleQuickAction('我想静心')}
                >
                  <Text style={styles.quickButtonText}>🧘 静心冥想</Text>
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
      </View>
    </KeyboardAvoidingView>
  );
}

// 每日运势卡片组件
function FortuneCard({ fortune }: { fortune: FortuneSlip }) {
  return (
    <View style={[styles.fortuneCard, { backgroundColor: colors.surface }]}>
      <View style={styles.fortuneHeader}>
        <Text style={styles.fortuneLabel}>📜 今日灵签</Text>
        <Text style={styles.fortunePoem}>{fortune.poem.title}</Text>
      </View>
      <Text style={styles.fortuneVerse}>{fortune.poem.line1}</Text>
      <Text style={styles.fortuneVerse}>{fortune.poem.line2}</Text>
      <View style={styles.fortuneFooter}>
        <View style={styles.luckyItem}>
          <Text style={styles.luckyLabel}>幸运数字</Text>
          <Text style={styles.luckyValue}>{fortune.lucky.number}</Text>
        </View>
        <View style={styles.luckyItem}>
          <Text style={styles.luckyLabel}>幸运颜色</Text>
          <Text style={styles.luckyValue}>{fortune.lucky.color}</Text>
        </View>
        <View style={styles.luckyItem}>
          <Text style={styles.luckyLabel}>幸运方向</Text>
          <Text style={styles.luckyValue}>{fortune.lucky.direction}</Text>
        </View>
      </View>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0716',
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quickButton: {
    backgroundColor: '#2B1F3C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4C2F80',
  },
  quickButtonText: {
    color: '#C8A6FF',
    fontSize: 13,
  },
  fortuneCard: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8D05F30',
  },
  fortuneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fortuneLabel: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fortunePoem: {
    color: '#F7F6F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fortuneVerse: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginVertical: 4,
  },
  fortuneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
  },
  luckyItem: {
    alignItems: 'center',
  },
  luckyLabel: {
    color: '#8D8DAA',
    fontSize: 11,
  },
  luckyValue: {
    color: '#F8D05F',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
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
});
