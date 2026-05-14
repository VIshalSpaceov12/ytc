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
import { startSession, heartbeat, endSession } from '@/data/repositories/watchSessionRepo';
import { getDeviceId } from '@/core/deviceId';
import { useDailyLimitGuard } from '@/features/kid-zone/useDailyLimitGuard';
import { AllDoneScreen } from '@/features/kid-zone/AllDoneScreen';

type Props = { youtubeId: string; gesture: UnlockGesture; profileId: string; videoId: string; onBack: () => void };

export function VideoPlayerShell({ youtubeId, gesture, profileId, videoId, onBack }: Props) {
  useKeepAwake();
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [playing, setPlaying] = useState(true);
  const [needsResume, setNeedsResume] = useState(false);
  const { isLocked, overlayVisible, toggleOverlay, hideOverlay, setProgress } = usePlayerStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsWatched, setSecondsWatched] = useState(0);

  useEffect(() => {
    let activeId: string | null = null;
    (async () => {
      const deviceId = await getDeviceId();
      const id = await startSession(profileId, videoId, deviceId);
      activeId = id;
      setSessionId(id);
    })();
    return () => {
      if (activeId) endSession(activeId, secondsWatched).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, videoId]);

  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(() => {
      setSecondsWatched((s) => {
        const next = s + 10;
        heartbeat(sessionId, next).catch(() => {});
        return next;
      });
    }, 10_000);
    return () => clearInterval(id);
  }, [sessionId]);

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
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync(isLocked ? 'hidden' : 'visible');
    }
  }, [isLocked]);

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

  const remaining = useDailyLimitGuard(profileId);
  if (remaining !== null && remaining <= 0) {
    return <AllDoneScreen onLeave={onBack} />;
  }

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
