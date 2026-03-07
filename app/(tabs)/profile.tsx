import React, { useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { usePersonaStore } from '../../src/store/persona';

const colors = theme.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, chart, hasChart, isLoading, createUser, generateChart, loadUser, clearUser, logout } = useUserStore();
  const { personas, active: currentPersona, setActive } = usePersonaStore();

  const [name, setName] = useState(user?.name || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [birthTime, setBirthTime] = useState(user?.birthTime || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'male');
  const [step, setStep] = useState<'input' | 'chart'>(() => {
    // 根据是否有命盘直接初始化正确的step，避免闪烁
    return hasChart ? 'chart' : 'input';
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // 检查用户是否登录
  const isLoggedIn = !!user;
  
  // 页面加载时获取用户信息
  React.useEffect(() => {
    const init = async () => {
      await loadUser();
      setIsInitializing(false);
    };
    init();
  }, []);

  React.useEffect(() => {
    if (user && !isInitializing) {
      setName(user.name);
      setBirthDate(user.birthDate || '');
      setBirthTime(user.birthTime || '');
      setGender(user.gender || 'male');
      if (hasChart) {
        setStep('chart');
      } else {
        setStep('input');
      }
    }
  }, [user, hasChart, isInitializing]);

  // 处理登出
  const handleLogout = async () => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // 重置表单状态
            setName('');
            setBirthDate('');
            setBirthTime('');
            setGender('male');
            setStep('input');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !birthDate.trim() || !birthTime.trim()) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    try {
      await createUser({
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
      });
      Alert.alert('成功', '信息已保存，正在生成命盘...');
      // 自动生成命盘
      const chartGender = gender === 'other' ? 'male' : gender;
      await generateChart(chartGender);
      setStep('chart');
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const handleGenerateChart = async () => {
    try {
      const chartGender = gender === 'other' ? 'male' : gender;
      await generateChart(chartGender);
      Alert.alert('成功', '命盘已生成');
    } catch (error) {
      Alert.alert('错误', '生成命盘失败');
    }
  };

  // 初始加载状态
  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>加载中...</Text>
      </View>
    );
  }

  // 渲染命盘信息
  if (step === 'chart' && chart) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.sectionTitle}>🔮 你的命盘</Text>
        
        {/* 八字信息 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>八字</Text>
          <View style={styles.baziRow}>
            <View style={styles.baziItem}>
              <Text style={styles.baziLabel}>年柱</Text>
              <Text style={styles.baziValue}>{chart.yearGanZhi}</Text>
            </View>
            <View style={styles.baziItem}>
              <Text style={styles.baziLabel}>月柱</Text>
              <Text style={styles.baziValue}>{chart.monthGanZhi}</Text>
            </View>
            <View style={styles.baziItem}>
              <Text style={styles.baziLabel}>日柱</Text>
              <Text style={styles.baziValue}>{chart.dayGanZhi}</Text>
            </View>
            <View style={styles.baziItem}>
              <Text style={styles.baziLabel}>时柱</Text>
              <Text style={styles.baziValue}>{chart.hourGanZhi}</Text>
            </View>
          </View>
        </View>

        {/* 五行强弱 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>🌟 五行强弱</Text>
          <View style={styles.wuxingContainer}>
            {chart.wuxingStrength ? Object.entries(chart.wuxingStrength).map(([key, value]) => (
              <View key={key} style={styles.wuxingItem}>
                <Text style={styles.wuxingLabel}>
                  {key === 'wood' ? '木' : key === 'fire' ? '火' : key === 'earth' ? '土' : key === 'metal' ? '金' : '水'}
                </Text>
                <View style={styles.wuxingBarBg}>
                  <View style={[styles.wuxingBar, { width: `${value}%`, backgroundColor: getWuxingColor(key) }]} />
                </View>
                <Text style={styles.wuxingValue}>{value}%</Text>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary }}>暂无五行数据</Text>
            )}
          </View>
        </View>

        {/* 性格特点 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>📝 性格特点</Text>
          <View style={styles.traitsContainer}>
            {chart.personalityTraits && chart.personalityTraits.length > 0 ? (
              chart.personalityTraits.map((trait, idx) => (
                <View key={idx} style={[styles.traitTag, { backgroundColor: colors.accentSecondary }]}>
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary }}>暂无性格数据</Text>
            )}
          </View>
        </View>

        {/* 运势简述 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>💫 运势简述</Text>
          {chart.fortuneSummary ? (
            <>
              <View style={styles.fortuneItem}>
                <Text style={styles.fortuneLabel}>💼 事业</Text>
                <Text style={styles.fortuneValue}>{chart.fortuneSummary.career}</Text>
              </View>
              <View style={styles.fortuneItem}>
                <Text style={styles.fortuneLabel}>💕 感情</Text>
                <Text style={styles.fortuneValue}>{chart.fortuneSummary.love}</Text>
              </View>
              <View style={styles.fortuneItem}>
                <Text style={styles.fortuneLabel}>💰 财运</Text>
                <Text style={styles.fortuneValue}>{chart.fortuneSummary.wealth}</Text>
              </View>
              <View style={styles.fortuneItem}>
                <Text style={styles.fortuneLabel}>❤️ 健康</Text>
                <Text style={styles.fortuneValue}>{chart.fortuneSummary.health}</Text>
              </View>
            </>
          ) : (
            <Text style={{ color: colors.textSecondary }}>暂无运势数据</Text>
          )}
        </View>

        {/* 建议 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>✨ 建议</Text>
          {chart.suggestions && chart.suggestions.length > 0 ? (
            chart.suggestions.map((suggestion, idx) => (
              <Text key={idx} style={styles.suggestionText}>• {suggestion}</Text>
            ))
          ) : (
            <Text style={{ color: colors.textSecondary }}>暂无建议</Text>
          )}
        </View>

        {/* 编辑信息按钮 */}
        <TouchableOpacity style={styles.editButton} onPress={() => setStep('input')}>
          <Text style={styles.editButtonText}>修改信息</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 渲染输入表单（未登录状态）
  // 加载中显示空状态
  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color="#4C2F80" />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>加载中...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      {/* 已登录用户信息展示 */}
      {isLoggedIn && user && (
        <View style={[styles.userInfoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.userInfoHeader}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>头像</Text>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfoContent}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.membershipBadge}>
                <Text style={styles.membershipText}>
                  {user.membership === 'vip' ? 'VIP会员' : user.membership === 'premium' ? '高级会员' : '免费用户'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 未登录提示 */}
      {!isLoggedIn && (
        <View style={[styles.loginPrompt, { backgroundColor: colors.surface }]}>
          <Text style={styles.loginTitle}>🔮 开启你的命运之旅</Text>
          <Text style={styles.loginDesc}>登录后可保存命盘、查看历史记录、享受个性化服务</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>立即登录 / 注册</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestLink} onPress={() => {}}>
            <Text style={styles.guestLinkText}>暂不登录，先逛逛</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>👤 个人资料</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={styles.inputLabel}>名字</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入你的名字"
          placeholderTextColor="#6F6287"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>出生日期</Text>
        <TextInput
          style={styles.input}
          placeholder="格式：1990-05-15"
          placeholderTextColor="#6F6287"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <Text style={styles.inputLabel}>出生时间</Text>
        <TextInput
          style={styles.input}
          placeholder="格式：14:30"
          placeholderTextColor="#6F6287"
          value={birthTime}
          onChangeText={setBirthTime}
        />

        <Text style={styles.inputLabel}>性别</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>男</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>女</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
            onPress={() => setGender('other')}
          >
            <Text style={[styles.genderText, gender === 'other' && styles.genderTextActive]}>其他</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>{isLoading ? '保存中...' : '保存并生成命盘'}</Text>
        </TouchableOpacity>
      </View>

      {/* 灵伴选择 */}
      <Text style={styles.sectionTitle}>🧙 选择你的灵伴</Text>
      <View style={styles.personaContainer}>
        {personas.map((persona) => (
          <TouchableOpacity
            key={persona.id}
            style={[
              styles.personaCard,
              currentPersona.id === persona.id && styles.personaCardActive,
              { backgroundColor: colors.surface }
            ]}
            onPress={() => setActive(persona.id)}
          >
            <Text style={styles.personaName}>{persona.name}</Text>
            <Text style={styles.personaTitle}>{persona.title}</Text>
            <Text style={styles.personaDesc}>{persona.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function getWuxingColor(key: string): string {
  const colors: Record<string, string> = {
    wood: '#4CAF50',
    fire: '#F44336',
    earth: '#FF9800',
    metal: '#9E9E9E',
    water: '#2196F3',
  };
  return colors[key] || '#9E9E9E';
}

const styles = StyleSheet.create({
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  // 用户信息卡片样式
  userInfoCard: {
    backgroundColor: '#161126',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4C2F80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#F8D05F',
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4C2F80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#F8D05F',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfoContent: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7F6F0',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8D8DAA',
    marginBottom: 8,
  },
  membershipBadge: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  membershipText: {
    color: '#1A0A18',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  loginPrompt: {
    backgroundColor: '#161126',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 8,
  },
  loginDesc: {
    fontSize: 14,
    color: '#B2B4C8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
  },
  loginButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guestLink: {
    marginTop: 16,
  },
  guestLinkText: {
    color: '#8D8DAA',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  inputLabel: {
    color: '#B2B4C8',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 14,
    color: '#F7F6F0',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#322243',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  genderButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#322243',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#4C2F80',
    borderColor: '#F8D05F',
  },
  genderText: {
    color: '#8D8DAA',
    fontSize: 15,
  },
  genderTextActive: {
    color: '#F8D05F',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#F8D05F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#4A4A5A',
  },
  saveButtonText: {
    color: '#1A0A18',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personaContainer: {
    gap: 12,
  },
  personaCard: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  personaCardActive: {
    borderColor: '#F8D05F',
  },
  personaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7F6F0',
  },
  personaTitle: {
    fontSize: 13,
    color: '#8D8DAA',
    marginTop: 4,
  },
  personaDesc: {
    fontSize: 14,
    color: '#B2B4C8',
    marginTop: 8,
    lineHeight: 20,
  },
  // 命盘样式
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8D05F',
    marginBottom: 16,
  },
  baziRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  baziItem: {
    alignItems: 'center',
    flex: 1,
  },
  baziLabel: {
    color: '#8D8DAA',
    fontSize: 12,
  },
  baziValue: {
    color: '#F7F6F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  wuxingContainer: {
    gap: 12,
  },
  wuxingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wuxingLabel: {
    color: '#F7F6F0',
    fontSize: 14,
    width: 30,
  },
  wuxingBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#2F2342',
    borderRadius: 4,
    overflow: 'hidden',
  },
  wuxingBar: {
    height: '100%',
    borderRadius: 4,
  },
  wuxingValue: {
    color: '#B2B4C8',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitTag: {
    backgroundColor: '#4C2F80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  traitText: {
    color: '#F7F6F0',
    fontSize: 13,
  },
  fortuneItem: {
    marginBottom: 12,
  },
  fortuneLabel: {
    color: '#C8A6FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fortuneValue: {
    color: '#B2B4C8',
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionText: {
    color: '#F7F6F0',
    fontSize: 14,
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#4C2F80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
