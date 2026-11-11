// Crop fallback for small faces. All returned coordinates remain in source space.
export const SEARCH_REGIONS = [
  { x: .25, y: .25, w: .5, h: .5 },
  ...[0, .35].flatMap(y => [0, .35].map(x => ({ x, y, w: .65, h: .65 }))),
];

export function sourceLandmarks(points, region) {
  return points.map(p => ({ ...p, x: region.x + p.x * region.w, y: region.y + p.y * region.h }));
}

export async function searchFace({ detect, draw, previous, signal }) {
  const check = () => { if (signal?.aborted) throw new Error('Đã huỷ quét.'); };
  check();
  const full = await detect(null);
  if (full?.length) return { points: full, region: null };
  for (const region of [previous, ...SEARCH_REGIONS].filter(Boolean)) {
    check();
    draw(region);
    const points = await detect(region);
    if (points?.length) return { points: sourceLandmarks(points, region), region };
  }
  return { points: null, region: null };
}
