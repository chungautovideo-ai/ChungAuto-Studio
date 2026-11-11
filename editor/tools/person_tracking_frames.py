from source_frame_clock import presentation_decode_command


def tracking_decode_command(source, start, duration, fps):
    return presentation_decode_command(source, start, duration, fps, max_samples=120, max_fps=15)
