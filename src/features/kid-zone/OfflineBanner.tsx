import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space, font } from '@/core/theme';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => setOnline(!!s.isConnected));
    return () => sub();
  }, []);
  if (online) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline — videos need internet to play</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.danger, padding: space.sm, alignItems: 'center' },
  text: { color: '#fff', fontSize: font.size.sm, fontWeight: '600' },
});
