import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type PromptChipsProps = {
  items: string[];
  disabled?: boolean;
  onSelect: (value: string) => void;
};

export default function PromptChips({ items, disabled, onSelect }: PromptChipsProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => onSelect(item)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`使用示例：${item}`}
        >
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: '#231938',
    borderColor: '#3A2B5A',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.65,
  },
  text: {
    color: '#D8CFEC',
    fontSize: 12,
    lineHeight: 18,
  },
});
