/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import useTheme from '@hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────
interface InputProps extends Omit<TextInputProps, 'style'> {
  label?:       string;
  placeholder?: string;
  value:        string;
  onChangeText: (text: string) => void;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  isPassword?:  boolean;
  isDisabled?:  boolean;
  size?:        'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
}

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword  = false,
  isDisabled  = false,
  size        = 'md',
  containerStyle,
  ...rest
}: InputProps): React.JSX.Element => {
  const { colors, spacing, borderRadius, textStyles, componentSize, shadows } = useTheme();
  const [isFocused,   setIsFocused]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const hasLeftIcon = leftIcon !== undefined && leftIcon !== null;
  const hasTrailingAccessory = (rightIcon !== undefined && rightIcon !== null) || isPassword;

  const handleFocus = useCallback((): void => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((): void => {
    setIsFocused(false);
  }, []);

  const heightMap = {
    sm: componentSize.inputSm,
    md: componentSize.inputMd,
    lg: componentSize.inputLg,
  };

  const borderColor = error
    ? colors.border.error
    : isFocused
    ? colors.border.focus
    : colors.border.default;

  const labelColor = error
    ? colors.error.text
    : isFocused
    ? colors.primary.light
    : colors.text.secondary;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Static Label (no floating) */}
      {label !== undefined && label !== null && (
        <Text
          style={[
            textStyles.label,
            styles.label,
            { color: labelColor },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputContainer,
          {
            height:          heightMap[size],
            borderRadius:    borderRadius.lg,
            borderColor,
            backgroundColor: isDisabled
              ? `${colors.bg.input}80`
              : colors.bg.input,
            paddingHorizontal: spacing[4],
          },
          isFocused && {
            ...shadows.sm,
            shadowColor: error ? colors.error.default : colors.primary.default,
          },
        ]}
      >
        {/* Left Icon */}
        {hasLeftIcon && (
          <View style={styles.iconLeft}>{leftIcon}</View>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={isPassword && !showPassword}
          editable={!isDisabled}
          style={[
            styles.input,
            textStyles.bodyMd,
            hasLeftIcon && styles.inputWithLeftIcon,
            hasTrailingAccessory && styles.inputWithTrailingAccessory,
            {
              color:     isDisabled ? colors.text.disabled : colors.text.primary,
              flex:      1,
            },
          ]}
          selectionColor={colors.primary.default}
          {...rest}
        />

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => { setShowPassword((prev) => !prev); }}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.passwordToggleText}>
              <Text>{showPassword ? '🙈' : '👁'}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {rightIcon !== undefined && rightIcon !== null && !isPassword && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </TouchableOpacity>

      {/* Error / Hint */}
      {(error !== undefined && error !== null || hint !== undefined && hint !== null) && (
        <Text
          style={[
            textStyles.caption,
            styles.helperText,
            { color: error !== undefined && error !== null ? colors.error.text : colors.text.tertiary },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  helperText: {
    marginLeft: 4,
    marginTop: 2,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  input: {
    padding: 0, // Reset default padding
  },
  inputContainer: {
    alignItems:     'center',
    borderWidth:    1.5,
    flexDirection:  'row',
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithTrailingAccessory: {
    marginRight: 8,
  },
  label: {
    marginBottom: 2,
  },
  passwordToggleText: {
    fontSize: 14,
  },
});

export { Input };
