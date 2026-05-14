import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, space, radius, font } from '@/core/theme';

export default function AdsNoticeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📢</Text>
      </View>
      <Text style={styles.title}>{t('parent.ads.title')}</Text>
      <Text style={styles.body}>{t('parent.ads.body')}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(parent)/profile-picker')}
        accessibilityRole="button"
        accessibilityLabel="Dismiss ads notice and continue"
      >
        <Text style={styles.buttonText}>{t('parent.ads.dismiss')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: space.xl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: space.lg,
  },
  body: {
    fontSize: font.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: space.xxl,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md + 2,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
  },
});
