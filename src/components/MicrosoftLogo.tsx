export function MicrosoftLogo({ size = 20 }: { size?: number }) {
  const gap = size * 0.06;
  const sq = (size - gap) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <rect x="0" y="0" width={sq} height={sq} fill="#f25022" />
      <rect x={sq + gap} y="0" width={sq} height={sq} fill="#7fba00" />
      <rect x="0" y={sq + gap} width={sq} height={sq} fill="#00a4ef" />
      <rect x={sq + gap} y={sq + gap} width={sq} height={sq} fill="#ffb900" />
    </svg>
  );
}
