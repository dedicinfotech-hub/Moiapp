import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';
import { useScaledTheme } from '../../theme/useScaledTheme';

interface StepIndicatorProps {
  current: number;
  steps: string[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  const { scaledFontSize: fs } = useScaledTheme();

  return (
    <View style={styles.wrap}>
      {steps.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <React.Fragment key={`${label}-${i}`}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.circle,
                  active && styles.circleActive,
                  done && styles.circleDone,
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    { fontSize: fs.sm },
                    (active || done) && styles.circleTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
              <Text
                style={[styles.label, { fontSize: fs.xs }, active && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.line, done && styles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl },
  stepCol: { alignItems: 'center', width: 72 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  circleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  circleDone: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  circleText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  circleTextActive: { color: colors.text },
  label: { fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  labelActive: { color: colors.primary, fontWeight: '600' },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 13 },
  lineDone: { backgroundColor: colors.primary },
});
