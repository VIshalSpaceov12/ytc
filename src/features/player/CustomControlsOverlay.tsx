import { View, Text } from 'react-native';
type Props = { playing: boolean; onPlayPause: () => void; onSeek: (s: number) => void; onBack: () => void };
export function CustomControlsOverlay(_: Props) { return <View><Text style={{color:'#fff'}}>controls</Text></View>; }
