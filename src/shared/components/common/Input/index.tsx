import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
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

  // Floating label animation
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = useCallback((): void => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue:         1,
      duration:        160,
      useNativeDriver: false,
    }).start();
  }, [labelAnim]);

  const handleBlur = useCallback((): void => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue:         0,
        duration:        160,
        useNativeDriver: false,
      }).start();
    }
  }, [labelAnim, value]);

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

  const floatingLabelTop = labelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [heightMap[size] / 2 - 9, -10],
  });
  const floatingLabelSize = labelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [textStyles.bodyMd.fontSize, textStyles.caption.fontSize],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Static Label (no floating) */}
      {label != null && (
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
            shadowOpacity: 0.3,
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon != null && (
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
            {
              color:     isDisabled ? colors.text.disabled : colors.text.primary,
              flex:      1,
              marginLeft: leftIcon != null ? spacing[2] : 0,
              marginRight: (rightIcon != null || isPassword) ? spacing[2] : 0,
            },
          ]}
          selectionColor={colors.primary.default}
          {...rest}
        />

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.iconRight}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
              {showPassword ? '🙈' : '👁'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {rightIcon != null && !isPassword && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </TouchableOpacity>

      {/* Error / Hint */}
      {(error != null || hint != null) && (
        <Text
          style={[
            textStyles.caption,
            styles.helperText,
            { color: error != null ? colors.error.text : colors.text.tertiary },
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
  label: {
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
  },
  input: {
    padding: 0, // Reset default padding
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  helperText: {
    marginTop: 2,
    marginLeft: 4,
  },
});

export { Input };