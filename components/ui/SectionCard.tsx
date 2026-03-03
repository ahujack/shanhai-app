import { PropsWithChildren } from 'react';
import { View, Text, ViewProps } from 'react-native';
import theme from '../../constants/Colors';

interface SectionCardProps extends ViewProps {
  title: string;
  description?: string;
  actionSlot?: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  children,
  actionSlot,
  style,
  ...rest
}: PropsWithChildren<SectionCardProps>) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.dark.surface,
          borderRadius: 28,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#2D2142',
        },
        style,
      ]}
      {...rest}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: description ? 'flex-start' : 'center',
          marginBottom: 16,
          gap: 12,
        }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.dark.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
          {description ? (
            <Text style={{ color: theme.dark.mutedText, marginTop: 6 }}>{description}</Text>
          ) : null}
        </View>
        {actionSlot}
      </View>
      {children}
    </View>
  );
}

