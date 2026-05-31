import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type TaskStepperProps = {
  currentStep: number;
  labels: string[];
};

export default function TaskStepper({ currentStep, labels }: TaskStepperProps) {
  return (
    <View style={styles.wrap}>
      {labels.map((label, idx) => {
        const active = idx <= currentStep;
        return (
          <View key={label} style={styles.item}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            {idx < labels.length - 1 ? <View style={[styles.line, active && styles.lineActive]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#4A3C6D',
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#F8D05F',
  },
  label: {
    color: '#8E84A5',
    fontSize: 11,
    flexShrink: 1,
  },
  labelActive: {
    color: '#EBDDA7',
    fontWeight: '600',
  },
  line: {
    height: 1,
    flex: 1,
    marginLeft: 6,
    marginRight: 4,
    backgroundColor: '#34274A',
  },
  lineActive: {
    backgroundColor: '#6A538E',
  },
});
