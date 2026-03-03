import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import theme from '../../constants/Colors';
import { GradientButton } from '../../components/ui/GradientButton';
import { SectionCard } from '../../components/ui/SectionCard';

const mockCards = [
  { id: 'fortune', label: '心灯签', summary: '洞察迷雾、重拾方向' },
  { id: 'emotion', label: '情感签', summary: '疗愈关系，澄澈情绪' },
  { id: 'body', label: '身心签', summary: '节气养生与正念提示' },
];

export default function DrawScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.dark.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
      <SectionCard
        title="每日灵签"
        description="静心片刻，点击抽取今日的守护指引"
        actionSlot={<GradientButton label="抽一签" onPress={() => {}} style={{ margin: 0 }} />}>
        <View
          style={{
            backgroundColor: '#1F152C',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#342348',
          }}>
          <Text style={{ color: theme.dark.accent, marginBottom: 8 }}>今日签文</Text>
          <Text style={{ color: theme.dark.text, fontSize: 20, lineHeight: 28 }}>
            “诚则灵，静则明。”
          </Text>
          <Text style={{ color: theme.dark.mutedText, marginTop: 10, lineHeight: 20 }}>
            今日宜写下心愿与困惑，在夜间再读一遍，感受念头的变化。
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="签种选择"
        description="按需选择不同的签种，匹配对应的推演逻辑">
        <View style={{ gap: 14 }}>
          {mockCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={{
                backgroundColor: '#1B1326',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#2B203B',
              }}>
              <Text style={{ color: theme.dark.text, fontSize: 16, fontWeight: '600' }}>
                {card.label}
              </Text>
              <Text style={{ color: theme.dark.mutedText, marginTop: 4 }}>{card.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="抽签仪式指南"
        description="帮助用户在真实仪式感中进入心流状态">
        <Text style={{ color: theme.dark.mutedText, lineHeight: 22 }}>
          1. 深呼吸三次；2. 默念问题并长按抽签按钮；3. 记录抽到的签文，以便解读环节引用。
        </Text>
      </SectionCard>
    </ScrollView>
  );
}

