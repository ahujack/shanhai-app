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
        backgroundColor: active ? 'rgba(214, 179, 106, 0.12)' : theme.dark.surface,
        borderRadius: 16,
        borderWidth: active ? 1 : 1,
        borderColor: active ? theme.dark.accent : theme.dark.palette.plum,
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
                backgroundColor: 'rgba(214, 179, 106, 0.12)',
                borderRadius: 4,
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

