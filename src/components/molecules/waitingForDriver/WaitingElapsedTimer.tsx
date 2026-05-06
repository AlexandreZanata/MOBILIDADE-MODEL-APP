/**
 * @file WaitingElapsedTimer.tsx
 * @description Monospace elapsed-time counter shown while searching for a driver.
 * Counts up from 0 in MM:SS format.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { spacing, typography } from '@/theme';

interface WaitingElapsedTimerProps {
  /** Whether the timer should be running. Resets to 0 when toggled on. */
  running: boolean;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}`;
}

export function WaitingElapsedTimer({ running }: WaitingElapsedTimerProps): React.ReactElement {
  const { colors } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
      return;
    }
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{formatElapsed(elapsed)}</Text>
      <Text style={[styles.label, { color: colors.textHint }]}>{twfd('waitingTimeLabel')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 20,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  label: {
    ...typography.micro,
    marginTop: spacing.xs / 2,
    textTransform: 'lowercase',
  },
});
