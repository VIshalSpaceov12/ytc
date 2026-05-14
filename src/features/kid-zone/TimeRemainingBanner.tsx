import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDailyLimitGuard } from './useDailyLimitGuard';
import { colors, space, font } from '@/core/theme';

export function TimeRemainingBanner({ profileId }: { profileId: string }) {
  const { t } = useTranslation();
  const remaining = useDailyLimitGuard(profileId);
  if (remaining === null) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {t('kid.timeRemaining', { minutes: Math.max(0, Math.floor(remaining / 60)) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: space.md, backgroundColor: colors.bgDim, alignItems: 'center' },
  text: { fontSize: font.size.md, fontWeight: '600' },
});
