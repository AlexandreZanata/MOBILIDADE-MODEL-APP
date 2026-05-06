/**
 * @file WaitingPulseRing.tsx
 * @description Animated pulsing ring rendered over the user's map pin
 * while the app is searching for a driver.
 *
 * Spec: accent color, opacity 0.15→0, scale 1.0→2.2, 1.6s loop, ease-out.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface WaitingPulseRingProps {
  /** Diameter of the inner dot (the ring expands from this size). */
  size?: number;
}

const PULSE_DURATION_MS = 1600;
const SCALE_END = 2.2;

export function WaitingPulseRing({ size = 48 }: WaitingPulseRingProps): React.ReactElement {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: SCALE_END,
          duration: PULSE_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: PULSE_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  const ringSize = size * 1.5;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: colors.accent,
            opacity,
            transform: [{ scale }],
            marginLeft: -(ringSize - size) / 2,
            marginTop: -(ringSize - size) / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
