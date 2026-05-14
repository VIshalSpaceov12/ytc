import Svg, { Circle } from 'react-native-svg';

export function ProgressRing({ progress, x, y }: { progress: number; x: number; y: number }) {
  const r = 28;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <Svg width={64} height={64} style={{ position: 'absolute', left: x - 32, top: y - 32 }} pointerEvents="none">
      <Circle cx={32} cy={32} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={4} fill="transparent" />
      <Circle cx={32} cy={32} r={r} stroke="#fff" strokeWidth={4}
        strokeDasharray={C} strokeDashoffset={offset} fill="transparent" />
    </Svg>
  );
}
