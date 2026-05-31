import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export type ResultAction = {
  key: string;
  label: string;
};

type ResultActionBarProps = {
  actions: ResultAction[];
  onPress: (action: ResultAction) => void;
};

export default function ResultActionBar({ actions, onPress }: ResultActionBarProps) {
  return (
    <View style={styles.wrap}>
      {actions.map((action) => (
        <TouchableOpacity key={action.key} style={styles.button} onPress={() => onPress(action)} activeOpacity={0.85}>
          <Text style={styles.text}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2B2142',
    borderWidth: 1,
    borderColor: '#4A3C6D',
  },
  text: {
    color: '#F2E8B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
