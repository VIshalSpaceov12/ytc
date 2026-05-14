import { View, Text, Pressable, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from './playerStore';
import { colors, space, font } from '@/core/theme';

type Props = {
  playing: boolean;
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  onBack: () => void;
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function CustomControlsOverlay({ playing, onPlayPause, onSeek, onBack }: Props) {
  const { currentSec, durationSec } = usePlayerStore();
  const lock = usePlayerStore((s) => s.lock);

  return (
    <View style={styles.overlay}>
      <View style={styles.top}>
        <Pressable onPress={onBack} accessibilityLabel="Back"><Text style={styles.button}>←</Text></Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={lock} accessibilityLabel="Lock"><Text style={styles.button}>🔒</Text></Pressable>
      </View>
      <View style={styles.center}>
        <Pressable onPress={onPlayPause} accessibilityLabel={playing ? 'Pause' : 'Play'}>
          <Text style={styles.playPause}>{playing ? '⏸' : '▶'}</Text>
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.time}>{fmt(currentSec)}</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={durationSec || 1}
          value={currentSec} onSlidingComplete={onSeek}
          minimumTrackTintColor="#fff" maximumTrackTintColor="rgba(255,255,255,0.4)" />
        <Text style={styles.time}>{fmt(durationSec)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'space-between', padding: space.lg },
  top: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: { fontSize: 28, color: '#fff' },
  playPause: { fontSize: 56, color: '#fff' },
  time: { color: '#fff', fontSize: font.size.sm, width: 40, textAlign: 'center' },
  slider: { flex: 1, height: 30 },
});
