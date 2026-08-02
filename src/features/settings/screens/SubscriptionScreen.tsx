import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView }    from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

import { Card }            from '@components/common/Card';
import { Button }          from '@components/common/Button';
import { Badge }           from '@components/common/Badge';
import { Divider }         from '@components/common/Divider';
import {
  H2, H3, H4, H5, BodySm, BodyMd, Caption, Label,
} from '@components/common/Typography';
import useTheme            from '@hooks/useTheme';
import useAuth             from '@features/auth/hooks/useAuth';
import {
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from '@types/settings.types';
import type { SettingsScreenProps } from '@navigation/types';

const { width: W } = Dimensions.get('window');

type Props = SettingsScreenProps<'Subscription'>;

// ─── Billing Toggle ───────────────────────────────────────────────
type BillingCycle = 'monthly' | 'yearly';

const BillingToggle = ({
  billing,
  onChange,
}: {
  billing:  BillingCycle;
  onChange: (v: BillingCycle) => void;
}): React.JSX.Element => {
  const { colors, borderRadius, spacing } = useTheme();
  const translateX = useSharedValue(billing === 'monthly' ? 0 : 1);

  const handlePress = (v: BillingCycle): void => {
    translateX.value = withSpring(v === 'monthly' ? 0 : 1, {
      damping: 15, stiffness: 200,
    });
    onChange(v);
  };

  return (
    <View
      style={[
        styles.toggleContainer,
        {
          backgroundColor: colors.bg.elevated,
          borderRadius:    borderRadius.full,
          borderColor:     colors.border.default,
        },
      ]}
    >
      {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
        <TouchableOpacity
          key={cycle}
          onPress={() => handlePress(cycle)}
          style={[
            styles.toggleOption,
            {
              backgroundColor: billing === cycle ? colors.primary.default : 'transparent',
              borderRadius:    borderRadius.full,
            },
          ]}
        >
          <BodySm
            style={{
              color:      billing === cycle ? '#fff' : colors.text.secondary,
              fontWeight: billing === cycle ? '600' : '400',
            }}
          >
            {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            {cycle === 'yearly' && (
              <BodySm
                style={{
                  color:    billing === 'yearly' ? '#FFFFFF80' : colors.ai.default,
                  fontSize: 11,
                }}
              >
                {' '}Save 33%
              </BodySm>
            )}
          </BodySm>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Plan Card ────────────────────────────────────────────────────
interface PlanCardProps {
  tier:      SubscriptionTier;
  billing:   BillingCycle;
  isActive:  boolean;
  isCurrent: boolean;
  onSelect:  () => void;
}

const TIER_CONFIG = {
  free: {
    name:    'Free',
    icon:    '🎙',
    color:   '#3D4F73',
    tagline: 'Get started',
  },
  pro: {
    name:    'Pro',
    icon:    '⚡',
    color:   '#6366F1',
    tagline: 'For creators',
    popular: true,
  },
  enterprise: {
    name:    'Enterprise',
    icon:    '🏢',
    color:   '#4ECDC4',
    tagline: 'For teams',
  },
} as const;

const PlanCard = ({
  tier, billing, isActive, isCurrent, onSelect,
}: PlanCardProps): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const config  = TIER_CONFIG[tier];
  const price   = SUBSCRIPTION_PRICES[tier];
  const amount  = billing === 'monthly' ? price.monthly : price.yearly / 12;
  const isPopular = 'popular' in config && config.popular;

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 12 }, () => {
            scale.value = withSpring(1);
          });
          onSelect();
        }}
        activeOpacity={0.9}
        style={[
          styles.planCard,
          {
            backgroundColor: isActive
              ? `${config.color}15`
              : colors.card,
            borderColor:     isActive
              ? config.color
              : colors.border.default,
            borderWidth:     isActive ? 2 : 1,
          },
        ]}
      >
        {/* Popular badge */}
        {isPopular && (
          <View
            style={[
              styles.popularBadge,
              { backgroundColor: config.color },
            ]}
          >
            <Caption style={{ color: '#fff', fontSize: 9, letterSpacing: 1 }}>
              MOST POPULAR
            </Caption>
          </View>
        )}

        {/* Icon + Name */}
        <View style={styles.planHeader}>
          <Caption style={{ fontSize: 28 }}>{config.icon}</Caption>
          <View>
            <H5 style={{ color: config.color }}>{config.name}</H5>
            <Caption color="tertiary">{config.tagline}</Caption>
          </View>
          {isCurrent && (
            <Badge label="Current" variant="neutral" size="sm" />
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          {amount === 0 ? (
            <H2 color="primary">Free</H2>
          ) : (
            <>
              <Caption
                color="secondary"
                style={{ fontSize: 16, alignSelf: 'flex-start', marginTop: 6 }}
              >
                $
              </Caption>
              <H2 style={{ color: config.color }}>
                {amount.toFixed(2)}
              </H2>
              <Caption color="secondary" style={{ alignSelf: 'flex-end', marginBottom: 6 }}>
                /mo
              </Caption>
            </>
          )}
        </View>

        {billing === 'yearly' && amount > 0 && (
          <Caption color="tertiary">
            Billed ${price.yearly} annually
          </Caption>
        )}

        {/* Select */}
        <Button
          label={
            isCurrent  ? 'Current Plan' :
            tier === 'free' ? 'Downgrade' :
            'Select Plan'
          }
          onPress={onSelect}
          variant={isActive ? 'primary' : 'outline'}
          size="sm"
          fullWidth
          isDisabled={isCurrent}
          style={{ marginTop: spacing[3] }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Feature Row ──────────────────────────────────────────────────
const FeatureRow = ({
  label, free, pro, enterprise, isLast,
}: {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
  isLast?: boolean;
}): React.JSX.Element => {
  const { colors, spacing } = useTheme();

  const renderValue = (v: boolean | string): React.JSX.Element => {
    if (v === false) return <Caption style={{ color: colors.border.default }}>—</Caption>;
    if (v === true)  return <Caption style={{ color: colors.ai.default, fontSize: 16 }}>✓</Caption>;
    return <Caption color="secondary" style={{ fontSize: 11 }}>{v}</Caption>;
  };

  return (
    <View
      style={[
        styles.featureRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border.default },
      ]}
    >
      <Caption color="secondary" style={{ flex: 1.4 }}>{label}</Caption>
      <View style={styles.featureCell}>{renderValue(free)}</View>
      <View style={styles.featureCell}>{renderValue(pro)}</View>
      <View style={styles.featureCell}>{renderValue(enterprise)}</View>
    </View>
  );
};

// ─── Main Subscription Screen ─────────────────────────────────────
const SubscriptionScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors, spacing } = useTheme();
  const { user }            = useAuth();

  const [billing,  setBilling]  = useState<BillingCycle>('monthly');
  const [selected, setSelected] = useState<SubscriptionTier>('pro');

  const currentTier = (user?.role ?? 'free') as SubscriptionTier;

  const handleSelectPlan = (tier: SubscriptionTier): void => {
    if (tier === currentTier) return;
    setSelected(tier);
  };

  const handleSubscribe = (): void => {
    // Phase 11 mein — payment integration
    // For now, show coming soon
    // Alert.alert('Coming Soon', 'Payment integration coming in next update!');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.bg.primary }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: spacing[5] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Nav ─────────────────────────────────────────── */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.bg.elevated }]}
          >
            <Caption color="secondary">←</Caption>
          </TouchableOpacity>
          <H3 color="primary">Plans</H3>
          <View style={{ width: 40 }} />
        </View>

        {/* ─── Hero ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.hero}
        >
          <Caption style={{ fontSize: 40 }}>⚡</Caption>
          <H2 color="primary" align="center">
            Unlock your{'\n'}full potential
          </H2>
          <BodyMd color="secondary" align="center">
            AI-powered voice recording for creators, students, and professionals
          </BodyMd>
        </Animated.View>

        {/* ─── Billing Toggle ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{ alignItems: 'center', marginBottom: spacing[5] }}
        >
          <BillingToggle billing={billing} onChange={setBilling} />
        </Animated.View>

        {/* ─── Plan Cards ──────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.planCards}
        >
          {(['free', 'pro', 'enterprise'] as SubscriptionTier[]).map((tier) => (
            <PlanCard
              key={tier}
              tier={tier}
              billing={billing}
              isActive={selected === tier}
              isCurrent={currentTier === tier}
              onSelect={() => handleSelectPlan(tier)}
            />
          ))}
        </Animated.View>

        {/* ─── Subscribe CTA ───────────────────────────────── */}
        {selected !== currentTier && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ marginBottom: spacing[5] }}
          >
            <Button
              label={
                selected === 'free'
                  ? 'Downgrade to Free'
                  : `Subscribe to ${TIER_CONFIG[selected].name} — $${
                      billing === 'monthly'
                        ? SUBSCRIPTION_PRICES[selected].monthly
                        : (SUBSCRIPTION_PRICES[selected].yearly / 12).toFixed(2)
                    }/mo`
              }
              onPress={handleSubscribe}
              variant={selected === 'free' ? 'outline' : 'primary'}
              size="lg"
              fullWidth
            />
            <Caption color="tertiary" align="center" style={{ marginTop: spacing[2] }}>
              Cancel anytime · Secure payment via Stripe
            </Caption>
          </Animated.View>
        )}

        {/* ─── Feature Comparison ──────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ marginBottom: spacing[6] }}
        >
          <H5 color="primary" style={{ marginBottom: spacing[3] }}>
            Compare Plans
          </H5>

          <Card variant="filled" padding={0}>
            {/* Header */}
            <View
              style={[
                styles.tableHeader,
                { borderBottomColor: colors.border.default },
              ]}
            >
              <Caption color="tertiary" style={{ flex: 1.4 }}>Feature</Caption>
              {(['free', 'pro', 'enterprise'] as SubscriptionTier[]).map((t) => (
                <View key={t} style={styles.featureCell}>
                  <Caption
                    style={{
                      color: TIER_CONFIG[t].color,
                      fontWeight: '600',
                    }}
                  >
                    {TIER_CONFIG[t].icon} {TIER_CONFIG[t].name}
                  </Caption>
                </View>
              ))}
            </View>

            {/* Rows */}
            {SUBSCRIPTION_FEATURES.map((feature, i) => (
              <FeatureRow
                key={feature.label}
                label={feature.label}
                free={feature.free}
                pro={feature.pro}
                enterprise={feature.enterprise}
                isLast={i === SUBSCRIPTION_FEATURES.length - 1}
              />
            ))}
          </Card>
        </Animated.View>

        {/* ─── FAQ ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={{ marginBottom: spacing[8] }}
        >
          <H5 color="primary" style={{ marginBottom: spacing[3] }}>
            Frequently Asked Questions
          </H5>

          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes, cancel anytime from settings. No hidden fees.',
            },
            {
              q: 'What happens to my data if I downgrade?',
              a: 'Your recordings stay, but new uploads pause until storage is within the free limit.',
            },
            {
              q: 'Is there a free trial?',
              a: 'We offer a 7-day free trial for Pro. No credit card required.',
            },
          ].map(({ q, a }, i) => (
            <Card
              key={i}
              variant="outlined"
              style={{ marginBottom: spacing[2] }}
            >
              <View style={{ gap: spacing[1] }}>
                <BodySm color="primary" style={{ fontWeight: '600' }}>{q}</BodySm>
                <Caption color="secondary">{a}</Caption>
              </View>
            </Card>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 } as ViewStyle,
  scroll: { flexGrow: 1 } as ViewStyle,
  navRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom:   8,
  } as ViewStyle,
  backBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
  hero: {
    alignItems:   'center',
    gap:          10,
    marginBottom: 28,
    paddingTop:   8,
  } as ViewStyle,
  toggleContainer: {
    flexDirection: 'row',
    padding:       4,
    borderWidth:   1,
  } as ViewStyle,
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical:   8,
  } as ViewStyle,
  planCards: {
    gap: 12,
    marginBottom: 20,
  } as ViewStyle,
  planCard: {
    padding:      18,
    borderRadius: 18,
    gap:          6,
    position:     'relative',
    overflow:     'hidden',
  } as ViewStyle,
  popularBadge: {
    position:       'absolute',
    top:            12,
    right:          12,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:   20,
  } as ViewStyle,
  planHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  4,
  } as ViewStyle,
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           2,
  } as ViewStyle,
  tableHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  featureRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   12,
    paddingHorizontal: 16,
    minHeight:         44,
  } as ViewStyle,
  featureCell: {
    width:          64,
    alignItems:     'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export { SubscriptionScreen };