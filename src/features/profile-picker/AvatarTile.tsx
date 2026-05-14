import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, space, radius, font } from '@/core/theme';
import type { KidProfile } from '@/shared/types/kidProfile';

type Props = {
  profile: KidProfile;
  onPress: () => void;
};

export function AvatarTile({ profile, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatarCircle}>
        <Text style={styles.emoji}>{profile.avatarEmoji}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    width: 120,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  emoji: {
    fontSize: 42,
  },
  name: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text,
    textAlign: 'center',
  },
});
