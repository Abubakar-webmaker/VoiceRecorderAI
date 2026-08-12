import React, {
  useCallback, useRef, useEffect, useState,
} from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BodySm, Caption } from '@components/common/Typography';
import { Loader }           from '@components/common/Loader';
import useTheme             from '@hooks/useTheme';
import type { ChatMessage } from '@types/ai.types';

interface AIChatViewProps {
  messages:    ChatMessage[];
  isLoading:   boolean;
  onSend:      (message: string) => void;
  placeholder?: string;
}

// ─── Message Bubble ───────────────────────────────────────────────
interface BubbleProps {
  message: ChatMessage;
}

const MessageBubble = ({ message }: BubbleProps): React.JSX.Element => {
  const { colors, borderRadius } = useTheme();
  const isUser = message.role === 'user';

  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={[
        styles.bubbleWrapper,
        isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAI,
      ]}
    >
      {!isUser && (
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.ai.surface },
          ]}
        >
          <Caption style={styles.avatarEmoji}>🤖</Caption>
        </View>
      )}

      <View style={styles.bubbleMaxWidth}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser
                ? colors.primary.default
                : colors.bg.elevated,
              borderRadius: borderRadius.xl,
              borderBottomRightRadius: isUser ? 4 : borderRadius.xl,
              borderBottomLeftRadius: isUser ? borderRadius.xl : 4,
            },
          ]}
        >
          <BodySm
            style={[
              styles.bubbleText,
              { color: isUser ? colors.text.inverse : colors.text.primary },
            ]}
          >
            {message.content}
          </BodySm>
        </View>

        <Caption
          style={[
            styles.bubbleTime,
            { color: colors.text.tertiary, textAlign: isUser ? 'right' : 'left' },
          ]}
        >
          {time}
        </Caption>
      </View>
    </Animated.View>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────
const TypingIndicator = (): React.JSX.Element => {
  const { colors } = useTheme();
  return (
    <View style={[styles.bubbleWrapper, styles.bubbleWrapperAI]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.ai.surface },
        ]}
      >
        <Caption style={styles.avatarEmoji}>🤖</Caption>
      </View>
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          { backgroundColor: colors.bg.elevated },
        ]}
      >
        <Loader size="sm" variant="ai" color={colors.ai.default} />
      </View>
    </View>
  );
};

// ─── Suggested Questions ──────────────────────────────────────────
const SUGGESTIONS = [
  'What were the main topics?',
  'List the action items',
  'Summarize key decisions',
  'Who was mentioned?',
  'What was the conclusion?',
];

// ─── Main Chat View ───────────────────────────────────────────────
const AIChatView = ({
  messages,
  isLoading,
  onSend,
  placeholder = 'Ask about this recording...',
}: AIChatViewProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const displayMessages = messages.filter((m) => m.role !== 'system');

  // Auto-scroll to bottom
  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [displayMessages.length, isLoading]);

  const handleSend = useCallback((): void => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    onSend(text);
  }, [inputText, isLoading, onSend]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble message={item} />
    ),
    [],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80}
    >
      {/* ─── Messages ──────────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={displayMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.messageList,
          { paddingHorizontal: spacing[4], paddingTop: spacing[3] },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyChat, { paddingHorizontal: spacing[4] }]}>
            <Caption style={styles.emptyEmoji}>🤖</Caption>
            <BodySm color="secondary" align="center">
              Ask me anything about this recording — I know the full transcript!
            </BodySm>

            {/* Suggestions */}
            <View style={[styles.suggestions, { marginTop: spacing[4] }]}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => onSend(s)}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: colors.primary.surface,
                      borderColor:     `${colors.primary.default}30`,
                    },
                  ]}
                >
                  <Caption style={{ color: colors.primary.light }}>{s}</Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* ─── Input Bar ─────────────────────────────────────── */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.bg.secondary,
            borderTopColor:  colors.border.default,
            paddingBottom:   Platform.OS === 'ios' ? spacing[2] : spacing[3],
          },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.bg.input,
              borderColor:     colors.border.default,
              borderRadius:    borderRadius.xl,
            },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            style={[styles.textInput, { color: colors.text.primary }]}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                inputText.trim() && !isLoading
                  ? colors.primary.default
                  : colors.bg.elevated,
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Caption style={[styles.sendIcon, { color: colors.text.inverse }]}>↑</Caption>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarEmoji: {
    fontSize: 14,
  },
  bubble: {
    padding: 12,
  } as ViewStyle,
  bubbleMaxWidth: {
    maxWidth: '78%',
  } as ViewStyle,
  bubbleText: {
    lineHeight: 20,
  },
  bubbleTime: {
    marginTop: 4,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           8,
  } as ViewStyle,
  bubbleWrapperAI: {
    justifyContent: 'flex-start',
  } as ViewStyle,
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  emptyChat: {
    flex:           1,
    alignItems:     'center',
    paddingTop:     32,
  } as ViewStyle,
  emptyEmoji: {
    fontSize:     32,
    marginBottom: 12,
  },
  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    gap:             8,
    paddingHorizontal: 16,
    paddingTop:      12,
    borderTopWidth:  1,
  } as ViewStyle,
  inputWrapper: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth:     1,
    minHeight:       44,
  } as ViewStyle,
  messageList: {
    paddingBottom: 16,
    gap:           12,
  } as ViewStyle,
  sendBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendIcon: {
    fontSize: 16,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
    borderWidth:       1,
  } as ViewStyle,
  suggestions: {
    flexWrap:       'wrap',
    flexDirection:  'row',
    gap:            8,
    justifyContent: 'center',
  } as ViewStyle,
  textInput: {
    flex:      1,
    fontSize:  15,
    maxHeight: 100,
    padding:   0,
  },
  typingBubble: {
    minWidth: 60,
  } as ViewStyle,
});

export { AIChatView };