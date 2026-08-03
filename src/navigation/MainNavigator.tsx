import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, componentSize, spacing, borderRadius } from '@theme/index';
import type {
  MainTabParamList,
  HomeStackParamList,
  RecordingsStackParamList,
  SettingsStackParamList,
  SearchStackParamList,
  RecordStackParamList,
} from './types';

import { PlaceholderScreen }       from './PlaceholderScreen';
import { HomeScreen }              from '@features/recording/screens/HomeScreen';
import { RecordingsScreen }        from '@features/recording/screens/RecordingsScreen';
import { RecordingDetailScreen }   from '@features/recording/screens/RecordingDetailScreen';
import { RecordScreen }            from '@features/recording/screens/RecordScreen';
import { SearchScreen }            from '@features/recording/screens/SearchScreen';
import { SettingsScreen }          from '@features/settings/screens/SettingsScreen';
import { ProfileScreen }           from '@features/settings/screens/ProfileScreen';
import SubscriptionScreen          from '@features/subscription/screens/SubscriptionScreen';
import { PlayerScreen }            from '@features/player/screens/PlayerScreen';
import { MiniPlayer }              from '@features/player/components/MiniPlayer';

// ─── Stack Navigators ─────────────────────────────────────────────
const HomeStack       = createNativeStackNavigator<HomeStackParamList>();
const RecordingsStack = createNativeStackNavigator<RecordingsStackParamList>();
const RecordStack     = createNativeStackNavigator<RecordStackParamList>();
const SearchStack     = createNativeStackNavigator<SearchStackParamList>();
const SettingsStack   = createNativeStackNavigator<SettingsStackParamList>();

const stackScreenOptions = {
  headerShown:  false,
  animation:    'slide_from_right' as const,
  contentStyle: { backgroundColor: colors.bg.primary },
};

const HomeStackScreen = (): React.JSX.Element => (
  <HomeStack.Navigator screenOptions={stackScreenOptions}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="Subscription" component={SubscriptionScreen} />
  </HomeStack.Navigator>
);

const RecordingsStackScreen = (): React.JSX.Element => (
  <RecordingsStack.Navigator screenOptions={stackScreenOptions}>
    <RecordingsStack.Screen
      name="Recordings"
      component={RecordingsScreen}
      initialParams={{ folderId: undefined, folderName: undefined }}
    />
    <RecordingsStack.Screen name="RecordingDetail" component={RecordingDetailScreen} />
    <RecordingsStack.Screen name="FolderView"      component={PlaceholderScreen} />
    <RecordingsStack.Screen
      name="Player"
      component={PlayerScreen}
      options={{ presentation: 'modal' }}
    />
  </RecordingsStack.Navigator>
);

const RecordStackScreen = (): React.JSX.Element => (
  <RecordStack.Navigator screenOptions={stackScreenOptions}>
    <RecordStack.Screen name="Record" component={RecordScreen} />
  </RecordStack.Navigator>
);

const SearchStackScreen = (): React.JSX.Element => (
  <SearchStack.Navigator screenOptions={stackScreenOptions}>
    <SearchStack.Screen name="Search" component={SearchScreen} />
  </SearchStack.Navigator>
);

const SettingsStackScreen = (): React.JSX.Element => (
  <SettingsStack.Navigator screenOptions={stackScreenOptions}>
    <SettingsStack.Screen name="Settings"          component={SettingsScreen} />
    <SettingsStack.Screen name="Profile"           component={ProfileScreen} />
    <SettingsStack.Screen name="Subscription"      component={SubscriptionScreen} />
    <SettingsStack.Screen name="AppSettings"       component={PlaceholderScreen} />
    <SettingsStack.Screen name="NotificationPrefs" component={PlaceholderScreen} />
    <SettingsStack.Screen name="StorageManager"    component={PlaceholderScreen} />
    <SettingsStack.Screen name="About"             component={PlaceholderScreen} />
  </SettingsStack.Navigator>
);

// ─── Custom Tab Bar ────────────────────────────────────────────────
interface TabIconProps {
  name:     string;
  focused:  boolean;
  isRecord: boolean;
}

const TabIcon = ({ name, focused, isRecord }: TabIconProps): React.JSX.Element => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withSpring(1.1, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
    }
  }, [focused, scale]);

  if (isRecord) {
    return (
      <Animated.View style={[styles.recordBtn, animatedStyle]}>
        <View style={styles.recordBtnInner} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
        <View
          style={[
            styles.tabIconDot,
            { backgroundColor: focused ? colors.primary.default : 'transparent' },
          ]}
        />
      </View>
    </Animated.View>
  );
};

interface CustomTabBarProps {
  state:       { index: number; routes: Array<{ name: string; key: string }> };
  descriptors: Record<string, { options: { tabBarLabel?: string } }>;
  navigation:  {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const CustomTabBar = ({ state, descriptors, navigation }: CustomTabBarProps): React.JSX.Element => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const isRecord  = route.name === 'RecordTab';

        const onPress = (): void => {
          const event = navigation.emit({
            type:              'tabPress',
            target:            route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, isRecord && styles.tabItemRecord]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            activeOpacity={0.7}
          >
            <TabIcon name={route.name} focused={isFocused} isRecord={isRecord} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Tab Navigator ────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = (): React.JSX.Element => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        tabBar={(props) => <CustomTabBar {...(props as unknown as CustomTabBarProps)} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="HomeTab"       component={HomeStackScreen}       />
        <Tab.Screen name="RecordingsTab" component={RecordingsStackScreen} />
        <Tab.Screen name="RecordTab"     component={RecordStackScreen}     />
        <Tab.Screen name="SearchTab"     component={SearchStackScreen}     />
        <Tab.Screen name="SettingsTab"   component={SettingsStackScreen}   />
      </Tab.Navigator>
      <MiniPlayer onExpand={() => { /* navigation handled inside MiniPlayer via usePlayer */ }} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection:   'row',
    backgroundColor: colors.tab.bg,
    borderTopWidth:  1,
    borderTopColor:  colors.tab.border,
    paddingBottom:   Platform.OS === 'ios' ? spacing[6] : spacing[3],
    paddingTop:      spacing[2],
    height:          componentSize.tabBar,
  } as ViewStyle,

  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     spacing[1],
  } as ViewStyle,

  tabItemRecord: {
    marginTop: -spacing[8],
  } as ViewStyle,

  tabIconWrapper: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   borderRadius.md,
  } as ViewStyle,

  tabIconActive: {
    backgroundColor: colors.primary.muted,
  } as ViewStyle,

  tabIconDot: {
    width:        6,
    height:       6,
    borderRadius: borderRadius.full,
  } as ViewStyle,

  recordBtn: {
    width:           componentSize.recordBtnMd,
    height:          componentSize.recordBtnMd,
    borderRadius:    componentSize.recordBtnMd / 2,
    backgroundColor: colors.recording.default,
    alignItems:      'center',
    justifyContent:  'center',
    ...Platform.select({
      ios: {
        shadowColor:   colors.recording.default,
        shadowOffset:  { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius:  20,
      },
      android: { elevation: 8 },
    }),
  } as ViewStyle,

  recordBtnInner: {
    width:           28,
    height:          28,
    borderRadius:    borderRadius.sm,
    backgroundColor: colors.bg.primary,
    opacity:         0.9,
  } as ViewStyle,
});

export { MainNavigator };
