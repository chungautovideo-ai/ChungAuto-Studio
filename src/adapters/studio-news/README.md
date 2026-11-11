# Studio news reader adapter

Source: `D:/Edit tự động/chungauto-studio/studio/news/ingest.py`.
Original SHA256: DC8D39643009AFD0C4C9CA42758F98FEEE8C3FB758CD000F491C484B1C2324E9.
Copied fetch/parse/facts portion on 2026-11-04 with original module comments; removed original config import and code from syllables_spoken onward (draft/provider/verify/run/CLI). ContentOS exposes fetch, parse and facts through read.py. No original app credentials/config loaded.

Requires installed Python and lxml. CONTENTOS_PYTHON can select the interpreter. Installer dependency provisioning remains unfinished. Read URL respects original network/robots checks; supplied HTML does not perform a network request. No image download, AI or automatic factual verification.
