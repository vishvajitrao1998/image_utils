import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import BrandMark from '../components/BrandMark';
import GradientButton from '../components/GradientButton';
import GradientText from '../components/GradientText';
import { SettingsRow, SettingsSection } from '../components/SettingsUI';
import { APP_VERSION, STORE_URL, SUPPORT_EMAIL } from '../constants/app';
import { BRAND } from '../constants/tools';
import { useTheme } from '../theme';
import { clearCache, getCacheSize } from '../utils/cache';
import { formatBytes } from '../utils/format';

export default function Settings() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    setCacheSize(getCacheSize());
  }, []);

  const openMail = (subject: string) =>
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() =>
      Alert.alert('No email app found', `You can write to us at ${SUPPORT_EMAIL}`)
    );

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out ${BRAND.name}: ${BRAND.tagline}${STORE_URL ? `\n${STORE_URL}` : ''}`,
      });
    } catch {
      // the user closed the share sheet
    }
  };

  const onRate = () => {
    if (!STORE_URL) {
      Alert.alert('Not available yet', 'The store page is not set up yet.');
      return;
    }
    Linking.openURL(STORE_URL).catch(() => Alert.alert('Could not open the store'));
  };

  const onClearCache = () => {
    Alert.alert(
      'Clear temporary files?',
      'This removes temporary copies created by the tools. Your saved images are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const before = cacheSize;
            clearCache();
            const after = getCacheSize();
            setCacheSize(after);
            Alert.alert('Done', `Freed ${formatBytes(Math.max(0, before - after))}.`);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Brand card */}
        <View style={[styles.brandCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BrandMark size={72} />
          <GradientText style={styles.brandName}>{BRAND.name}</GradientText>
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
            {BRAND.tagline}
          </Text>
          <GradientButton
            label="Go to Home"
            icon="home"
            onPress={() => router.navigate('/home')}
            style={{ marginTop: 20 }}
          />
        </View>

        <SettingsSection title="Appearance">
          <SettingsRow
            icon={theme.mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
            title="Dark mode"
            subtitle={theme.mode === 'dark' ? 'On' : 'Off'}
            right={
              <Switch
                value={theme.mode === 'dark'}
                onValueChange={toggle}
                trackColor={{ false: theme.border, true: theme.text }}
                thumbColor={theme.bg}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="information-circle-outline" title="App version" value={APP_VERSION} />
          <SettingsRow icon="shield-checkmark-outline" title="All processing is on your device" subtitle="Your images are never uploaded" />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow
            icon="mail-outline"
            title="Contact us"
            subtitle={SUPPORT_EMAIL}
            onPress={() => openMail(`${BRAND.name} support`)}
          />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            title="Send feedback"
            subtitle="Tell us what to improve"
            onPress={() => openMail(`${BRAND.name} feedback (v${APP_VERSION})`)}
          />
          <SettingsRow icon="star-outline" title="Rate the app" onPress={onRate} />
          <SettingsRow icon="share-social-outline" title="Share the app" subtitle="Tell your friends" onPress={onShare} />
          <SettingsRow
            icon="key-outline"
            title="App permissions"
            subtitle="Photos and storage access"
            onPress={() => Linking.openSettings()}
          />
        </SettingsSection>

        <SettingsSection title="Storage">
          <SettingsRow
            icon="trash-outline"
            title="Clear temporary files"
            subtitle="Frees space used by the tools"
            value={formatBytes(cacheSize)}
            onPress={onClearCache}
          />
        </SettingsSection>

        <SettingsSection title="Legal">
          <SettingsRow icon="lock-closed-outline" title="Privacy policy" onPress={() => router.push('/privacy')} />
          <SettingsRow icon="document-text-outline" title="Disclaimer" onPress={() => router.push('/disclaimer')} />
        </SettingsSection>

        <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
          {BRAND.name} · Version {APP_VERSION}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 22 },
  brandCard: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center' },
  brandName: { fontSize: 30, fontWeight: '800', marginTop: 16 },
});