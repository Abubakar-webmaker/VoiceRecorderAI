import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  View, ScrollView, TouchableOpacity,
  TextInput, FlatList, StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecordingCard }  from '@components/recording/RecordingCard';
import {
  H3, BodySm, Caption,
} from '@components/common/Typography';
import { EmptyState }     from '@components/common/EmptyState';
import { Loader }         from '@components/common/Loader';
import { AppModal }       from '@components/common/Modal';
import useTheme           from '@hooks/useTheme';
import useRecordings      from '../hooks/useRecordings';
import usePlayer          from '@features/player/hooks/usePlayer';
import type { RecordingsScreenProps } from '@navigation/types';
import type { FilterTab }             from '@types/recording.types';

type Props = RecordingsScreenProps<'Recordings'>;

const FILTER_TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: 'all',       label: 'All',       icon: '🎙' },
  { id: 'favorites', label: 'Favorites', icon: '💛' },
  { id: 'pinned',    label: 'Pinned',    icon: '📌' },
  { id: 'recent',    label: 'Recent',    icon: '🕐' },
];

const SORT_OPTIONS: {
  sortBy:    'createdAt' | 'title' | 'duration' | 'fileSize';
  sortOrder: 'asc' | 'desc';
  label:     string;
}[] = [
  { sortBy: 'createdAt', sortOrder: 'desc', label: 'Newest first'  },
  { sortBy: 'createdAt', sortOrder: 'asc',  label: 'Oldest first'  },
  { sortBy: 'title',     sortOrder: 'asc',  label: 'A → Z'         },
  { sortBy: 'title',     sortOrder: 'desc', label: 'Z → A'         },
  { sortBy: 'duration',  sortOrder: 'desc', label: 'Longest first' },
  { sortBy: 'fileSize',  sortOrder: 'desc', label: 'Largest first' },
];

const RecordingsScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const {
    recordings, isLoading, isLoadingMore, pagination,
    searchResults, searchQuery,
    activeFilter, sortConfig, isSelecting, selectedIds,
    fetchRecordings, fetchMore, search,
    setQuery, toggleFavorite, deleteRecording,
    changeFilter, changeSort, startSelecting,
    toggleSelect, clearSelections, bulkDelete,
  } = useRecordings();
  const { play } = usePlayer();

  const [showSort, setShowSort] = useState(false);
  const searchRef = useRef<TextInput>(null);

  // Displayed list
  const displayList = searchQuery.length > 0 ? searchResults : recordings;
  const isShowingSearch = searchQuery.length > 0;

  // Initial fetch
  useEffect(() => {
    void fetchRecordings({
      sortBy:    sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      limit:     20,
    });
  }, [activeFilter, sortConfig.sortBy, sortConfig.sortOrder, fetchRecordings]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery) return;
    const timer = setTimeout(() => {
      void search(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  // Load more
  const handleEndReached = useCallback((): void => {
    if (!isLoadingMore && pagination?.hasNextPage) {
      void fetchMore({
        page:      (pagination.currentPage ?? 1) + 1,
        limit:     20,
        sortBy:    sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      });
    }
  }, [fetchMore, isLoadingMore, pagination, sortConfig]);

  // ─── Render Item ────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: typeof recordings[0] }) => (
    <RecordingCard
      recording={item}
      onPress={() =>
        navigation.navigate('RecordingDetail', { recordingId: item._id })
      }
      onPlay={() => play(item)}
      onFavorite={() => toggleFavorite(item._id)}
      onDelete={() => deleteRecording(item._id)}
      isSelected={selectedIds.includes(item._id)}
      onSelect={() => toggleSelect(item._id)}
      isSelecting={isSelecting}
    />
  ), [
    navigation, play, toggleFavorite, deleteRecording,
    selectedIds, toggleSelect, isSelecting,
  ]);

  const keyExtractor = useCallback(
    (item: typeof recordings[0]) => item._id,
    [],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top']}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingHorizontal: spacing[5] }]}>
        <H3 color="primary">Recordings</H3>

        <View style={styles.headerActions}>
          {isSelecting ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  void bulkDelete(selectedIds);
                }}
                style={[
                  styles.headerBtn,
                  { backgroundColor: colors.error.surface },
                ]}
              >
                <Caption style={{ color: colors.error.text }}>
                  <Text>Delete ({selectedIds.length})</Text>
                </Caption>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearSelections}
                style={[
                  styles.headerBtn,
                  { backgroundColor: colors.bg.elevated },
                ]}
              >
                <Caption color="secondary"><Text>Cancel</Text></Caption>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowSort(true)}
                style={[styles.headerBtn, { backgroundColor: colors.bg.elevated }]}
              >
                <Caption color="secondary"><Text>⇅ Sort</Text></Caption>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startSelecting}
                style={[styles.headerBtn, { backgroundColor: colors.bg.elevated }]}
              >
                <Caption color="secondary"><Text>Select</Text></Caption>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ─── Search Bar ──────────────────────────────────────── */}
      <View
        style={[
          styles.searchBar,
          {
            marginHorizontal: spacing[5],
            backgroundColor:  colors.bg.input,
            borderColor:      colors.border.default,
          },
        ]}
      >
        <Caption color="tertiary" style={styles.searchIcon}><Text>🔍</Text></Caption>
        <TextInput
          ref={searchRef}
          value={searchQuery}
          onChangeText={setQuery}
          placeholder="Search recordings..."
          placeholderTextColor={colors.text.tertiary}
          style={[styles.searchInput, { color: colors.text.primary }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Caption color="secondary"><Text>✕</Text></Caption>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Filter Tabs ─────────────────────────────────────── */}
      {!isShowingSearch && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsContainer}
          contentContainerStyle={[
            styles.filterTabs,
            { paddingHorizontal: spacing[5] },
          ]}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => changeFilter(tab.id)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: activeFilter === tab.id
                    ? colors.primary.muted
                    : colors.bg.elevated,
                  borderColor: activeFilter === tab.id
                    ? `${colors.primary.default}40`
                    : colors.border.default,
                },
              ]}
            >
              <Caption
                style={{
                  color: activeFilter === tab.id
                    ? colors.primary.light
                    : colors.text.secondary,
                }}
              >
                <Text>{tab.icon} {tab.label}</Text>
              </Caption>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── List ────────────────────────────────────────────── */}
      {isLoading && displayList.length === 0 ? (
        <View style={styles.center}>
          <Loader variant="ai" label="Loading recordings..." />
        </View>
      ) : displayList.length === 0 ? (
        <EmptyState
          icon="🎙️"
          title={
            isShowingSearch
              ? 'No results found'
              : activeFilter === 'favorites'
              ? 'No favorites yet'
              : 'No recordings yet'
          }
          description={
            isShowingSearch
              ? `No recordings match "${searchQuery}"`
              : activeFilter === 'favorites'
              ? 'Tap the heart icon on any recording to save it here'
              : 'Tap the mic to make your first recording'
          }
          actionLabel={isShowingSearch ? undefined : 'Start Recording'}
          onAction={
            isShowingSearch
              ? undefined
              : () => navigation.getParent()?.navigate('RecordTab' as never)
          }
        />
      ) : (
        <FlatList
          data={displayList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            { paddingHorizontal: spacing[5] },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <Loader size="sm" />
              </View>
            ) : null
          }
        />
      )}

      {/* ─── Sort Modal ──────────────────────────────────────── */}
      <AppModal
        isVisible={showSort}
        onClose={() => setShowSort(false)}
        title="Sort by"
      >
        <View style={{ gap: spacing[2], paddingBottom: spacing[4] }}>
          {SORT_OPTIONS.map((opt) => {
            const isActive =
              sortConfig.sortBy === opt.sortBy &&
              sortConfig.sortOrder === opt.sortOrder;

            return (
              <TouchableOpacity
                key={`${opt.sortBy}-${opt.sortOrder}`}
                onPress={() => {
                  changeSort({ sortBy: opt.sortBy, sortOrder: opt.sortOrder });
                  setShowSort(false);
                }}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: isActive
                      ? colors.primary.muted
                      : colors.bg.elevated,
                    borderColor: isActive
                      ? `${colors.primary.default}40`
                      : colors.border.default,
                  },
                ]}
              >
                <BodySm
                  style={{
                    color: isActive
                      ? colors.primary.light
                      : colors.text.primary,
                  }}
                >
                  {opt.label}
                </BodySm>
                {isActive && (
                  <Caption style={{ color: colors.primary.default }}>
                    <Text>✓</Text>
                  </Caption>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      20,
    borderWidth:       1,
  } as ViewStyle,
  filterTabs: {
    flexDirection:  'row',
    gap:            8,
    paddingBottom:  12,
  } as ViewStyle,
  filterTabsContainer: {
    maxHeight: 48,
  },
  footerLoader: {
    padding: 16,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  } as ViewStyle,
  headerActions: {
    flexDirection: 'row',
    gap:           8,
  } as ViewStyle,
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      10,
  } as ViewStyle,
  list: {
    paddingTop:    8,
    paddingBottom: 100,
  } as ViewStyle,
  screen:     { flex: 1 } as ViewStyle,
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    height:          44,
    borderRadius:    12,
    borderWidth:     1,
    paddingHorizontal: 12,
    marginBottom:    12,
  } as ViewStyle,
  searchIcon: {
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  sortOption: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         14,
    borderRadius:    12,
    borderWidth:     1,
  } as ViewStyle,
});

export { RecordingsScreen };