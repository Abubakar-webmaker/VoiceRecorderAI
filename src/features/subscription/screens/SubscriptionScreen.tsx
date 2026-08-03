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
import useAuth from '@features/auth/hooks/useAuth';
import axios from 'axios';
import { env } from '@config/env';

const SubscriptionScreen = ({ navigation }: any): React.JSX.Element => {
  const { colors, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${env.API_URL}/payments/create-session`, {
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
      <ScrollView contentContainerStyle={{ padding: spacing[5] }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
            <Caption color="secondary" style={{ marginBottom: 8 }}>/month</Caption>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Caption style={{ fontSize: 20 }}>{f.icon}</Caption>
                <View style={{ flex: 1 }}>
                  <H4 color="primary" style={{ fontSize: 16 }}>{f.title}</H4>
                  <BodySm color="tertiary">{f.desc}</BodySm>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleUpgrade}
            disabled={loading}
            style={[styles.upgradeBtn, { backgroundColor: colors.primary.default }]}
          >
            {loading ? <Loader color="#fff" /> : <H4 style={{ color: '#fff' }}>Upgrade Now</H4>}
          </TouchableOpacity>
          <Caption color="tertiary" align="center" style={{ marginTop: spacing[3] }}>
            Secure payment via Stripe. Cancel anytime.
          </Caption>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 } as ViewStyle,
  backBtn: { marginBottom: 20 },
  header: { marginBottom: 32, gap: 8 },
  pricingCard: { padding: 24, position: 'relative' },
  pricingBadge: { position: 'absolute', top: -12, alignSelf: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginVertical: 16, gap: 4 },
  featureList: { gap: 20, marginVertical: 24 },
  featureItem: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  upgradeBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});

export default SubscriptionScreen;
