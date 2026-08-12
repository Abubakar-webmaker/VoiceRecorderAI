import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  BodySm, Caption, Label, MonoText,
} from '@components/common/Typography';
import { Badge }  from '@components/common/Badge';
import { Card }   from '@components/common/Card';
import useTheme   from '@hooks/useTheme';
import type { TranscriptSegment } from '@types/ai.types';

interface TranscriptionViewProps {
  fullText:    string;
  segments:    TranscriptSegment[];
  language:    string;
  languageName: string;
  confidence:  number;
  wordCount:   number;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TranscriptionView = ({
  fullText,
  segments,
  language,
  languageName,
  confidence,
  wordCount,
}: TranscriptionViewProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const [showSegments, setShowSegments]   = useState(false);
  const [copied, setCopied]               = useState(false);

  const handleCopy = useCallback((): void => {
    Clipboard.setString(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullText]);

  return (
    <View style={{ gap: spacing[4] }}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <Badge label={languageName} variant="primary" size="sm" />
        <Caption color="tertiary">
          {wordCount} words · {Math.round(confidence * 100)}% confidence
        </Caption>
      </View>

      {/* Transcript text */}
      <Card variant="filled">
        <View style={{ gap: spacing[3] }}>
          {/* Actions */}
          <View style={styles.actionRow}>
            <Label color="secondary">Transcript</Label>
            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.copyBtn,
                { backgroundColor: colors.bg.elevated },
              ]}
            >
              <Caption color={copied ? 'link' : 'secondary'}>
                {copied ? '✓ Copied' : '⎘ Copy'}
              </Caption>
            </TouchableOpacity>
          </View>

          {/* Full text */}
          <BodySm
            color="primary"
            style={{ lineHeight: 22 }}
          >
            {fullText}
          </BodySm>
        </View>
      </Card>

      {/* Segment toggle */}
      {segments.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setShowSegments((v) => !v)}
            style={[
              styles.segmentToggle,
              { borderColor: colors.border.default },
            ]}
          >
            <Caption color="secondary">
              {showSegments ? '▲' : '▼'} {showSegments ? 'Hide' : 'Show'} Segments
              ({segments.length})
            </Caption>
          </TouchableOpacity>

          {showSegments && (
            <View style={{ gap: spacing[2] }}>
              {segments.map((seg) => (
                <Animated.View
                  key={seg.id}
                  entering={FadeInDown.duration(200)}
                >
                  <Card variant="outlined" padding={12}>
                    <View style={styles.segmentHeader}>
                      <MonoText
                        style={{
                          color:    colors.primary.light,
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </MonoText>
                      <Caption
                        style={{
                          color:    colors.ai.default,
                          fontSize: 10,
                        }}
                      >
                        {Math.round(seg.confidence * 100)}%
                      </Caption>
                    </View>
                    <BodySm color="primary" style={{ marginTop: 4, lineHeight: 20 }}>
                      {seg.text}
                    </BodySm>
                  </Card>
                </Animated.View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      8,
  } as ViewStyle,
  segmentHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  segmentToggle: {
    alignItems:      'center',
    paddingVertical: 10,
    borderWidth:     1,
    borderRadius:    10,
    borderStyle:     'dashed',
  } as ViewStyle,
  statsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as ViewStyle,
});

export { TranscriptionView };