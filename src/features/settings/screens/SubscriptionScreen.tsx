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
  H2, H3, H5, BodySm, BodyMd, Caption,
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
  const { colors, borderRadius } = useTheme();
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
            style={[
              styles.toggleText,
              { color: billing === cycle ? '#fff' : colors.text.secondary }
            ]}
          >
            <BodySm>{cycle === 'monthly' ? 'Monthly' : 'Yearly'}</BodySm>
            {cycle === 'yearly' && (
              <BodySm
                style={[
                  styles.saveText,
                  { color: billing === 'yearly' ? '#FFFFFF80' : colors.ai.default }
                ]}
              >
                <BodySm> Save 33%</BodySm>
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
  const { colors, spacing } = useTheme();
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
          scale.value = withSpring(0.97, { damping: 12 }, (finished) => {
            if (finished === true) {
              scale.value = withSpring(1);
            }
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
            <Caption style={styles.popularText}>
              <Caption>MOST POPULAR</Caption>
            </Caption>
          </View>
        )}

        {/* Icon + Name */}
        <View style={styles.planHeader}>
          <Caption style={styles.planIcon}><Caption>{config.icon}</Caption></Caption>
          <View>
            <H5 style={{ color: config.color }}><BodySm>{config.name}</BodySm></H5>
            <Caption color="tertiary"><Caption>{config.tagline}</Caption></Caption>
          </View>
          {isCurrent && (
            <Badge label="Current" variant="neutral" size="sm" />
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          {amount === 0 ? (
            <H2 color="primary"><BodySm>Free</BodySm></H2>
          ) : (
            <>
              <Caption
                color="secondary"
                style={styles.currencySymbol}
              >
                <Caption>$</Caption>
              </Caption>
              <H2 style={{ color: config.color }}>
                <BodySm>{amount.toFixed(2)}</BodySm>
              </H2>
              <Caption color="secondary" style={styles.pricePeriod}>
                <Caption>/mo</Caption>
              </Caption>
            </>
          )}
        </View>

        {billing === 'yearly' && amount > 0 && (
          <Caption color="tertiary">
            <Caption>Billed ${price.yearly} annually</Caption>
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
  const { colors } = useTheme();

  const renderValue = (v: boolean | string): React.JSX.Element => {
    if (v === false) return <Caption style={styles.featureFalse}><Caption>—</Caption></Caption>;
    if (v === true)  return <Caption style={styles.featureTrue}><Caption>✓</Caption></Caption>;
    return <Caption color="secondary" style={styles.featureValue}><Caption>{v}</Caption></Caption>;
  };

  return (
    <View
      style={[
        styles.featureRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border.default },
      ]}
    >
      <Caption color="secondary" style={styles.featureLabel}><Caption>{label}</Caption></Caption>
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
            <Caption color="secondary"><Text>←</Text></Caption>
          </TouchableOpacity>
          <H3 color="primary"><BodySm>Plans</BodySm></H3>
          <View style={styles.navRightPlaceholder} />
        </View>

        {/* ─── Hero ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.hero}
        >
          <Caption style={styles.heroIcon}><Text>⚡</Text></Caption>
          <H2 color="primary" align="center">
            <BodySm>Unlock your{"\n"}full potential</BodySm>
          </H2>
          <BodyMd color="secondary" align="center">
            <BodySm>AI-powered voice recording for creators, students, and professionals</BodySm>
          </BodyMd>
        </Animated.View>

        {/* ─── Billing Toggle ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.billingToggleSection}
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

          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.subscribeCta}
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
              onPress={() => { handleSubscribe(); }}
              variant={selected === 'free' ? 'outline' : 'primary'}
              size="lg"
              fullWidth
            />
            <Caption color="tertiary" align="center" style={styles.subscribeNote}>
              <Caption>Cancel anytime · Secure payment via Stripe</Caption>
            </Caption>
          </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.comparisonSection}
        >
          <H5 color="primary" style={styles.marginBottom12}>
            <BodySm>Compare Plans</BodySm>
          </H5>

          <Card variant="filled" padding={0}>
            {/* Header */}
            <View
              style={[
                styles.tableHeader,
                { borderBottomColor: colors.border.default },
              ]}
            >
              <Caption color="tertiary" style={styles.featureLabel}><Caption>Feature</Caption></Caption>
              {(['free', 'pro', 'enterprise'] as SubscriptionTier[]).map((t) => (
                <View key={t} style={styles.featureCell}>
                  <Caption
                    style={[
                      styles.tableHeaderCell,
                      { color: TIER_CONFIG[t].color }
                    ]}
                  >
                    <Caption>{TIER_CONFIG[t].icon} {TIER_CONFIG[t].name}</Caption>
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

        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.faqSection}
        >
          <H5 color="primary" style={styles.marginBottom12}>
            <BodySm>Frequently Asked Questions</BodySm>
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
              style={styles.faqCard}
            >
              <View style={styles.faqContent}>
                <BodySm color="primary" style={styles.fontWeight600}><BodySm>{q}</BodySm></BodySm>
                <Caption color="secondary"><Caption>{a}</Caption></Caption>
              </View>
            </Card>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    alignItems:     'center',
    borderRadius:   12,
    height:         40,
    justifyContent: 'center',
    width:          40,
  } as ViewStyle,
  billingToggleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  currencySymbol: {
    alignSelf: 'flex-start',
    fontSize: 16,
    marginTop: 6,
  },
  faqCard: {
    marginBottom: 8,
  },
  faqContent: {
    gap: 4,
  },
  faqSection: {
    marginBottom: 32,
  },
  featureCell: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          64,
  } as ViewStyle,
  featureFalse: {
    color: '#ccc', // This should be from theme border default
  },
  featureLabel: {
    flex: 1.4,
  },
  featureRow: {
    alignItems:        'center',
    flexDirection:     'row',
    minHeight:         44,
    paddingHorizontal: 16,
    paddingVertical:   12,
  } as ViewStyle,
  featureTrue: {
    fontSize: 16,
    // color: colors.ai.default - handled in renderValue
  },
  featureValue: {
    fontSize: 11,
  },
  fontWeight600: {
    fontWeight: '600'
  },
  hero: {
    alignItems:   'center',
    gap:          10,
    marginBottom: 28,
    paddingTop:   8,
  } as ViewStyle,
  heroIcon: {
    fontSize: 40,
  },
  marginBottom12: {
    marginBottom: 12,
  },
  navRightPlaceholder: {
    width: 40
  },
  navRow: {
    alignItems:     'center',
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   8,
    paddingVertical: 12,
  } as ViewStyle,
  planCard: {
    borderRadius: 18,
    gap:          6,
    overflow:     'hidden',
    padding:      18,
    position:     'relative',
  } as ViewStyle,
  planCards: {
    gap: 12,
    marginBottom: 20,
  } as ViewStyle,
  planHeader: {
    alignItems:    'center',
    flexDirection: 'row',
    gap:           10,
    marginBottom:  4,
  } as ViewStyle,
  planIcon: {
    fontSize: 28,
  },
  popularBadge: {
    borderRadius:   20,
    paddingHorizontal: 8,
    paddingVertical:   3,
    position:       'absolute',
    right:          12,
    top:            12,
  } as ViewStyle,
  popularText: {
    color: '#fff',
    fontSize: 9,
    letterSpacing: 1,
  },
  pricePeriod: {
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  priceRow: {
    alignItems:    'baseline',
    flexDirection: 'row',
    gap:           2,
  } as ViewStyle,
  saveText: {
    fontSize: 11,
  },
  screen: { flex: 1 } as ViewStyle,
  scroll: { flexGrow: 1 } as ViewStyle,
  subscribeCta: {
    marginBottom: 20,
  },
  subscribeNote: {
    marginTop: 8,
  },
  tableHeader: {
    alignItems:      'center',
    borderBottomWidth: 1,
    flexDirection:   'row',
    paddingHorizontal: 16,
    paddingVertical:   12,
  } as ViewStyle,
  tableHeaderCell: {
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding:       4,
    borderWidth:   1,
  } as ViewStyle,
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical:   8,
  } as ViewStyle,
  toggleText: {
    fontWeight: '600',
  },
});

export { SubscriptionScreen };