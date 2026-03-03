import { LinearGradient } from 'expo-linear-gradient';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import theme from '../../constants/Colors';

interface Props extends TouchableOpacityProps {
  label: string;
  icon?: React.ReactNode;
}

export function GradientButton({ label, icon, style, ...rest }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={style} {...rest}>
      <LinearGradient
        colors={theme.dark.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 999,
          paddingVertical: 14,
          paddingHorizontal: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        {icon}
        <Text style={{ color: '#1A0A18', fontSize: 16, fontWeight: '600' }}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

