import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '../../constants/Colors';
import { useUserStore } from '../../src/store/user';
import { usePersonaStore } from '../../src/store/persona';
import { pointsApi, PointsSummary, achievementApi, UserAchievement, AchievementProgress } from '../../src/services/api';
import * as Clipboard from 'expo-clipboard';

const colors = theme.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, chart, hasChart, isLoading, createUser, generateChart, loadUser, clearUser, logout, checkIn, checkInStatus, loadCheckInStatus } = useUserStore();
  const { personas, active: currentPersona, setActive } = usePersonaStore();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // 积分和成就状态
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [achievementUnlock, setAchievementUnlock] = useState<{ name: string; description: string; icon: string } | null>(null);

  // 分享功能
  const handleShare = async () => {
    if (!user) {
      Alert.alert('提示', '请先登录');
      router.push('/login');
      return;
    }

    setIsSharing(true);
    try {
      // 使用 referralCode 生成邀请链接
      const referralCode = user.referralCode || user.id;
      const shareUrl = `https://shanhai.app?ref=${referralCode}`;
      const shareMessage = `🔮 山海灵境 - 探索你的命运之旅\n\n邀请码: ${referralCode}\n使用我的邀请链接注册，你得50积分，我也得50积分！\n\n立即注册: ${shareUrl}`;
      
      // 优先使用剪贴板复制
      await Clipboard.setStringAsync(shareMessage);
      setCopied(true);
      Alert.alert('✅ 复制成功', `邀请链接已复制！\n\n${shareUrl}\n\n分享给朋友，你们各得50积分！`);
      
      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('分享失败:', error);
      // 尝试回退到剪贴板
      try {
        const referralCode = user.referralCode || user.id;
        const shareUrl = `https://shanhai.app?ref=${referralCode}`;
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert('✅ 复制成功', '链接已复制到剪贴板\n\n邀请成功各得50积分！');
      } catch (e) {
        Alert.alert('分享失败', '请稍后重试');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const [name, setName] = useState(user?.name || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [birthTime, setBirthTime] = useState(user?.birthTime || '');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>(
    (user?.calendarType as 'solar' | 'lunar') || 'solar',
  );
  const [isLeapMonth, setIsLeapMonth] = useState(!!user?.isLeapMonth);
  const [birthLocation, setBirthLocation] = useState(user?.birthLocation || '');
  const [birthLongitude, setBirthLongitude] = useState(
    user?.birthLongitude !== undefined && user?.birthLongitude !== null ? String(user.birthLongitude) : '',
  );
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'male');
  const [step, setStep] = useState<'input' | 'chart'>(() => {
    // 根据是否有命盘直接初始化正确的step，避免闪烁
    return hasChart ? 'chart' : 'input';
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // 检查用户是否登录
  const isLoggedIn = !!user;
  const isVip = user?.membership === 'vip' || user?.membership === 'premium';
  const membershipLabel = user?.membership === 'vip' ? 'VIP会员' : user?.membership === 'premium' ? '高级会员' : '免费用户';

  const handleMembershipPress = () => {
    router.push({
      pathname: '/(tabs)/points',
      params: { tab: 'subscription', focus: 'vip' },
    });
  };

  const handleOpenPointsMall = () => {
    router.push({
      pathname: '/(tabs)/points',
      params: { tab: 'mall' },
    });
  };
  
  // 页面加载时获取用户信息
  React.useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        await loadUser();
        // 加载签到状态
        await loadCheckInStatus();
      } catch (e) {
        console.error('加载用户失败:', e);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 加载积分和成就数据
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // 并行加载积分和成就数据
        const [pointsData, achievementsData, progressData] = await Promise.all([
          pointsApi.getSummary().catch(() => null),
          achievementApi.getUserAchievements().catch(() => []),
          achievementApi.getProgress().catch(() => null),
        ]);
        
        setPointsSummary(pointsData);
        setAchievements(achievementsData);
        setAchievementProgress(progressData);
      } catch (e) {
        console.error('加载积分成就数据失败:', e);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [user]);

  // 签到处理函数
  const handleCheckIn = async () => {
    if (!user) {
      Alert.alert('提示', '请先登录');
      router.push('/login');
      return;
    }
    
    if (checkInStatus?.todayCheckedIn) {
      return; // 今日已签到
    }
    
    setIsCheckingIn(true);
    try {
      const result = await checkIn();
      if (result?.success) {
        if (result.achievement) {
          setAchievementUnlock(result.achievement);
        } else {
          Alert.alert('签到成功', result.message || `获得 ${result.points || 0} 积分`);
        }
        // 刷新积分显示
        const pointsData = await pointsApi.getSummary().catch(() => null);
        setPointsSummary(pointsData);
      } else {
        Alert.alert('签到失败', result?.message || '请稍后重试');
      }
    } catch (e) {
      console.error('签到错误:', e);
      Alert.alert('签到失败', '请稍后重试');
    } finally {
      setIsCheckingIn(false);
    }
  };

  React.useEffect(() => {
    if (user && !isInitializing) {
      setName(user.name);
      setBirthDate(user.birthDate || '');
      setBirthTime(user.birthTime || '');
      setCalendarType((user.calendarType as 'solar' | 'lunar') || 'solar');
      setIsLeapMonth(!!user.isLeapMonth);
      setBirthLocation(user.birthLocation || '');
      setBirthLongitude(
        user.birthLongitude !== undefined && user.birthLongitude !== null ? String(user.birthLongitude) : '',
      );
      setGender(user.gender || 'male');
      if (hasChart) {
        setStep('chart');
      } else {
        setStep('input');
      }
    }
  }, [user, hasChart, isInitializing]);

  // 处理登出（Web 上 Alert.alert 无效，需用 window.confirm）
  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      setName('');
      setBirthDate('');
      setBirthTime('');
      setGender('male');
      setStep('input');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('确定要退出登录吗？')) {
        await doLogout();
      }
    } else {
      Alert.alert('确认退出', '确定要退出登录吗？', [
        { text: '取消', style: 'cancel' },
        { text: '退出', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !birthDate.trim() || !birthTime.trim()) {
      Alert.alert('提示', '请填写完整信息');
      return;
    }

    const parsedLongitude = birthLongitude.trim() ? Number(birthLongitude) : undefined;
    if (birthLongitude.trim() && Number.isNaN(parsedLongitude)) {
      Alert.alert('提示', '经度格式不正确，请输入数字');
      return;
    }

    try {
      await createUser({
        name: name.trim(),
        birthDate,
        birthTime,
        calendarType,
        isLeapMonth,
        birthLocation: birthLocation.trim() || undefined,
        birthLongitude: parsedLongitude,
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
      <>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        {/* 用户信息卡片 - 完整显示 */}
        {isLoggedIn && user && (
          <View style={[styles.userInfoCard, { backgroundColor: colors.surface, marginBottom: 16 }]}>
            <View style={styles.userInfoHeader}>
              <View style={styles.avatarContainer}>
                {user.avatar ? (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarEmoji}>{user.avatar}</Text>
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
                    {membershipLabel}
                  </Text>
                </View>
              </View>
            </View>
            {/* 个人信息详情 */}
            <View style={styles.userDetails}>
              {user.birthDate && (
                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>📅 出生日期</Text>
                  <Text style={styles.userDetailValue}>{user.birthDate}</Text>
                </View>
              )}
              {user.birthTime && (
                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>⏰ 出生时间</Text>
                  <Text style={styles.userDetailValue}>{user.birthTime}</Text>
                </View>
              )}
              {user.gender && (
                <View style={styles.userDetailItem}>
                  <Text style={styles.userDetailLabel}>⚧ 性别</Text>
                  <Text style={styles.userDetailValue}>
                    {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {isLoggedIn && user && (
          <TouchableOpacity
            style={[
              styles.membershipCard,
              isVip ? styles.membershipCardVip : styles.membershipCardFree,
            ]}
            onPress={handleMembershipPress}
            activeOpacity={0.9}
          >
            <View style={styles.membershipHeaderRow}>
              <Text style={styles.membershipIcon}>{isVip ? '👑' : '✨'}</Text>
              <View style={styles.membershipInfo}>
                <Text style={styles.membershipCardTitle}>
                  {isVip ? `${membershipLabel} · 已开通` : '开通会员解锁完整能力'}
                </Text>
                <Text style={styles.membershipCardDesc}>
                  {isVip ? '查看会员权益与状态管理' : '无限次AI解读、专属内容、更多高级能力'}
                </Text>
              </View>
            </View>
            <View style={styles.membershipActionPill}>
              <Text style={styles.membershipActionText}>{isVip ? '管理会员' : '立即订阅'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {isLoggedIn && (
          <>
            <TouchableOpacity style={styles.mallEntryCard} onPress={handleOpenPointsMall} activeOpacity={0.9}>
              <View>
                <Text style={styles.mallEntryTitle}>🎁 积分商城</Text>
                <Text style={styles.mallEntryDesc}>兑换权益、查看任务、管理积分资产</Text>
              </View>
              <Text style={styles.mallEntryAction}>去看看 ›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mallEntryCard} onPress={() => router.push('/(tabs)/meditation')} activeOpacity={0.9}>
              <View>
                <Text style={styles.mallEntryTitle}>🧘 静心冥想</Text>
                <Text style={styles.mallEntryDesc}>静心、助眠、缓解焦虑</Text>
              </View>
              <Text style={styles.mallEntryAction}>去冥想 ›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 今日任务 */}
        {isLoggedIn && (
          <View style={[styles.dailyTasksCard, { backgroundColor: colors.surface, marginBottom: 16 }]}>
            <Text style={styles.dailyTasksTitle}>📋 今日任务</Text>
            <View style={styles.dailyTasksRow}>
              <TouchableOpacity
                style={styles.dailyTaskItem}
                onPress={handleCheckIn}
                disabled={isCheckingIn || checkInStatus?.todayCheckedIn}
              >
                <Text style={styles.dailyTaskIcon}>{checkInStatus?.todayCheckedIn ? '✅' : '📝'}</Text>
                <Text style={[styles.dailyTaskLabel, checkInStatus?.todayCheckedIn && styles.dailyTaskDone]}>
                  {checkInStatus?.todayCheckedIn ? '已签到' : '签到'}
                </Text>
                <Text style={styles.dailyTaskPoints}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/')}>
                <Text style={styles.dailyTaskIcon}>🎯</Text>
                <Text style={styles.dailyTaskLabel}>抽签</Text>
                <Text style={styles.dailyTaskPoints}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/(tabs)/zi')}>
                <Text style={styles.dailyTaskIcon}>✍️</Text>
                <Text style={styles.dailyTaskLabel}>测字</Text>
                <Text style={styles.dailyTaskPoints}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/')}>
                <Text style={styles.dailyTaskIcon}>💬</Text>
                <Text style={styles.dailyTaskLabel}>对话</Text>
                <Text style={styles.dailyTaskPoints}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 积分和成就卡片 - 完整显示 */}
        {isLoggedIn && (
          <View style={[styles.statsCard, { backgroundColor: colors.surface, marginBottom: 16 }]}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push({ pathname: '/(tabs)/points', params: { tab: 'mall' } })}
            >
              <Text style={styles.statValue}>{pointsSummary?.availablePoints ?? pointsSummary?.totalPoints ?? 0}</Text>
              <Text style={styles.statLabel}>积分</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: '#322243' }]} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push({ pathname: '/(tabs)/points', params: { tab: 'mall' } })}
            >
              <Text style={styles.statValue}>{achievements.filter(a => a.unlockedAt).length}</Text>
              <Text style={styles.statLabel}>成就</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: '#322243' }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleCheckIn} disabled={isCheckingIn || checkInStatus?.todayCheckedIn}>
              <Text style={[styles.statValue, checkInStatus?.todayCheckedIn && { color: '#4CAF50' }]}>
                {checkInStatus?.todayCheckedIn ? '✓' : '+10'}
              </Text>
              <Text style={styles.statLabel}>
                {checkInStatus?.todayCheckedIn ? '已签到' : '签到'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 签到和邀请卡片 */}
        {isLoggedIn && (
          <View style={[styles.pointsAndCheckin, { marginBottom: 16 }]}>
            {/* 签到状态 */}
            <TouchableOpacity 
              style={[styles.checkinStatusCard, checkInStatus?.todayCheckedIn && styles.checkinStatusCardDisabled]} 
              onPress={handleCheckIn}
              disabled={isCheckingIn || checkInStatus?.todayCheckedIn}
            >
              <View style={styles.checkinStatusHeader}>
                <Text style={styles.checkinStatusIcon}>
                  {checkInStatus?.todayCheckedIn ? '✅' : isCheckingIn ? '⏳' : '📝'}
                </Text>
                <View style={styles.checkinStatusInfo}>
                  <Text style={styles.checkinStatusValue}>
                    {checkInStatus?.todayCheckedIn ? '今日已签到' : isCheckingIn ? '签到中...' : '签到领积分'}
                  </Text>
                  <Text style={styles.checkinStatusLabel}>
                    连续 {checkInStatus?.currentStreak || 0} 天
                  </Text>
                </View>
                <View style={styles.checkinPointsBadge}>
                  <Text style={styles.checkinPointsText}>+10</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* 分享邀请 */}
            <TouchableOpacity style={styles.shareCard} onPress={handleShare} disabled={isSharing}>
              <View style={styles.shareCardContent}>
                <Text style={styles.shareIcon}>🎁</Text>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareTitle}>邀请好友得积分</Text>
                  <Text style={styles.shareDesc}>好友注册你得50积分，他/她也得50积分！</Text>
                  {user?.referralCode && (
                    <Text style={styles.referralCode}>我的推荐码: {user.referralCode}</Text>
                  )}
                </View>
                <View style={[styles.shareButton, { backgroundColor: copied ? '#4CAF50' : '#F8D05F' }]}>
                  <Text style={styles.shareButtonText}>{isSharing ? '...' : (copied ? '✅ 已复制' : '📋 复制链接')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

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

        {/* 退出登录 - 页面底部 */}
        {isLoggedIn && (
          <View style={styles.logoutSection}>
            <Text style={styles.logoutSectionTitle}>账户安全</Text>
            <TouchableOpacity
              style={[styles.logoutButtonBottom, Platform.OS === 'web' && { cursor: 'pointer' }]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonBottomText}>退出登录</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Modal visible={!!achievementUnlock} animationType="fade" transparent onRequestClose={() => setAchievementUnlock(null)}>
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementModalContent}>
            <Text style={styles.achievementModalBadge}>{achievementUnlock?.icon || '🏆'}</Text>
            <Text style={styles.achievementModalTitle}>成就解锁</Text>
            <Text style={styles.achievementModalName}>{achievementUnlock?.name}</Text>
            <Text style={styles.achievementModalDesc}>{achievementUnlock?.description}</Text>
            <TouchableOpacity style={styles.achievementModalButton} onPress={() => setAchievementUnlock(null)}>
              <Text style={styles.achievementModalButtonText}>太棒了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
                  <Text style={styles.avatarEmoji}>{user.avatar}</Text>
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
                  {membershipLabel}
                </Text>
              </View>
            </View>
          </View>
          {/* 个人信息详情 */}
          <View style={styles.userDetails}>
            {user.birthDate && (
              <View style={styles.userDetailItem}>
                <Text style={styles.userDetailLabel}>📅 出生日期</Text>
                <Text style={styles.userDetailValue}>{user.birthDate}</Text>
              </View>
            )}
            {user.birthTime && (
              <View style={styles.userDetailItem}>
                <Text style={styles.userDetailLabel}>⏰ 出生时间</Text>
                <Text style={styles.userDetailValue}>{user.birthTime}</Text>
              </View>
            )}
            {user.gender && (
              <View style={styles.userDetailItem}>
                <Text style={styles.userDetailLabel}>⚧ 性别</Text>
                <Text style={styles.userDetailValue}>
                  {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                </Text>
              </View>
            )}
          </View>
          
          {/* 积分和签到状态 */}
          <View style={styles.pointsAndCheckin}>
            {/* 积分显示 */}
            <TouchableOpacity style={styles.pointsCard} onPress={() => router.push('/points')}>
              <View style={styles.pointsItem}>
                <Text style={styles.pointsIcon}>💎</Text>
                <View>
                  <Text style={styles.pointsValue}>{pointsSummary?.availablePoints || 0}</Text>
                  <Text style={styles.pointsLabel}>可用积分</Text>
                </View>
              </View>
              <View style={styles.pointsDivider} />
              <View style={styles.pointsItem}>
                <Text style={styles.pointsIcon}>📈</Text>
                <View>
                  <Text style={styles.pointsValue}>{pointsSummary?.totalPoints || 0}</Text>
                  <Text style={styles.pointsLabel}>总积分</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* 签到状态 */}
            <TouchableOpacity 
              style={[styles.checkinStatusCard, checkInStatus?.todayCheckedIn && styles.checkinStatusCardDisabled]} 
              onPress={handleCheckIn}
              disabled={isCheckingIn || checkInStatus?.todayCheckedIn}
            >
              <View style={styles.checkinStatusHeader}>
                <Text style={styles.checkinStatusIcon}>
                  {checkInStatus?.todayCheckedIn ? '✅' : isCheckingIn ? '⏳' : '📝'}
                </Text>
                <View style={styles.checkinStatusInfo}>
                  <Text style={styles.checkinStatusValue}>
                    {checkInStatus?.todayCheckedIn ? '今日已签到' : isCheckingIn ? '签到中...' : '签到领积分'}
                  </Text>
                  <Text style={styles.checkinStatusLabel}>
                    连续 {checkInStatus?.currentStreak || 0} 天
                  </Text>
                </View>
                <View style={styles.checkinPointsBadge}>
                  <Text style={styles.checkinPointsText}>+10</Text>
                </View>
              </View>
              
              {/* 签到进度条 */}
              {!checkInStatus?.todayCheckedIn && (
                <View style={styles.streakProgressContainer}>
                  <View style={styles.streakProgressBar}>
                    <View style={[
                      styles.streakProgressFill, 
                      { width: `${Math.min(((checkInStatus?.currentStreak || 0) / 3) * 100, 100)}%` }
                    ]} />
                  </View>
                  <View style={styles.streakMilestones}>
                    <Text style={[styles.streakMilestoneText, (checkInStatus?.currentStreak || 0) >= 3 && styles.streakMilestoneDone]}>3天</Text>
                    <Text style={[styles.streakMilestoneText, (checkInStatus?.currentStreak || 0) >= 7 && styles.streakMilestoneDone]}>7天</Text>
                    <Text style={[styles.streakMilestoneText, (checkInStatus?.currentStreak || 0) >= 30 && styles.streakMilestoneDone]}>30天</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
            
            {/* 分享邀请 */}
            <TouchableOpacity style={styles.shareCard} onPress={handleShare} disabled={isSharing}>
              <View style={styles.shareCardContent}>
                <Text style={styles.shareIcon}>🎁</Text>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareTitle}>邀请好友得积分</Text>
                  <Text style={styles.shareDesc}>好友注册你得50积分，他/她也得50积分！</Text>
                  {/* 显示用户推荐码 */}
                  {user?.referralCode && (
                    <Text style={styles.referralCode}>我的推荐码: {user.referralCode}</Text>
                  )}
                </View>
                <View style={[styles.shareButton, { backgroundColor: copied ? '#4CAF50' : '#F8D05F' }]}>
                  <Text style={styles.shareButtonText}>{isSharing ? '...' : (copied ? '✅ 已复制' : '📋 复制链接')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoggedIn && user && (
        <TouchableOpacity
          style={[
            styles.membershipCard,
            isVip ? styles.membershipCardVip : styles.membershipCardFree,
          ]}
          onPress={handleMembershipPress}
          activeOpacity={0.9}
        >
          <View style={styles.membershipHeaderRow}>
            <Text style={styles.membershipIcon}>{isVip ? '👑' : '✨'}</Text>
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipCardTitle}>
                {isVip ? `${membershipLabel} · 已开通` : '开通会员解锁完整能力'}
              </Text>
              <Text style={styles.membershipCardDesc}>
                {isVip ? '查看会员权益与状态管理' : '无限次AI解读、专属内容、更多高级能力'}
              </Text>
            </View>
          </View>
          <View style={styles.membershipActionPill}>
            <Text style={styles.membershipActionText}>{isVip ? '管理会员' : '立即订阅'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {isLoggedIn && (
        <>
          <TouchableOpacity style={styles.mallEntryCard} onPress={handleOpenPointsMall} activeOpacity={0.9}>
            <View>
              <Text style={styles.mallEntryTitle}>🎁 积分商城</Text>
              <Text style={styles.mallEntryDesc}>兑换权益、查看任务、管理积分资产</Text>
            </View>
            <Text style={styles.mallEntryAction}>去看看 ›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mallEntryCard} onPress={() => router.push('/(tabs)/meditation')} activeOpacity={0.9}>
            <View>
              <Text style={styles.mallEntryTitle}>🧘 静心冥想</Text>
              <Text style={styles.mallEntryDesc}>静心、助眠、缓解焦虑，在山海世界中寻找宁静</Text>
            </View>
            <Text style={styles.mallEntryAction}>去冥想 ›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 今日任务 - 输入表单视图 */}
      {isLoggedIn && (
        <View style={[styles.dailyTasksCard, { backgroundColor: colors.surface, marginBottom: 16 }]}>
          <Text style={styles.dailyTasksTitle}>📋 今日任务</Text>
          <View style={styles.dailyTasksRow}>
            <TouchableOpacity style={styles.dailyTaskItem} onPress={handleCheckIn} disabled={isCheckingIn || checkInStatus?.todayCheckedIn}>
              <Text style={styles.dailyTaskIcon}>{checkInStatus?.todayCheckedIn ? '✅' : '📝'}</Text>
              <Text style={[styles.dailyTaskLabel, checkInStatus?.todayCheckedIn && styles.dailyTaskDone]}>{checkInStatus?.todayCheckedIn ? '已签到' : '签到'}</Text>
              <Text style={styles.dailyTaskPoints}>+10</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/')}>
              <Text style={styles.dailyTaskIcon}>🎯</Text>
              <Text style={styles.dailyTaskLabel}>抽签</Text>
              <Text style={styles.dailyTaskPoints}>+5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/(tabs)/zi')}>
              <Text style={styles.dailyTaskIcon}>✍️</Text>
              <Text style={styles.dailyTaskLabel}>测字</Text>
              <Text style={styles.dailyTaskPoints}>+5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dailyTaskItem} onPress={() => router.push('/')}>
              <Text style={styles.dailyTaskIcon}>💬</Text>
              <Text style={styles.dailyTaskLabel}>对话</Text>
              <Text style={styles.dailyTaskPoints}>+5</Text>
            </TouchableOpacity>
          </View>
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
          placeholder={calendarType === 'lunar' ? '农历格式：1990-05-15' : '阳历格式：1990-05-15'}
          placeholderTextColor="#6F6287"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <Text style={styles.inputLabel}>历法类型</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, calendarType === 'solar' && styles.genderButtonActive]}
            onPress={() => {
              setCalendarType('solar');
              setIsLeapMonth(false);
            }}
          >
            <Text style={[styles.genderText, calendarType === 'solar' && styles.genderTextActive]}>阳历</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, calendarType === 'lunar' && styles.genderButtonActive]}
            onPress={() => setCalendarType('lunar')}
          >
            <Text style={[styles.genderText, calendarType === 'lunar' && styles.genderTextActive]}>农历</Text>
          </TouchableOpacity>
        </View>
        {calendarType === 'lunar' && (
          <TouchableOpacity
            style={[styles.genderButton, isLeapMonth && styles.genderButtonActive, { marginTop: 10 }]}
            onPress={() => setIsLeapMonth((v) => !v)}
          >
            <Text style={[styles.genderText, isLeapMonth && styles.genderTextActive]}>
              {isLeapMonth ? '闰月：是' : '闰月：否'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.inputLabel}>出生时间</Text>
        <TextInput
          style={styles.input}
          placeholder="格式：14:30"
          placeholderTextColor="#6F6287"
          value={birthTime}
          onChangeText={setBirthTime}
        />

        <Text style={styles.inputLabel}>出生地（城市）</Text>
        <TextInput
          style={styles.input}
          placeholder="例：广东广州"
          placeholderTextColor="#6F6287"
          value={birthLocation}
          onChangeText={setBirthLocation}
        />

        <Text style={styles.inputLabel}>出生地经度（真太阳时校准，影响时辰）</Text>
        <TextInput
          style={styles.input}
          placeholder="例：113.8（萍乡）、114.3（南昌）"
          placeholderTextColor="#6F6287"
          value={birthLongitude}
          onChangeText={setBirthLongitude}
          keyboardType="decimal-pad"
        />
        <Text style={styles.inputHint}>如 7:06 出生在萍乡(113.8°E)，经校准后为卯时；不填则按北京时区</Text>

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
      <Text style={styles.sectionTitle}>🏆 成就徽章</Text>
      <View style={[styles.achievementsCard, { backgroundColor: colors.surface }]}>
        {/* 成就进度 */}
        <View style={styles.achievementProgress}>
          <View style={styles.achievementProgressInfo}>
            <Text style={styles.achievementProgressText}>
              已解锁 {achievementProgress?.unlocked || 0} / {achievementProgress?.total || 0}
            </Text>
            <Text style={styles.achievementProgressPoints}>
              成就积分: {achievementProgress?.unlockedPoints || 0}
            </Text>
          </View>
          <View style={styles.achievementProgressBar}>
            <View 
              style={[
                styles.achievementProgressFill, 
                { 
                  width: `${achievementProgress?.total ? (achievementProgress.unlocked / achievementProgress.total * 100) : 0}%` 
                }
              ]} 
            />
          </View>
        </View>
        
        {/* 成就徽章网格 */}
        {achievements.length > 0 ? (
          <View style={styles.achievementGrid}>
            {achievements.slice(0, 6).map((ua) => (
              <View key={ua.id} style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>{ua.achievement.icon || '🏆'}</Text>
                <Text style={styles.achievementName} numberOfLines={1}>
                  {ua.achievement.name}
                </Text>
              </View>
            ))}
            {achievements.length > 6 && (
              <TouchableOpacity style={styles.achievementMore}>
                <Text style={styles.achievementMoreText}>+{achievements.length - 6}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.achievementEmpty}>
            <Text style={styles.achievementEmptyText}>完成登录、抽签等任务解锁成就</Text>
          </View>
        )}
      </View>

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
      
      {/* 退出登录 - 仅已登录用户显示 */}
      {isLoggedIn && (
        <View style={styles.logoutSection}>
          <Text style={styles.logoutSectionTitle}>账户安全</Text>
          <TouchableOpacity
            style={[styles.logoutButtonBottom, Platform.OS === 'web' && { cursor: 'pointer' }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonBottomText}>退出登录</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 法律链接 */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.legalLinkText}>隐私政策</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={styles.legalLinkText}>服务条款</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={() => router.push('/faq')}>
          <Text style={styles.legalLinkText}>常见问题</Text>
        </TouchableOpacity>
      </View>

      {/* 成就解锁弹窗 */}
      <Modal visible={!!achievementUnlock} animationType="fade" transparent onRequestClose={() => setAchievementUnlock(null)}>
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementModalContent}>
            <Text style={styles.achievementModalBadge}>{achievementUnlock?.icon || '🏆'}</Text>
            <Text style={styles.achievementModalTitle}>成就解锁</Text>
            <Text style={styles.achievementModalName}>{achievementUnlock?.name}</Text>
            <Text style={styles.achievementModalDesc}>{achievementUnlock?.description}</Text>
            <TouchableOpacity style={styles.achievementModalButton} onPress={() => setAchievementUnlock(null)}>
              <Text style={styles.achievementModalButtonText}>太棒了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  // 积分成就卡片样式
  statsCard: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statValue: {
    color: '#F8D05F',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8D8DAA',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  dailyTasksCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  dailyTasksTitle: {
    color: '#F8D05F',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  dailyTasksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dailyTaskItem: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#322243',
  },
  dailyTaskIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  dailyTaskLabel: {
    color: '#F7F6F0',
    fontSize: 12,
    fontWeight: '600',
  },
  dailyTaskDone: {
    color: '#4CAF50',
  },
  dailyTaskPoints: {
    color: '#F8D05F',
    fontSize: 11,
    marginTop: 2,
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
  avatarEmoji: {
    fontSize: 36,
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
  membershipCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  membershipCardVip: {
    backgroundColor: '#2B1F46',
    borderColor: '#F8D05F',
  },
  membershipCardFree: {
    backgroundColor: '#241935',
    borderColor: '#6E52A3',
  },
  membershipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipCardTitle: {
    color: '#F7F6F0',
    fontSize: 16,
    fontWeight: '700',
  },
  membershipCardDesc: {
    color: '#B2B4C8',
    fontSize: 13,
    marginTop: 4,
  },
  membershipActionPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#F8D05F',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  membershipActionText: {
    color: '#1A1328',
    fontSize: 12,
    fontWeight: '700',
  },
  mallEntryCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1A1328',
    borderWidth: 1,
    borderColor: '#322243',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mallEntryTitle: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: '700',
  },
  mallEntryDesc: {
    color: '#8D8DAA',
    fontSize: 12,
    marginTop: 4,
  },
  mallEntryAction: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '700',
  },
  userDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F2342',
  },
  userDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetailLabel: {
    color: '#B2B4C8',
    fontSize: 14,
  },
  userDetailValue: {
    color: '#F7F6F0',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  logoutSectionTitle: {
    color: '#8D8DAA',
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 4,
  },
  logoutButtonBottom: {
    backgroundColor: '#2F2342',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  logoutButtonBottomText: {
    color: '#FF6B6B',
    fontSize: 16,
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
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    paddingVertical: 12,
  },
  legalLinkText: {
    color: '#8D8DAA',
    fontSize: 13,
  },
  legalSeparator: {
    color: '#3D3D5C',
    marginHorizontal: 12,
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  inputHint: {
    color: '#6F6287',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
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
  
  // 积分和签到样式
  pointsAndCheckin: {
    marginTop: 16,
    gap: 12,
  },
  pointsCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#322243',
  },
  pointsItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsIcon: {
    fontSize: 24,
  },
  pointsValue: {
    color: '#F8D05F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: '#8D8DAA',
    fontSize: 11,
  },
  pointsDivider: {
    width: 1,
    backgroundColor: '#322243',
    marginHorizontal: 12,
  },
  checkinStatusCard: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#322243',
  },
  checkinStatusCardDisabled: {
    opacity: 0.6,
  },
  checkinStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkinStatusIcon: {
    fontSize: 24,
  },
  checkinStatusValue: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: '600',
  },
  checkinStatusLabel: {
    color: '#8D8DAA',
    fontSize: 12,
    marginTop: 2,
  },
  checkinStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkinPointsBadge: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkinPointsText: {
    color: '#1A1328',
    fontSize: 12,
    fontWeight: '700',
  },
  // 签到进度条
  streakProgressContainer: {
    marginTop: 12,
  },
  streakProgressBar: {
    height: 6,
    backgroundColor: '#2F2342',
    borderRadius: 3,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: '#F8D05F',
    borderRadius: 3,
  },
  streakMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  streakMilestoneText: {
    color: '#6F6287',
    fontSize: 10,
  },
  streakMilestoneDone: {
    color: '#F8D05F',
  },
  
  // 分享样式
  shareCard: {
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#322243',
    marginTop: 12,
  },
  shareCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 28,
  },
  shareInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shareTitle: {
    color: '#F7F6F0',
    fontSize: 15,
    fontWeight: '600',
  },
  shareDesc: {
    color: '#8D8DAA',
    fontSize: 12,
    marginTop: 2,
  },
  referralCode: {
    color: '#F8D05F',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  shareButton: {
    backgroundColor: '#F8D05F',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#1A1328',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // 成就样式
  achievementsCard: {
    backgroundColor: '#161126',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2F2342',
  },
  achievementProgress: {
    marginBottom: 16,
  },
  achievementProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  achievementProgressText: {
    color: '#F7F6F0',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementProgressPoints: {
    color: '#F8D05F',
    fontSize: 12,
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: '#2F2342',
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#F8D05F',
    borderRadius: 4,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '30%',
    backgroundColor: '#1A1328',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8D05F',
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  achievementName: {
    color: '#F7F6F0',
    fontSize: 11,
    textAlign: 'center',
  },
  achievementMore: {
    width: '30%',
    backgroundColor: '#2F2342',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementMoreText: {
    color: '#8D8DAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  achievementEmptyText: {
    color: '#6F6287',
    fontSize: 13,
    textAlign: 'center',
  },
});
