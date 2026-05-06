import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Svg width={220} height={220} viewBox="0 0 220 220" fill="none">
          <Circle cx={110} cy={110} r={100} fill={colors.backgroundDark} opacity={0.12} />
          <Path
            d="M64 78L100 150L156 78"
            stroke={colors.backgroundDark}
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={110} cy={112} r={8} fill={colors.backgroundDark} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

