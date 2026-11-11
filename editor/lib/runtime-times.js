// Mốc thời gian dùng chung giữa runtime (hình) và build (SFX), để tiếng khớp hình.
export function chipTimes(dur, n, cues) {
  const gap = Math.min(0.9, Math.max(0.35, (dur - 1.2) / Math.max(n, 1)));
  return Array.from({ length: n }, (_, i) => (cues && cues[i] != null ? cues[i] : 0.25 + i * gap));
}
