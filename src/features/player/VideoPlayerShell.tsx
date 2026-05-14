import { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Platform, BackHandler, Text } from 'react-native';
import YoutubeIframe, { PLAYER_STATES } from 'react-native-youtube-iframe';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { usePlayerStore } from './playerStore';
import { configurePlaybackAudioSession } from './audioSession';
import { CustomControlsOverlay } from './CustomControlsOverlay';
import { UnlockGestureDetector } from './UnlockGestureDetector';
import type { UnlockGesture } from '@/shared/types/kidProfile';

type Props = { youtubeId: string; gesture: UnlockGesture; onBack: () => void };

export function VideoPlayerShell({ youtubeId, gesture, onBack }: Props) {
  useKeepAwake();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [playing, setPlaying] = useState(true);
  const [needsResume, setNeedsResume] = useState(false);
  const { isLocked, overlayVisible, toggleOverlay, hideOverlay, setProgress } = usePlayerStore();

  useEffect(() => { configurePlaybackAudioSession(); }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => isLocked);
    return () => sub.remove();
  }, [isLocked]);

  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('hidden');
    return () => {
      if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('visible');
    };
  }, []);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); };
  }, []);

  useEffect(() => {
    if (!overlayVisible) return;
    const id = setTimeout(() => hideOverlay(), 3000);
    return () => clearTimeout(id);
  }, [overlayVisible, hideOverlay]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(async () => {
      const cur = await playerRef.current?.getCurrentTime() ?? 0;
      const dur = await playerRef.current?.getDuration() ?? 0;
      setProgress(cur, dur);
    }, 1000);
    return () => clearInterval(id);
  }, [playing, setProgress]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <YoutubeIframe
        ref={playerRef}
        height={300}
        play={playing}
        videoId={youtubeId}
        onChangeState={(s: PLAYER_STATES) => {
          if (s === PLAYER_STATES.PAUSED && playing) setNeedsResume(true);
          if (s === PLAYER_STATES.PLAYING) setNeedsResume(false);
          if (s === PLAYER_STATES.ENDED) setPlaying(false);
        }}
      />
      {!isLocked && (
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleOverlay}>
          {overlayVisible ? (
            <CustomControlsOverlay
              playing={playing}
              onPlayPause={() => setPlaying((p) => !p)}
              onSeek={(s) => playerRef.current?.seekTo(s, true)}
              onBack={onBack}
            />
          ) : null}
        </Pressable>
      )}
      {needsResume && !isLocked && (
        <Pressable style={styles.resume} onPress={() => { setPlaying(true); setNeedsResume(false); }}>
          <Text style={styles.resumeText}>▶ Ready to keep watching?</Text>
        </Pressable>
      )}
      {isLocked && <UnlockGestureDetector gesture={gesture} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  resume: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  resumeText: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
