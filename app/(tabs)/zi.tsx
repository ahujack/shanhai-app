import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/Colors';
import { ziApi, ZiResult, handwritingApi } from '../../src/services/api';
import HandwritingCanvas from '../../components/HandwritingCanvas';

export default function ZiScreen() {
  const insets = useSafeAreaInsets();
  const [inputZi, setInputZi] = useState('');
  const [result, setResult] = useState<ZiResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showColdReading, setShowColdReading] = useState(false);
  // 新增：手写模式
  const [isHandwritingMode, setIsHandwritingMode] = useState(false);

  // 打字模式测字
  const handleAnalyze = async () => {
    if (!inputZi.trim()) {
      Alert.alert('提示', '请输入一个汉字');
      return;
    }

    const zi = inputZi.trim().charAt(0);
    if (!/[\u4e00-\u9fa5]/.test(zi)) {
      Alert.alert('提示', '请输入一个有效的汉字');
      return;
    }

    setIsLoading(true);
    try {
      const data = await ziApi.analyze(zi);
      setResult(data);
    } catch (error) {
      console.error('测字失败:', error);
      Alert.alert('错误', '测字失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 手写模式识别并测字
  const handleHandwritingRecognize = async (svgString: string) => {
    console.log('开始手写识别，SVG长度:', svgString.length);
    setIsLoading(true);
    try {
      console.log('调用 handwritingApi.analyze...');
      const data = await handwritingApi.analyze(svgString);
      console.log('识别结果:', data);
      
      if (data.recognizedZi) {
        setInputZi(data.recognizedZi);
        setResult(data.analysis || null);
        Alert.alert('🎉 识别成功', `识别到汉字: ${data.recognizedZi}`, [
          { text: '查看解读', onPress: () => {} }
        ]);
      } else {
        Alert.alert('😔 识别失败', data.error || '未能识别出汉字，请重新书写');
      }
    } catch (error: any) {
      console.error('手写识别失败:', error);
      Alert.alert('错误', error?.message || '手写识别失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🔮 测字问心</Text>
        <Text style={styles.subtitle}>字是心画，写一字可窥心</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 输入模式切换 */}
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

        {/* 输入区域 */}
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
            // 手写模式
            <View style={styles.handwritingSection}>
              <HandwritingCanvas 
                onRecognize={handleHandwritingRecognize}
                isRecognizing={isLoading}
              />
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
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>笔画</Text>
                    <Text style={styles.infoValue}>{result.zi.bihua} 画</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>部首</Text>
                    <Text style={styles.infoValue}>{result.zi.bushou}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>五行</Text>
                    <Text style={[styles.infoValue, { color: getWuxingColor(result.zi.wuxing) }]}>
                      {result.zi.wuxing}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>阴阳</Text>
                    <Text style={styles.infoValue}>{result.zi.yinyang}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>吉凶</Text>
                    <Text style={[styles.infoValue, { color: getJixiongColor(result.zi.jixiong) }]}>
                      {result.zi.jixiong}
                    </Text>
                  </View>
                </View>
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
                <Text style={styles.guaXiangText}>{result.zi.guaXiang}</Text>
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
                    <View key={index} style={[styles.traitTag, { backgroundColor: theme.dark.tint + '30' }]}>
                      <Text style={[styles.traitText, { color: theme.dark.tint }]}>{trait}</Text>
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

            {/* 后续问题 */}
            {result.followUpQuestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤔 想和你聊聊</Text>
                <View style={[styles.card, { backgroundColor: theme.dark.card }]}>
                  {result.followUpQuestions.map((question, index) => (
                    <Text key={index} style={styles.questionText}>
                      • {question}
                    </Text>
                  ))}
                </View>
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
  handwritingSection: {
    alignItems: 'center',
    marginTop: 10,
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
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  bottomPadding: {
    height: 40,
  },
});
