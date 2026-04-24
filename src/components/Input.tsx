import React from 'react';
import { View, TextInput, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { spacing, borders, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({
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
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.caption,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      fontWeight: '600',
      fontSize: 15,
      letterSpacing: -0.2,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderWidth: 1.5,
      borderColor: error ? colors.status.error : colors.border,
      color: colors.textPrimary,
      fontSize: 17,
      minHeight: 56,
    },
    inputDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
    </View>
  );
};

