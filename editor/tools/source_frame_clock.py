"""Bounded source presentation-clock sampling for local video tools (stdlib only)."""
import json
import math
import subprocess


def presentation_decode_command(source, start, duration, fps, max_samples=120, max_fps=15, output=None):
    """output=None keeps the SAM2 640px MJPEG pipe; callers may pass full-size raw output args."""
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (start, duration, fps)) or start < 0 or not .2 <= duration <= 15 or not 1 <= fps <= max_fps or duration*fps > max_samples:
        raise ValueError('Invalid tracking sample interval.')

    def probe(args):
        result = subprocess.run(['ffprobe', '-v', 'error', *args, '-of', 'json', source], capture_output=True, timeout=15, check=True)
        if len(result.stdout) > 4*1024*1024:
            raise ValueError('Tracking timestamp metadata exceeded limit.')
        return json.loads(result.stdout)

    origin = float(probe(['-show_entries', 'format=start_time']).get('format', {}).get('start_time', 0))
    if not math.isfinite(origin):
        raise ValueError('Invalid tracking source origin.')
    target = origin+start
    interval = f'{max(origin,target-2):.9f}%{target+2:.9f}'
    info = probe(['-select_streams', 'v:0', '-read_intervals', interval, '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time'])
    times = [float(f['best_effort_timestamp_time']) for f in info.get('frames', []) if f.get('best_effort_timestamp_time') is not None]
    preceding = [t for t in times if math.isfinite(t) and origin-1e-7 <= t <= target+1e-7]
    if not preceding:
        raise ValueError('Cannot verify the presented first tracking frame; select another source interval.')
    first = max(preceding)
    # Accurate seek alone drops the held frame before an unaligned start.
    # Preserve absolute PTS, shift to the requested clock and round UP in the
    # fps filter so each tick holds the last source frame at/before that tick.
    seek = max(0, first-origin-.000001)
    count = math.ceil(duration*fps-1e-7)
    command = ['ffmpeg', '-nostdin', '-v', 'error', '-copyts', '-ss', f'{seek:.9f}', '-i', source, '-map', '0:v:0', '-t', str(duration), '-vf', f'setpts=PTS-({target:.9f})/TB,fps={fps}:start_time=0:round=up' + (',scale=640:640:force_original_aspect_ratio=decrease' if output is None else ''), '-frames:v', str(count), *(output or ['-f', 'image2pipe', '-vcodec', 'mjpeg', '-'])]
    return command, {'method': 'presentation-held-v1', 'requestedFrom': start, 'firstSourceFrameTime': max(0, first-origin), 'samplesRequested': count, 'fps': fps}
