# Preview runtime recovery — 2026-11-09
Cause: /hf/player.js returned 404; HyperFrames package absent from machine npm cache despite existing render Chrome cache.
Restored pinned hyperframes@0.9.6 using bundled Node/npm. CLI version verified. Server rediscovered runtime without restart. No project/media edits or render.
Validation: /hf/player.js 200 (117329 bytes), /hf/runtime.js 200 (619740 bytes), /p/index.html 200 with runtime injected. All 9 video source Range requests returned 206.
Limitation: CUA kernel failed to initialize because mapped Z: cwd was unavailable; browser image/audio not observed. Retry or reload existing editor tab required after previous failed player load.
