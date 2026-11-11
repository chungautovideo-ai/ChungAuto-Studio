"""Conservative hard-cut guard. Rejects obvious discontinuities, not identity verification."""
import numpy as np


def shot_discontinuity(frames):
    previous = None
    previous_hist = None
    samples = []
    for index, frame in enumerate(frames):
        rgb = np.asarray(frame.resize((64, 64)), dtype=np.float32) / 255.0
        # Keep RGB histograms so a similarly bright replacement can still be detected.
        hist = np.concatenate([np.histogram(rgb[:, :, channel], bins=16, range=(0, 1))[0] / 4096 for channel in range(3)])
        if previous is not None:
            delta = float(np.mean(np.abs(rgb - previous)))
            distance = float(np.sum(np.abs(hist - previous_hist)) / 6)
            samples.append({'frame': index, 'pixelDelta': round(delta, 6), 'histogramDistance': round(distance, 6)})
            if delta > .22 and distance > .42:
                return {'cutFrame': index, 'samples': samples}
        previous, previous_hist = rgb, hist
    return {'cutFrame': None, 'samples': samples}
