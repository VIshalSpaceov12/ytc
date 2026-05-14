import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, space, font } from '@/core/theme';

type Props = {
  /** The profile's configured daily limit in minutes (real usage calc lands in Task 62) */
  dailyLimitMinutes: number;
};

export function TimeRemainingBanner({ dailyLimitMinutes }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {t('kid.timeRemaining', { minutes: dailyLimitMinutes })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accent,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
});
