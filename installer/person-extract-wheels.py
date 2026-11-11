"""Install locked wheels into an embedded runtime; no pip or system writes."""
import os, sys, zipfile, pathlib

target = pathlib.Path(sys.argv[1]).resolve()
target.mkdir(parents=True, exist_ok=True)
for archive in sys.argv[2:]:
    with zipfile.ZipFile(archive) as wheel:
        for entry in wheel.infolist():
            parts = pathlib.PurePosixPath(entry.filename).parts
            if not parts or '..' in parts or entry.filename.startswith(('/', '\\')) or ':' in entry.filename or '\\' in entry.filename:
                raise ValueError('Invalid wheel member')
            if parts[0].endswith('.data'):
                if len(parts) < 3 or parts[1] not in ('purelib', 'platlib'):
                    continue  # no CLI entry points or files outside site-packages
                parts = parts[2:]
            destination = target.joinpath(*parts).resolve()
            if not destination.is_relative_to(target):
                raise ValueError('Wheel member escapes destination')
            if entry.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with wheel.open(entry) as source, destination.open('wb') as output:
                    import shutil
                    shutil.copyfileobj(source, output, 1024 * 1024)
