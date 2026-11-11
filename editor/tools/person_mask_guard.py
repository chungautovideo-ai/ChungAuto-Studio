"""Reject abrupt mask changes; this heuristic does not establish human identity."""
import numpy as np


def mask_transition(previous, current):
    a, b = np.asarray(previous, dtype=bool), np.asarray(current, dtype=bool)
    if a.ndim != 2 or a.shape != b.shape or not a.any() or not b.any():
        raise ValueError('Tracking mask missing or dimensions changed; select again.')
    area_a, area_b = int(a.sum()), int(b.sum())
    intersection = int(np.logical_and(a, b).sum())
    overlap = intersection / min(area_a, area_b)
    area_ratio = max(area_a, area_b) / min(area_a, area_b)
    ya, xa = np.nonzero(a)
    yb, xb = np.nonzero(b)
    h, w = a.shape
    distance = float(np.hypot((xa.mean()-xb.mean())/w, (ya.mean()-yb.mean())/h))
    # Large motion with overlap is allowed. Disjoint relocation, or severe area
    # collapse/expansion, requires review rather than silently accepting a new region.
    reason = ('relocation' if overlap < .05 and distance > .20 else
              'area-change' if area_ratio > 4 else None)
    return {'reason': reason, 'overlap': round(overlap, 6),
            'areaRatio': round(area_ratio, 6), 'centroidDistance': round(distance, 6)}
