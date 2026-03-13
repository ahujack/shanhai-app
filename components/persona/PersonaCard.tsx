import { View, Text, Image, TouchableOpacity } from 'react-native';
import theme from '../../constants/Colors';
import { PersonaProfile } from '../../src/types/persona';

interface PersonaCardProps {
  persona: PersonaProfile;
  active?: boolean;
  onPress?: () => void;
}

export function PersonaCard({ persona, active, onPress }: PersonaCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: active ? '#2B1F3C' : '#1B1427',
        borderRadius: 24,
        borderWidth: active ? 2 : 1,
        borderColor: active ? theme.dark.accent : '#2B2342',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}>
      <Image
        source={typeof persona.image === 'number' ? persona.image : { uri: persona.image }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.dark.text, fontSize: 16, fontWeight: '600' }}>
          {persona.name}
        </Text>
        <Text style={{ color: theme.dark.mutedText, fontSize: 13, marginTop: 2 }}>
          {persona.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {persona.toneTags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: '#2F2644',
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}>
              <Text style={{ color: theme.dark.accent, fontSize: 12 }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

