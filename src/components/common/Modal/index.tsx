import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import useTheme from '@hooks/useTheme';
import { Typography } from '@components/common/Typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  isVisible:     boolean;
  onClose:       () => void;
  title?:        string;
  children:      React.ReactNode;
  showHandle?:   boolean;
  closeOnOverlay?: boolean;
  style?:        ViewStyle;
  maxHeight?:    number;
}

const AppModal = ({
  isVisible,
  onClose,
  title,
  children,
  showHandle     = true,
  closeOnOverlay = true,
  style,
  maxHeight      = SCREEN_HEIGHT * 0.9,
}: ModalProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity    = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isVisible) {
      opacity.value    = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping:   22,
        stiffness: 260,
        mass:      0.8,
      });
    } else {
      opacity.value    = withTiming(0, { duration: 180 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
    }
  }, [isVisible, opacity, translateY]);

  if (!isVisible) return <></>;

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
        <TouchableOpacity
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.bg.overlay },
          ]}
          onPress={closeOnOverlay ? onClose : undefined}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.bg.modal,
            borderTopLeftRadius:  borderRadius['3xl'],
            borderTopRightRadius: borderRadius['3xl'],
            maxHeight,
            paddingBottom: spacing[8],
          },
          sheetStyle,
          style,
        ]}
      >
        {/* Handle */}
        {showHandle && (
          <View style={styles.handleWrapper}>
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.border.default },
              ]}
            />
          </View>
        )}

        {/* Title */}
        {title != null && (
          <View style={[styles.titleWrapper, { paddingHorizontal: spacing[5] }]}>
            <Typography variant="h4" color="primary">
              {title}
            </Typography>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Typography variant="bodyLg" color="secondary">✕</Typography>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={{ paddingHorizontal: spacing[5] }}>
          {children}
        </View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
  } as ViewStyle,
  handleWrapper: {
    alignItems:     'center',
    paddingVertical: 12,
  } as ViewStyle,
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
  } as ViewStyle,
  titleWrapper: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   16,
  } as ViewStyle,
});

export { AppModal };