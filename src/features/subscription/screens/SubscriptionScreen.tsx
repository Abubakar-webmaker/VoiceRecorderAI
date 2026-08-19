import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { H2, H3, H4, BodyMd, BodySm, Caption } from '@components/common/Typography';
import { Card } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { Loader } from '@components/common/Loader';
import useTheme from '@hooks/useTheme';
import axios from 'axios';
import Config from 'react-native-config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

const SubscriptionScreen = ({ navigation }: Props): React.JSX.Element => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.post<{
        success: boolean;
        data: { url: string };
      }>(`${Config.API_BASE_URL ?? 'http://10.0.2.2:5000/api/v1'}/payments/create-session`, {
        plan: 'pro'
      });

      if (response.data.success && response.data.data.url) {
        // In a real mobile app, you would use Stripe SDK or a WebView
        // Here we open the Stripe Checkout URL in the browser
        await Linking.openURL(response.data.data.url);
      }
    } catch (error) {
      Alert.alert('Payment Error', 'Could not initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    { icon: '🎙️', title: 'Unlimited Recordings', desc: 'No limits on audio length or count.' },
    { icon: '🤖', title: 'Advanced AI Analysis', desc: 'Summaries, action items, and keywords.' },
    { icon: '☁️', title: '10GB Cloud Storage', desc: 'Keep all your recordings safe.' },
    { icon: '💬', title: 'Chat with AI', desc: 'Ask questions about your recordings.' },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => { void navigation.goBack(); }} style={styles.backBtn}>
          <Caption color="secondary">← Back</Caption>
        </TouchableOpacity>

        <View style={styles.header}>
          <H2 color="primary" align="center">Upgrade to Pro</H2>
          <BodyMd color="secondary" align="center">
            Unlock the full power of AI-driven voice recording.
          </BodyMd>
        </View>

        <Card variant="filled" style={styles.pricingCard}>
          <Badge label="MOST POPULAR" variant="primary" size="sm" style={styles.pricingBadge} />
          <H3 color="primary" align="center">Pro Plan</H3>
          <View style={styles.priceRow}>
            <H2 color="primary">$9.99</H2>
            <Caption color="secondary" style={styles.pricePeriod}>/month</Caption>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Caption style={styles.featureIcon}>{f.icon}</Caption>
                <View style={styles.flex1}>
                  <H4 color="primary" style={styles.featureTitle}>{f.title}</H4>
                  <BodySm color="tertiary">{f.desc}</BodySm>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => { void handleUpgrade(); }}
            disabled={loading}
            style={[styles.upgradeBtn, { backgroundColor: colors.primary.default }]}
          >
            {loading ? (
              <Loader color={colors.text.inverse} />
            ) : (
              <H4 style={[styles.upgradeBtnText, { color: colors.text.inverse }]}>Upgrade Now</H4>
            )}
          </TouchableOpacity>
          <Caption color="tertiary" align="center" style={styles.secureNote}>
            Secure payment via Stripe. Cancel anytime.
          </Caption>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backBtn: { marginBottom: 20 },
  bottomSpacer: { height: 40 },
  featureIcon: { fontSize: 20 },
  featureItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 16 },
  featureList: { gap: 20, marginVertical: 24 },
  featureTitle: { fontSize: 16 },
  flex1: { flex: 1 },
  header: { gap: 8, marginBottom: 32 },
  pricePeriod: { marginBottom: 8 },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4, justifyContent: 'center', marginVertical: 16 },
  pricingBadge: { alignSelf: 'center', position: 'absolute', top: -12 },
  pricingCard: { padding: 24, position: 'relative' },
  screen: { flex: 1 } as ViewStyle,
  scrollContent: { padding: 20 },
  secureNote: { marginTop: 12 },
  upgradeBtn: { alignItems: 'center', borderRadius: 16, height: 56, justifyContent: 'center', marginTop: 12 },
  upgradeBtnText: { },
});

export default SubscriptionScreen;
