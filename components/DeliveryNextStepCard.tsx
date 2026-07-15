import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../constants/Colors';

type Action = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  title: string;
  summary: string;
  primary: Action;
  secondary?: Action | null;
  tertiary?: Action | null;
};

const colors = theme.dark;

export default function DeliveryNextStepCard({
  title,
  summary,
  primary,
  secondary,
  tertiary,
}: Props) {
  const sideActions = [secondary, tertiary].filter(Boolean) as Action[];

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <TouchableOpacity
        style={[styles.primaryBtn, primary.disabled && styles.disabled]}
        onPress={primary.onPress}
        disabled={primary.disabled}
      >
        <Text style={styles.primaryText}>{primary.label}</Text>
      </TouchableOpacity>
      {sideActions.length > 0 ? (
        <View style={styles.secondaryRow}>
          {sideActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.secondaryBtn, action.disabled && styles.disabled]}
              onPress={action.onPress}
              disabled={action.disabled}
            >
              <Text style={styles.secondaryText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#141C2B',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.24)',
  },
  kicker: {
    color: colors.tabIconSelected,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  summary: {
    color: '#DCE2EE',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.tabIconSelected,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#17120A',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    minWidth: 0,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.3)',
    backgroundColor: 'rgba(214, 179, 106, 0.08)',
  },
  secondaryText: {
    color: '#E9D29B',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.58,
  },
});
