import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage     from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { RecordingCard }   from '@components/recording/RecordingCard';
import {
  H5, BodySm, Caption,
} from '@components/common/Typography';
import { Badge }           from '@components/common/Badge';
import { EmptyState }      from '@components/common/EmptyState';
import { Loader }          from '@components/common/Loader';
import useTheme            from '@hooks/useTheme';
import useRecordings       from '../hooks/useRecordings';
import usePlayer           from '@features/player/hooks/usePlayer';
import type { SearchStackParamList } from '@navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const RECENT_SEARCHES_KEY = '@AIVoiceRecorder:recentSearches';
const MAX_RECENT          = 8;

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const SearchScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const {
    searchResults, isSearching,
    search, setQuery,
    toggleFavorite, deleteRecording,
  } = useRecordings();
  const { play } = usePlayer();

  const inputRef = useRef<TextInput>(null);
  const [localQuery, setLocalQuery]       = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused]         = useState(false);

  // Load recent searches
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => {
        if (raw) setRecentSearches(JSON.parse(raw) as string[]);
      })
      .catch(() => {});

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Debounce search
  useEffect(() => {
    if (!localQuery.trim()) {
      setQuery('');
      return;
    }

    const timer = setTimeout(() => {
      setQuery(localQuery);
      void search(localQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [localQuery, search, setQuery]);

  // Save recent search
  const saveRecentSearch = useCallback(async (q: string): Promise<void> => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  const handleSearch = useCallback((q: string): void => {
    if (!q.trim()) return;
    setLocalQuery(q);
    void saveRecentSearch(q);
  }, [saveRecentSearch]);

  const handleClearRecent = useCallback(async (): Promise<void> => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const clearQuery = useCallback((): void => {
    setLocalQuery('');
    setQuery('');
    inputRef.current?.clear();
  }, [setQuery]);

  const renderItem = useCallback(({ item }: { item: typeof searchResults[0] }) => (
    <RecordingCard
      recording={item}
      onPress={() =>
        (navigation as any).navigate('RecordingsTab', {
          screen: 'RecordingDetail',
          params: { recordingId: item._id }
        })
      }
      onPlay={() => { void play(item); }}
      onFavorite={() => { void toggleFavorite(item._id); }}
      onDelete={() => { void deleteRecording(item._id); }}
    />
  ), [navigation, play, toggleFavorite, deleteRecording]);

  const hasQuery   = localQuery.trim().length > 0;
  const hasResults = searchResults.length > 0;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top']}
    >
      {/* ─── Search Bar ──────────────────────────────────────── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.searchHeader, { paddingHorizontal: spacing[5] }]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.bg.input,
              borderColor:     isFocused
                ? colors.border.focus
                : colors.border.default,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <Caption color="tertiary" style={styles.searchIcon}><Text>🔍</Text></Caption>

          <TextInput
            ref={inputRef}
            value={localQuery}
            onChangeText={setLocalQuery}
            onSubmitEditing={() => handleSearch(localQuery)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search recordings, transcripts, tags..."
            placeholderTextColor={colors.text.tertiary}
            style={[styles.searchInput, { color: colors.text.primary }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {localQuery.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Caption color="secondary"><Text>✕</Text></Caption>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ─── Content ─────────────────────────────────────────── */}
      {!hasQuery ? (
        // ─── No Query — Show Recents ────────────────────────
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.contentContainer}
        >
          {recentSearches.length > 0 ? (
            <>
              <View style={[styles.sectionHeader, { marginVertical: spacing[3] }]}>
                <H5 color="secondary"><Text>Recent Searches</Text></H5>
                <TouchableOpacity onPress={() => { void handleClearRecent(); }}>
                  <Caption color="link"><Text>Clear</Text></Caption>
                </TouchableOpacity>
              </View>

              {recentSearches.map((term) => (
                <TouchableOpacity
                  key={term}
                  onPress={() => handleSearch(term)}
                  style={[
                    styles.recentItem,
                    { borderBottomColor: colors.border.default },
                  ]}
                >
                  <Caption color="tertiary" style={styles.recentIcon}><Text>🕐</Text></Caption>
                  <BodySm color="primary" style={styles.flex1}><Text>{term}</Text></BodySm>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = recentSearches.filter((r) => r !== term);
                      setRecentSearches(updated);
                      void AsyncStorage.setItem(
                        RECENT_SEARCHES_KEY,
                        JSON.stringify(updated),
                      );
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Caption color="tertiary"><Text>✕</Text></Caption>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <EmptyState
              icon="🔍"
              title="Search your recordings"
              description="Find recordings by title, AI transcript content, or tags"
            />
          )}
        </Animated.View>
      ) : isSearching ? (
        // ─── Searching ──────────────────────────────────────
        <View style={styles.center}>
          <Loader variant="ai" label={`Searching "${localQuery}"...`} />
        </View>
      ) : !hasResults ? (
        // ─── No Results ─────────────────────────────────────
        <EmptyState
          icon="🔭"
          title="No results found"
          description={`No recordings match "${localQuery}"\n\nTry a different term or check your spelling`}
          actionLabel="Clear Search"
          onAction={clearQuery}
        />
      ) : (
        // ─── Results ────────────────────────────────────────
        <>
          {/* Result count */}
          <View style={[styles.resultsHeader, { paddingHorizontal: spacing[5] }]}>
            <Caption color="secondary">
              <Text>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for</Text>
            </Caption>
            <Badge label={`"${localQuery}"`} variant="primary" size="sm" />
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.list,
              { paddingHorizontal: spacing[5] },
            ]}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  contentContainer: {
    flex: 1,
  } as ViewStyle,
  flex1: {
    flex: 1
  },
  list: {
    paddingTop:    8,
    paddingBottom: 100,
  } as ViewStyle,
  recentIcon: {
    fontSize: 14
  },
  recentItem: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap:             10,
  } as ViewStyle,
  resultsHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingVertical: 8,
  } as ViewStyle,
  screen:  { flex: 1 } as ViewStyle,
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    height:          48,
    paddingHorizontal: 14,
    borderWidth:     1.5,
  } as ViewStyle,
  searchHeader: {
    paddingVertical: 12,
  } as ViewStyle,
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex:     1,
    fontSize: 15,
    padding:  0,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  } as ViewStyle,
});

export { SearchScreen };