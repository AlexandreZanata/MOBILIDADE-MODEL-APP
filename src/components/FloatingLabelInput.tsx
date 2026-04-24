import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, ViewStyle, TextStyle, Animated } from 'react-native';
import { spacing, borders, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface FloatingLabelInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  rightIcon?: React.ReactNode;
  maxLength?: number;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  placeholder,
  value,
  onChangeText,
  label,
  style,
  inputStyle,
  editable = true,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  error = false,
  onFocus,
  onBlur,
  rightIcon,
  maxLength,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnim] = useState(new Animated.Value(value && value.length > 0 ? 1 : 0));
  const hasValue = value && value.length > 0;
  const isLabelFloating = isFocused || hasValue;

  // Helper function to convert hex to rgba
    React.useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isLabelFloating ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isLabelFloating]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [spacing.md + 6, spacing.xs + 2],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const labelColor = isLabelFloating 
    ? (error ? colors.status.error : colors.primary)
    : colors.textSecondary;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 0,
    },
    inputContainer: {
      position: 'relative',
      height: 60,
    },
    input: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: spacing.md + 4,
      paddingRight: rightIcon ? 52 : spacing.md + 4,
      paddingTop: spacing.md + 6,
      paddingBottom: spacing.md - 2,
      borderWidth: isFocused ? 2.5 : 2,
      borderColor: error 
        ? colors.status.error 
        : isFocused 
          ? colors.primary 
          : colors.border,
      color: colors.textPrimary,
      fontSize: 16,
    },
    label: {
      position: 'absolute',
      left: spacing.md + 4,
      zIndex: 1,
      pointerEvents: 'none',
    },
    labelText: {
      fontSize: 16,
      fontWeight: '400',
    },
    rightIconContainer: {
      position: 'absolute',
      right: spacing.sm + 4,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      width: 44,
      zIndex: 2,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    errorText: {
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
      fontSize: 12,
      color: colors.status.error,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isFocused && !error && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            },
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
          placeholder={isLabelFloating ? placeholder : ''}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
        />
        <Animated.Text 
          style={[
            styles.label,
            styles.labelText,
            {
              top: labelTop,
              transform: [{ scale: labelScale }],
              color: labelColor,
              fontSize: isLabelFloating ? 12 : 16,
              fontWeight: isLabelFloating ? '600' : '400',
            }
          ]}
        >
          {label}
        </Animated.Text>
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
    </View>
  );
};
