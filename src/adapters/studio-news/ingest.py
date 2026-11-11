"""N10 — Nhập tin: URL bài báo → bài đã trích → danh sách DỮ KIỆN đánh số (trích dẫn tới từng câu) → kịch bản tin ngắn + kiểm dữ kiện.

Chuỗi (mỗi bước dùng được riêng; không cần server):

    fetch(url)                       tải HTML: urllib, UA riêng, timeout 15 s, tối đa 5 MB, TÔN TRỌNG robots.txt (RFC 9309, có `*`/`$`),
                                     mỗi chặng chuyển hướng đều kiểm lại; chặn địa chỉ nội bộ (trừ allow_private=True khi thử nghiệm)
    parse_html(html, url=None)       lxml.html → {title, lead, text, paragraphs[], published, modified, author, source{name,domain},
                                     image{url, caption, credit, rights_warning, downloaded:false}, restrictions, warnings[]}
    ingest(url) / ingest_file(path)  fetch+parse / đọc trang đã lưu tay (khi trang chặn bot)
    facts(article)                   [{id:"F1", text, para, sent, span, cite, kind, numbers[], names[], quote, attribution, hedge, …}]
                                     F1 = tiêu đề; mọi dữ kiện là CÂU NGUYÊN VĂN của bài (có thể tra lại bằng span)
    draft_script(article, channel="chungauto-news", seconds=60, provider=None)
                                     nhờ AI viết lời đọc (provider lười, mock khi test) rồi MÁY kiểm: mọi số/tên phải có trong dữ kiện nguồn,
                                     không cáo buộc/siêu cấp/hotline/giá bịa, không chép nguyên văn, nguồn hiện trên màn hình "Nguồn: …"
    verify_script(script, article)   chạy riêng bộ kiểm (số khớp theo GIÁ TRỊ: "1,2 tỷ" = "1.200 triệu"; tên khớp không phân biệt dấu/hoa thường)
    run(url, out_dir=None, …)        đầu-cuối: ghi article.json, facts.json, script.json, script.md vào thư mục làm việc

CLI:  python -m studio.news.ingest {fetch|parse|facts|draft|verify|run} …   (xem --help)

Nguyên tắc:
  - Chỉ ĐỌC trang công khai; ảnh của bài KHÔNG tải (chỉ ghi URL + cảnh báo bản quyền).
  - Nội dung bài là DỮ LIỆU không tin cậy: đưa vào prompt trong khối DATA, có dò câu "lệnh" lạ (cảnh báo `injection`).
  - Máy là người duyệt (số/tên/nguồn); AI chỉ viết. Còn lỗi sau các vòng sửa ⇒ `verification.ok=false`, `needs_review=true` — KHÔNG tự coi là đạt.
  - Không bịa giá/ưu đãi/hotline/địa chỉ (luật chủ kênh); tin tai nạn/thương vong ⇒ cờ `sensitive` (không đoán nguyên nhân, tắt quảng cáo).
"""
from __future__ import annotations

import argparse
import contextlib
import copy
import hashlib
import html as _html
import ipaddress
import json
import math
import re
import socket
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zlib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

# ContentOS: only fetch/parse/facts entry points are exposed. No original app config or providers loaded.


SCHEMA_ARTICLE = "studio.news-article/1"
SCHEMA_FACTS = "studio.news-facts/1"
SCHEMA_SCRIPT = "studio.news-script/1"

USER_AGENT = "ChungAutoStudio/1.0 (news-ingest; local tool; honors robots.txt)"
ROBOTS_TOKEN = "chungautostudio"
TIMEOUT_S = 15.0                 # mỗi thao tác socket
MAX_BYTES = 5 * 1024 * 1024      # trần thân trang (cả nén lẫn sau giải nén)
MAX_ROBOTS_BYTES = 512 * 1024    # RFC 9309: đọc ít nhất 500 KiB
MAX_REDIRECTS = 5
MAX_URL_CHARS = 2048
MIN_HOST_INTERVAL_S = 1.0        # lịch sự: cách nhau ≥ 1 s giữa hai yêu cầu cùng máy chủ
ROBOTS_TTL_S = 3600.0
ROBOTS_FAIL_TTL_S = 300.0
STALE_DAYS = 7                   # tin cũ hơn ⇒ cảnh báo (FACT-05)
SPEECH_SYL_PER_S = 4.4           # tốc độ đọc đo được 4,1–4,7 âm tiết/giây (docs/research_script_to_video.md)
VN_TZ = timezone(timedelta(hours=7))

IMAGE_WARNING = ("Ảnh trong bài thuộc bản quyền của {who}. Chỉ để THAM KHẢO — không tải, không đưa vào video khi chưa có phép; "
                 "dùng ảnh/clip kho NAS hoặc nguồn có giấy phép.")


# ═════════════════════════════════════ lỗi ═════════════════════════════════════

class IngestError(Exception):
    """Lỗi có mã máy đọc được. code: BAD_URL, PRIVATE_HOST, ROBOTS_DISALLOW, ROBOTS_UNREACHABLE, TIMEOUT, NETWORK, HTTP_ERROR, TOO_LARGE,
    NOT_HTML, TOO_MANY_REDIRECTS, NO_ARTICLE, NO_FACTS, NO_PROVIDER, AI_FAILED, BAD_AI_OUTPUT, BAD_ARGUMENT."""

    def __init__(self, code: str, message: str, *, hint: str | None = None, **extra: Any):
        super().__init__(message)
        self.code = code
        self.message = message
        self.hint = hint
        self.extra = extra

    def to_dict(self) -> dict:
        d = {"error": self.code, "message": self.message}
        if self.hint:
            d["hint"] = self.hint
        d.update(self.extra)
        return d

    def __str__(self) -> str:                      # noqa: D105
        return f"{self.code}: {self.message}"


# ═════════════════════════════════════ văn bản ═════════════════════════════════════

_ZW = {ord(c): None for c in "​‌‍⁠﻿­‎‏"}
_WS = re.compile(r"[ \t\r\f\v  -   　]+")
_LETTER = re.compile(r"[^\W\d_]", re.U)


def nfc(s: Any) -> str:
    return unicodedata.normalize("NFC", "" if s is None else str(s))


def clean(s: Any) -> str:
    """NFC, bỏ ký tự vô hình, gộp khoảng trắng (kể cả xuống dòng)."""
    t = nfc(s).translate(_ZW)
    t = t.replace("\n", " ")
    return _WS.sub(" ", t).strip()


def fold(s: Any) -> str:
    """Chữ thường, bỏ dấu, đ→d, giữ nguyên chữ-số và khoảng trắng đơn."""
    t = nfc(s).lower().replace("đ", "d")
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return _WS.sub(" ", t.replace("\n", " ")).strip()


_WORD = re.compile(r"[^\W_]+", re.U)


def fold_words(s: Any) -> str:
    """Chuỗi từ đã bỏ dấu/dấu câu, tách chữ↔số ('VF8'→'vf 8', 'CX-5'→'cx 5') — để so khớp tên theo cụm từ."""
    t = fold(s)
    t = re.sub(r"(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])", " ", t)
    return " ".join(_WORD.findall(t))


def words(s: str) -> list[str]:
    return _WORD.findall(nfc(s))


def has_letters(s: str) -> bool:
    return bool(_LETTER.search(s))


def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _atomic_write(path: Path, data: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(data, encoding="utf-8", newline="\n")
    tmp.replace(path)


def write_json(path: Path, obj: Any) -> None:
    _atomic_write(Path(path), json.dumps(obj, ensure_ascii=False, indent=2, default=str) + "\n")


# ═════════════════════════════════════ robots.txt (RFC 9309) ═════════════════════════════════════

class RobotsRules:
    """Luật robots.txt cho UA của Studio. Hỗ trợ nhóm theo user-agent (chọn nhóm khớp dài nhất, không thì `*`), `*` và `$` trong đường dẫn,
    luật dài nhất thắng, hoà thì Allow thắng. `/robots.txt` luôn được phép."""

    def __init__(self, text: str = "", *, token: str = ROBOTS_TOKEN, user_agent: str = USER_AGENT, deny_all: bool = False):
        self.deny_all = deny_all
        self.agent: str | None = None
        self.rules: list[tuple[bool, str, re.Pattern, int]] = []
        if text:
            self._parse(text.lstrip("﻿"), (user_agent or "").lower(), (token or "").lower())

    @classmethod
    def allow_all(cls) -> "RobotsRules":
        return cls("")

    @classmethod
    def disallow_all(cls) -> "RobotsRules":
        return cls("", deny_all=True)

    def _parse(self, text: str, ua: str, token: str) -> None:
        groups: list[tuple[list[str], list[tuple[bool, str]]]] = []
        agents: list[str] | None = None
        rules: list[tuple[bool, str]] | None = None
        last_agent = False
        for raw in text.splitlines():
            line = raw.split("#", 1)[0].strip()
            if not line or ":" not in line:
                continue
            k, v = line.split(":", 1)
            k, v = k.strip().lower(), v.strip()
            if k == "user-agent":
                if rules is None or not last_agent:
                    agents, rules = [v.lower()], []
                    groups.append((agents, rules))
                else:
                    agents.append(v.lower())                     # type: ignore[union-attr]
                last_agent = True
            elif k in ("allow", "disallow"):
                last_agent = False
                if rules is not None:
                    rules.append((k == "allow", v))
            else:
                last_agent = False
        best, best_len = None, -1
        for ags, _ in groups:
            for a in ags:
                if a and a != "*" and (a in ua or a == token) and len(a) > best_len:
                    best, best_len = a, len(a)
        chosen = best if best is not None else "*"
        self.agent = chosen
        for ags, rs in groups:
            if chosen in ags:
                for allow, pat in rs:
                    if pat == "":
                        continue                                  # "Disallow:" rỗng = không cấm gì
                    anchored = pat.endswith("$")
                    body = pat[:-1] if anchored else pat
                    rx = re.escape(body).replace(r"\*", ".*")
                    self.rules.append((allow, pat, re.compile("^" + rx + (r"\Z" if anchored else "")), len(body)))

    def allowed(self, url_or_path: str) -> bool:
        if self.deny_all:
            return False
        p = urllib.parse.urlsplit(url_or_path)
        path = (p.path or "/") + (("?" + p.query) if p.query else "")
        if not path.startswith("/"):
            path = "/" + path
        if p.path == "/robots.txt":
            return True
        return self._allowed_path(path) and self._allowed_path(urllib.parse.unquote(path))

    def _allowed_path(self, path: str) -> bool:
        best: tuple[bool, int] | None = None
        for allow, _pat, rx, spec in self.rules:
            if rx.match(path) and (best is None or spec > best[1] or (spec == best[1] and allow and not best[0])):
                best = (allow, spec)
        return True if best is None else best[0]


_ROBOTS_CACHE: dict[str, tuple[float, "RobotsRules | IngestError"]] = {}
_HOST_LAST: dict[str, float] = {}
_NET_LOCK = threading.Lock()


def clear_caches() -> None:
    """Xoá bộ nhớ robots + nhịp truy cập (dùng trong test)."""
    with _NET_LOCK:
        _ROBOTS_CACHE.clear()
        _HOST_LAST.clear()


# ═════════════════════════════════════ tải trang ═════════════════════════════════════

class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):          # noqa: D102, ANN001
        return None


def normalize_url(url: str) -> str:
    u = clean(url)
    if not u or len(u) > MAX_URL_CHARS:
        raise IngestError("BAD_URL", "URL rỗng hoặc quá dài")
    if "://" not in u and not u.startswith("//"):
        u = "https://" + u
    p = urllib.parse.urlsplit(u)
    if p.scheme not in ("http", "https"):
        raise IngestError("BAD_URL", f"Chỉ nhận http/https, không nhận {p.scheme or '?'}://", hint="Dán địa chỉ bài báo bắt đầu bằng https://")
    if not p.hostname:
        raise IngestError("BAD_URL", "URL không có tên máy chủ")
    if p.username or p.password:
        raise IngestError("BAD_URL", "URL có sẵn tên người dùng/mật khẩu — không nhận")
    try:
        host = p.hostname.encode("idna").decode("ascii")
    except UnicodeError as e:
        raise IngestError("BAD_URL", f"Tên miền không hợp lệ: {p.hostname}") from e
    netloc = host + (f":{p.port}" if p.port else "")
    path = urllib.parse.quote(p.path or "/", safe="/%:@!$&'()*+,;=-._~")
    query = urllib.parse.quote(p.query, safe="=&%:@!$'()*+,;/?-._~")
    return urllib.parse.urlunsplit((p.scheme, netloc, path, query, ""))


def _check_host(host: str, port: int, allow_private: bool) -> bool:
    """Phân giải tên máy chủ; trả True nếu địa chỉ KHÔNG công khai (cho phép khi allow_private). Chặn địa chỉ nội bộ nếu không được phép."""
    try:
        infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
    except socket.gaierror as e:
        raise IngestError("NETWORK", f"Không phân giải được tên miền {host}: {e}") from e
    private = False
    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0].split("%")[0])
        except ValueError:
            continue
        if not ip.is_global:
            private = True
    if private and not allow_private:
        raise IngestError("PRIVATE_HOST", f"{host} là địa chỉ nội bộ/không công khai — không tải",
                          hint="Chỉ tải được trang công khai trên Internet.")
    return private


def _throttle(host: str) -> None:
    if MIN_HOST_INTERVAL_S <= 0:
        return
    with _NET_LOCK:
        last = _HOST_LAST.get(host, 0.0)
        wait = last + MIN_HOST_INTERVAL_S - time.monotonic()
        _HOST_LAST[host] = time.monotonic() + max(0.0, wait)
    if wait > 0:
        time.sleep(min(wait, 5.0))


def _inflate(raw: bytes, enc: str, max_bytes: int) -> bytes:
    enc = (enc or "identity").lower().strip()
    if enc in ("", "identity"):
        return raw
    try:
        if enc in ("gzip", "x-gzip"):
            d = zlib.decompressobj(16 + zlib.MAX_WBITS)
            out = d.decompress(raw, max_bytes + 1)
        elif enc == "deflate":
            try:
                d = zlib.decompressobj()
                out = d.decompress(raw, max_bytes + 1)
            except zlib.error:
                d = zlib.decompressobj(-zlib.MAX_WBITS)
                out = d.decompress(raw, max_bytes + 1)
        else:
            raise IngestError("NETWORK", f"Content-Encoding không hỗ trợ: {enc}")
    except zlib.error as e:
        raise IngestError("NETWORK", f"Giải nén lỗi ({enc}): {e}") from e
    if len(out) > max_bytes or d.unconsumed_tail:
        raise IngestError("TOO_LARGE", f"Trang vượt {max_bytes // 1024 // 1024} MB sau giải nén")
    return out


def _open_once(url: str, *, timeout: float, ua: str, max_bytes: int, deadline: float, accept: str, read_body: bool,
               direct: bool) -> tuple[int, dict[str, str], bytes]:
    """MỘT yêu cầu GET, không theo chuyển hướng. Trả (status, headers thường hoá khoá, thân đã giải nén — rỗng nếu read_body=False)."""
    handlers: list[Any] = [_NoRedirect()]
    if direct:
        handlers.append(urllib.request.ProxyHandler({}))             # địa chỉ nội bộ: không qua proxy hệ thống
    opener = urllib.request.build_opener(*handlers)
    req = urllib.request.Request(url, method="GET", headers={
        "User-Agent": ua, "Accept": accept, "Accept-Language": "vi,en;q=0.7", "Accept-Encoding": "gzip, deflate"})
    try:
        resp = opener.open(req, timeout=timeout)
    except urllib.error.HTTPError as e:
        resp = e
    except urllib.error.URLError as e:
        reason = getattr(e, "reason", e)
        if isinstance(reason, (socket.timeout, TimeoutError)):
            raise IngestError("TIMEOUT", f"Quá {timeout:g} giây chờ máy chủ") from e
        raise IngestError("NETWORK", f"Không kết nối được: {reason}") from e
    except (socket.timeout, TimeoutError) as e:
        raise IngestError("TIMEOUT", f"Quá {timeout:g} giây chờ máy chủ") from e
    except (OSError, ValueError) as e:
        raise IngestError("NETWORK", f"Lỗi mạng: {e}") from e
    with contextlib.closing(resp):
        status = int(getattr(resp, "status", None) or resp.getcode())
        headers = {k.lower(): v for k, v in resp.headers.items()}
        if not read_body or status in (204, 205, 304) or status >= 300:
            return status, headers, b""
        enc = headers.get("content-encoding", "identity")
        cl = headers.get("content-length")
        if cl and cl.isdigit() and int(cl) > max_bytes:
            raise IngestError("TOO_LARGE", f"Trang {int(cl) // 1024} KB vượt trần {max_bytes // 1024} KB")
        buf = bytearray()
        try:
            while True:
                if time.monotonic() > deadline:
                    raise IngestError("TIMEOUT", "Tải quá lâu (vượt tổng thời gian cho phép)")
                chunk = resp.read(65536)
                if not chunk:
                    break
                buf += chunk
                if len(buf) > max_bytes:
                    raise IngestError("TOO_LARGE", f"Trang vượt trần {max_bytes // 1024} KB")
        except (socket.timeout, TimeoutError) as e:
            raise IngestError("TIMEOUT", f"Quá {timeout:g} giây chờ dữ liệu") from e
        except (OSError, ValueError) as e:
            # IncompleteRead (http.client) là HTTPException→ không phải OSError; bắt riêng bên dưới
            raise IngestError("NETWORK", f"Đọc dữ liệu lỗi: {e}") from e
        except Exception as e:                                         # noqa: BLE001 — http.client.HTTPException
            if isinstance(e, IngestError):
                raise
            raise IngestError("NETWORK", f"Đọc dữ liệu lỗi: {e}") from e
        return status, headers, _inflate(bytes(buf), enc, max_bytes)


def _get_follow(url: str, *, timeout: float, ua: str, max_bytes: int, deadline: float, accept: str, allow_private: bool,
                max_redirects: int, robots: bool, hops: list[str] | None = None) -> tuple[int, dict[str, str], bytes, str]:
    """GET có theo chuyển hướng (tối đa max_redirects), mỗi chặng kiểm máy chủ + (tuỳ chọn) robots. Trả (status, headers, body, final_url)."""
    cur = url
    for _ in range(max_redirects + 1):
        p = urllib.parse.urlsplit(cur)
        port = p.port or (443 if p.scheme == "https" else 80)
        private = _check_host(p.hostname or "", port, allow_private)
        if robots:
            rules = _robots_rules(cur, timeout=timeout, ua=ua, allow_private=allow_private)
            if not rules.allowed(cur):
                raise IngestError("ROBOTS_DISALLOW", f"robots.txt của {p.hostname} không cho robot tải trang này",
                                  hint="Mở bằng trình duyệt, lưu trang (.html) rồi dùng `ingest_file` / `--html`; hoặc chọn nguồn khác.",
                                  url=cur)
        _throttle(p.netloc)
        status, headers, body = _open_once(cur, timeout=timeout, ua=ua, max_bytes=max_bytes, deadline=deadline, accept=accept,
                                           read_body=True, direct=private)
        if status in (301, 302, 303, 307, 308):
            loc = headers.get("location")
            if not loc:
                raise IngestError("HTTP_ERROR", f"HTTP {status} nhưng không có Location", status=status)
            cur = normalize_url(urllib.parse.urljoin(cur, loc))
            if hops is not None:
                hops.append(cur)
            continue
        return status, headers, body, cur
    raise IngestError("TOO_MANY_REDIRECTS", f"Quá {max_redirects} lần chuyển hướng")


def _robots_rules(url: str, *, timeout: float, ua: str, allow_private: bool) -> RobotsRules:
    p = urllib.parse.urlsplit(url)
    origin = f"{p.scheme}://{p.netloc}"
    now = time.monotonic()
    with _NET_LOCK:
        hit = _ROBOTS_CACHE.get(origin)
    if hit and hit[0] > now:
        if isinstance(hit[1], IngestError):
            raise hit[1]
        return hit[1]
    try:
        status, _h, body, _final = _get_follow(origin + "/robots.txt", timeout=timeout, ua=ua, max_bytes=MAX_ROBOTS_BYTES,
                                               deadline=time.monotonic() + timeout * 2, accept="text/plain,*/*;q=0.5",
                                               allow_private=allow_private, max_redirects=MAX_REDIRECTS, robots=False)
        if 200 <= status < 300:
            rules: RobotsRules = RobotsRules(body.decode("utf-8", "replace"), user_agent=ua)
        elif status == 429 or status >= 500:
            raise IngestError("ROBOTS_UNREACHABLE", f"robots.txt của {p.hostname} trả HTTP {status} — theo RFC 9309 coi như CẤM",
                              hint="Thử lại sau, hoặc lưu trang bằng trình duyệt rồi dùng `ingest_file`.", status=status)
        else:
            rules = RobotsRules.allow_all()                              # 4xx (không có robots.txt) ⇒ không giới hạn
    except IngestError as e:
        if e.code in ("TIMEOUT", "NETWORK", "TOO_MANY_REDIRECTS", "TOO_LARGE", "ROBOTS_UNREACHABLE"):
            err = e if e.code == "ROBOTS_UNREACHABLE" else IngestError(
                "ROBOTS_UNREACHABLE", f"Không đọc được robots.txt của {p.hostname} ({e.message}) — coi như CẤM (RFC 9309)",
                hint="Thử lại sau, hoặc lưu trang bằng trình duyệt rồi dùng `ingest_file`.")
            with _NET_LOCK:
                _ROBOTS_CACHE[origin] = (now + ROBOTS_FAIL_TTL_S, err)
            raise err from e
        raise
    with _NET_LOCK:
        _ROBOTS_CACHE[origin] = (now + ROBOTS_TTL_S, rules)
    return rules


_CHARSET_HDR = re.compile(r"charset\s*=\s*[\"']?([\w.\-:]+)", re.I)
_CHARSET_META = re.compile(rb"<meta[^>]+charset\s*=\s*[\"']?\s*([\w.\-:]+)", re.I)
_LATIN_LABELS = {"iso-8859-1", "latin-1", "latin1", "ascii", "us-ascii", "windows-1252", "cp1252"}


def decode_html(body: bytes, content_type: str = "") -> tuple[str, str]:
    """Giải mã byte → str. Thứ tự: BOM → charset khai báo (header, <meta>) → UTF-8 → windows-1258 → cp1252 → latin-1. Trả (text, tên mã dùng)."""
    if body.startswith(b"\xef\xbb\xbf"):
        return body[3:].decode("utf-8", "replace"), "utf-8"
    if body.startswith((b"\xff\xfe", b"\xfe\xff")):
        return body.decode("utf-16", "replace"), "utf-16"
    declared = None
    m = _CHARSET_HDR.search(content_type or "")
    if m:
        declared = m.group(1)
    else:
        m2 = _CHARSET_META.search(body[:6000])
        if m2:
            declared = m2.group(1).decode("ascii", "ignore")
    tries: list[str] = []
    if declared:
        d = declared.strip().lower()
        if d in _LATIN_LABELS:
            tries += ["utf-8", d]                                         # trang khai báo latin-1 nhưng thực tế UTF-8 rất hay gặp
        else:
            tries.append(d)
    tries += ["utf-8", "windows-1258", "cp1252"]
    for enc in tries:
        try:
            return body.decode(enc), enc
        except (UnicodeDecodeError, LookupError):
            continue
    return body.decode("latin-1"), "latin-1"


def fetch(url: str, *, timeout: float = TIMEOUT_S, max_bytes: int = MAX_BYTES, user_agent: str | None = None,
          respect_robots: bool = True, allow_private: bool = False, max_redirects: int = MAX_REDIRECTS,
          total_timeout: float | None = None) -> dict:
    """Tải MỘT trang HTML công khai. Ném IngestError(code, message, hint).

    Trả {url, final_url, status, content_type, encoding, bytes, sha256, fetched_at, elapsed_s, redirects[], headers{…}, text}.
    respect_robots=True là mặc định và là cách dùng bình thường; tắt chỉ dành cho test trên máy cục bộ."""
    ua = user_agent or USER_AGENT
    target = normalize_url(url)
    t0 = time.monotonic()
    deadline = t0 + (total_timeout if total_timeout else max(timeout * 2, timeout + 5))
    hops: list[str] = []
    status, headers, body, final = _get_follow(
        target, timeout=timeout, ua=ua, max_bytes=max_bytes, deadline=deadline, allow_private=allow_private,
        accept="text/html,application/xhtml+xml;q=0.9,*/*;q=0.2", max_redirects=max_redirects, robots=respect_robots, hops=hops)
    if not (200 <= status < 300) or status in (204, 205):
        raise IngestError("HTTP_ERROR", f"Máy chủ trả HTTP {status}", status=status, url=final,
                          hint=("Trang chặn robot — mở bằng trình duyệt, lưu .html rồi dùng `ingest_file`." if status in (401, 403, 429) else None))
    ctype = headers.get("content-type", "")
    head = body[:2048].lower()
    if ctype:
        base = ctype.split(";")[0].strip().lower()
        if base not in ("text/html", "application/xhtml+xml") and not (base in ("text/plain", "application/octet-stream") and b"<html" in head):
            raise IngestError("NOT_HTML", f"Không phải trang HTML (Content-Type: {base})", url=final)
    elif b"<html" not in head and b"<!doctype" not in head and b"<body" not in head:
        raise IngestError("NOT_HTML", "Không nhận ra là trang HTML", url=final)
    text, enc = decode_html(body, ctype)
    return {
        "url": target, "final_url": final, "status": status, "content_type": ctype, "encoding": enc, "bytes": len(body),
        "sha256": sha256_hex(body), "fetched_at": now_iso(), "elapsed_s": round(time.monotonic() - t0, 3), "redirects": hops,
        "robots_checked": bool(respect_robots), "user_agent": ua,
        "headers": {k: headers[k] for k in ("last-modified", "etag", "x-robots-tag", "content-language") if k in headers},
        "text": text,
    }


# ═════════════════════════════════════ trích bài (readability-style) ═════════════════════════════════════

KNOWN_SOURCES: dict[str, str] = {
    "vnexpress.net": "VnExpress", "dantri.com.vn": "Dân trí", "tuoitre.vn": "Tuổi Trẻ", "thanhnien.vn": "Thanh Niên",
    "vietnamnet.vn": "VietNamNet", "baogiaothong.vn": "Báo Giao thông", "znews.vn": "Znews", "zingnews.vn": "Znews",
    "laodong.vn": "Lao Động", "nld.com.vn": "Người Lao Động", "tienphong.vn": "Tiền Phong", "vov.vn": "VOV",
    "vtv.vn": "VTV", "vneconomy.vn": "VnEconomy", "cafef.vn": "CafeF", "kenh14.vn": "Kênh14", "soha.vn": "Soha",
    "autopro.com.vn": "AutoPro", "oto-xemay.vn": "Ô tô - Xe máy", "otofun.net": "Otofun", "baophapluat.vn": "Báo Pháp luật",
    "nhandan.vn": "Nhân Dân", "plo.vn": "Pháp Luật TP.HCM", "congly.vn": "Công lý", "baochinhphu.vn": "Báo Chính phủ",
    "reuters.com": "Reuters", "bloomberg.com": "Bloomberg", "carscoops.com": "Carscoops", "autoblog.com": "Autoblog",
}
_SEP_TITLE = (" | ", " - ", " – ", " — ", " :: ", " » ")
_INLINE = {"span", "a", "strong", "b", "em", "i", "u", "small", "time", "label", "font", "mark", "sup", "sub"}
_CAPTION_CLASSES = {"image", "caption", "figcaption", "photo-caption", "img-caption", "pic-caption", "imgcap", "note-img", "desc-img",
                    "description-img", "cms-caption", "tplcaption", "photo_note", "photo-note", "photocms_caption", "photocms_author",
                    "photo-author", "image-caption", "caption-text", "pcaption", "nd-caption"}
_SAPO_CLASS = re.compile(r"sapo|(^|[\s_-])description($|[\s_-])|(^|[\s_-])lead($|[\s_-])|sub-?title|abstract", re.I)
_UNLIKELY = re.compile(
    r"comment|disqus|sidebar|side-bar|related|share|sharing|social|advert|banner|(^|[\s_-])ads?($|[\s_-]|\d)|sponsor|promo|(^|[\s_-])menu|"
    r"footer|popup|modal|newsletter|subscribe|breadcrumb|widget|recommend|trending|most-?read|cookie|taboola|outbrain|toolbar|pagination|"
    r"paging|hot-?news|tin-?lien-?quan|bai-?viet-?lien-?quan|rating|(^|[\s_-])vote|login|signin|author-?box|authorbox|tags?-?(list|box|cloud)|"
    r"(^|[\s_-])tags?($|[\s_-])|keyword|zoom-?font|back-?to-?top|read-?more|more-?news|box-?(news|video)|player", re.I)
_UNLIKELY_TYPE = re.compile(r"related|banner|advert|poll|social|embed|facebook|twitter|tiktok|newsletter|videoplayer", re.I)   # thuộc tính type="RelatedOneNews" (Tuổi Trẻ…)
_OKMAYBE = re.compile(r"article-?body|articlebody|article__body|article-content|content-detail|detail-content|detail__content|detail-body|post-?content|"
                      r"entry-?content|main-?content|maincontent|fck_detail|body-?content|story-?body|singular-content|news-?content|cmain", re.I)
_BOILER = re.compile(
    r"^(xem thêm|đọc thêm|xem tiếp|tin liên quan|bài liên quan|bài viết liên quan|có thể bạn quan tâm|mời (bạn |quý )?(đọc|độc giả|xem)|"
    r"theo dõi (chúng tôi|kênh|fanpage|trang)|quảng cáo|nguồn ?:|ảnh ?:|ảnh minh họa|ảnh minh hoạ|video ?:|clip ?:|>>|bạn (có )?góc nhìn|"
    r"bạn đọc (có thể )?(gửi|chia sẻ)|hãy chia sẻ|chia sẻ ý kiến|đăng ký (nhận|kênh)|nhấn (vào|để)|tags? ?:|từ khóa|từ khoá|bình luận|bản quyền|"
    r"liên hệ|hotline|email ?:|zalo|đọc bài gốc|link bài gốc|(\(?)xem (video|clip|ảnh))", re.I)
_CREDIT_LINE = re.compile(r"^\(?\s*(theo|nguồn|ảnh|video|clip|tổng hợp)\b[^.!?]{0,60}\)?$", re.I)
_END_PUNCT = tuple(".!?…:;”\"»)")
_NOAI = re.compile(r"\bno-?(ai|imageai|train|tdm)\b", re.I)
_INJECTION = re.compile(
    r"ignore (all |any )?(the )?(previous|prior|above) (instructions|prompts)|disregard (the |all )?(previous|above|prior)|system prompt|"
    r"you are (now )?(a|an|the) |as an ai (language )?model|<\|im_start\||\bassistant\s*:|\btool_call\b|run the following command|"
    r"bỏ qua (mọi |tất cả |các )?(hướng dẫn|chỉ dẫn|lệnh|yêu cầu)|hãy bỏ qua|bạn là (một )?(trợ lý|ai\b|chatgpt|claude)|"
    r"chạy (lệnh|đoạn mã) sau|in ra (toàn bộ )?(prompt|chỉ dẫn)", re.I)
_ACCIDENT = re.compile(
    r"tai nạn|vụ va chạm|va chạm (giao thông|liên hoàn|mạnh)|đâm vào|lao vào (nhau|xe|cột|dải|đầu)|lao thẳng|lao xuống|tông vào|tông thẳng|tử vong|"
    r"thiệt mạng|thương vong|nạn nhân|bốc cháy|cháy xe|cháy nổ|bị thương|cứu hộ|hiện trường|mất tích|qua đời|tử nạn|lật xe|cấp cứu|"
    r"bỏ trốn|đuối nước|cháy rụi|cháy trụi|vụ cháy|đám cháy|hỏa hoạn|hoả hoạn|thiêu rụi|cháy lan|xe cháy|ô tô cháy|bùng cháy|phát hỏa|chập cháy", re.I)
_LEGAL = re.compile(r"khởi tố|bắt tạm giam|bị bắt|lừa đảo|gian lận|vụ án|tòa án|xét xử|truy tố|buộc tội|tố cáo|bồi thường|khởi kiện|vụ kiện|bị kiện|kiện ra|tranh chấp|"
                    r"triệu hồi|lỗi nghiêm trọng|thu hồi", re.I)


def _is_el(n: Any) -> bool:
    return isinstance(getattr(n, "tag", None), str)


def _etext(el: Any) -> str:
    """Văn bản phần tử: bỏ script/style, <br> → cách, và chèn dấu cách ở ranh giới phần tử khi chữ thường dính chữ HOA ('Đồng NaiỞ')."""
    parts: list[str] = []

    def add(s: str | None, boundary: bool = False) -> None:
        if not s:
            return
        if boundary and parts and parts[-1] and s[0].isupper() and parts[-1][-1].islower():
            parts.append(" ")
        parts.append(s)

    def walk(n: Any) -> None:
        if not _is_el(n) or n.tag in ("script", "style", "noscript", "template"):
            return
        if n.tag == "br":
            parts.append(" ")
        add(n.text)
        for c in n:
            walk(c)
            add(c.tail, boundary=_is_el(c) and c.tag in _INLINE)

    walk(el)
    return clean("".join(parts))


def _cls(el: Any) -> str:
    return ((el.get("class") or "") + " " + (el.get("id") or "")).strip()


def _tokens(el: Any) -> set[str]:
    return set((el.get("class") or "").lower().split())


def _link_density(el: Any, text_len: int) -> float:
    if text_len <= 0:
        return 1.0
    return min(1.0, sum(len(_etext(a)) for a in el.iter("a")) / text_len)


def _in_caption(el: Any, stop: Any = None) -> bool:
    n = el
    while n is not None and n is not stop:
        if _is_el(n):
            if n.tag in ("figure", "figcaption", "caption"):
                return True
            if _tokens(n) & _CAPTION_CLASSES:
                return True
        n = n.getparent()
    return False


def _parse_doc(html: str):
    import lxml.html
    from lxml import etree
    if not html or not html.strip():
        raise IngestError("NO_ARTICLE", "Dữ liệu HTML rỗng hoặc không có nội dung", hint="Kiểm tra lại tệp hoặc URL nguồn.")
    html = html.replace("\x00", "")
    html = re.sub(r"^\s*<\?xml[^>]*\?>", "", html)
    try:
        return lxml.html.document_fromstring(html)
    except (ValueError, etree.ParserError, etree.XMLSyntaxError):
        try:
            parser = lxml.html.HTMLParser(encoding="utf-8", recover=True)
            return lxml.html.document_fromstring(html.encode("utf-8", "replace"), parser=parser)
        except (ValueError, etree.ParserError, etree.XMLSyntaxError) as e2:
            raise IngestError("NO_ARTICLE", f"Không thể phân tích cú pháp HTML: {e2}", hint="Tệp HTML có thể bị hỏng hoặc rỗng.") from e2


def _collect_meta(doc: Any) -> dict[str, list[str]]:
    m: dict[str, list[str]] = {}
    for el in doc.xpath("//meta"):
        key = (el.get("property") or el.get("name") or el.get("itemprop") or el.get("http-equiv") or "").strip().lower()
        val = el.get("content")
        if key and val is not None and clean(val):
            m.setdefault(key, []).append(clean(val))
    return m


def _mget(m: dict[str, list[str]], *keys: str) -> str | None:
    for k in keys:
        v = m.get(k.lower())
        if v:
            return v[0]
    return None


def _walk_ld(obj: Any, out: list[dict]) -> None:
    if isinstance(obj, list):
        for x in obj:
            _walk_ld(x, out)
    elif isinstance(obj, dict):
        if "@type" in obj:
            out.append(obj)
        for k in ("@graph", "mainEntity", "itemListElement"):
            if k in obj:
                _walk_ld(obj[k], out)


def _jsonld(doc: Any) -> list[dict]:
    out: list[dict] = []
    for s in doc.xpath("//script[contains(translate(@type,'LDJSON','ldjson'),'ld+json')]"):
        txt = (s.text or "").strip()
        if not txt:
            continue
        for cand in (txt, _html.unescape(txt), re.sub(r",\s*([}\]])", r"\1", txt)):
            try:
                _walk_ld(json.loads(cand, strict=False), out)
                break
            except (ValueError, TypeError):
                continue
    return out


def _ld_types(o: dict) -> list[str]:
    t = o.get("@type")
    return [str(x) for x in (t if isinstance(t, list) else [t])]


def _ld_pick(nodes: list[dict]) -> dict:
    for o in nodes:
        if any(t.endswith("Article") or t in ("Report", "BlogPosting") for t in _ld_types(o)):
            return o
    for o in nodes:
        if any(t in ("WebPage", "ItemPage") for t in _ld_types(o)):
            return o
    return {}


def _ld_name(v: Any) -> str | None:
    if isinstance(v, str):
        return clean(v) or None
    if isinstance(v, dict):
        return _ld_name(v.get("name"))
    if isinstance(v, list):
        names = [n for n in (_ld_name(x) for x in v) if n]
        return ", ".join(dict.fromkeys(names)) or None
    return None


def _ld_image(v: Any) -> str | None:
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get("url") or v.get("contentUrl")
    if isinstance(v, list) and v:
        return _ld_image(v[0])
    return None


# ── ngày giờ ──

def _tz_from(text: str) -> timezone | None:
    m = re.search(r"(?:GMT|UTC)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?", text, re.I)
    if m:
        sign = -1 if m.group(1) == "-" else 1
        return timezone(sign * timedelta(hours=int(m.group(2)), minutes=int(m.group(3) or 0)))
    return None


def _mk_dt(y: int, mo: int, d: int, h: int = 0, mi: int = 0, s: int = 0, tz: timezone | None = None,
           now: datetime | None = None) -> datetime | None:
    now = now or datetime.now(timezone.utc)
    if not (1995 <= y <= now.year + 1):
        return None
    try:
        return datetime(y, mo, d, h, mi, s, tzinfo=tz or VN_TZ)
    except ValueError:
        return None


def parse_datetime(s: Any, now: datetime | None = None) -> str | None:
    """ISO 8601 (có múi giờ; thiếu thì +07:00) từ chuỗi ISO hoặc định dạng báo VN: 'Thứ năm, 8/10/2026, 15:55 (GMT+7)', '07/10/2026 11:57', '15:30 - 08/10/2026'."""
    t = clean(s)
    if not t:
        return None
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?)?", t)
    if m:
        tz = None
        if m.group(7):
            z = m.group(7)
            if z == "Z":
                tz = timezone.utc
            else:
                sign = -1 if z[0] == "-" else 1
                zz = z[1:].replace(":", "")
                tz = timezone(sign * timedelta(hours=int(zz[:2]), minutes=int(zz[2:] or 0)))
        dt = _mk_dt(int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4) or 0), int(m.group(5) or 0), int(m.group(6) or 0), tz, now)
        return dt.isoformat(timespec="seconds") if dt else None
    tz = _tz_from(t)
    m = re.search(r"(\d{1,2})\s*(?:[:h]|giờ)\s*(\d{2})\D{1,16}?(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})", t)      # giờ trước ngày
    if m:
        dt = _mk_dt(int(m.group(5)), int(m.group(4)), int(m.group(3)), int(m.group(1)), int(m.group(2)), 0, tz, now)
        return dt.isoformat(timespec="seconds") if dt else None
    m = re.search(r"(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\D{1,16}?(\d{1,2})\s*(?:[:h]|giờ)\s*(\d{2}))?", t)    # ngày rồi giờ
    if m:
        dt = _mk_dt(int(m.group(3)), int(m.group(2)), int(m.group(1)), int(m.group(4) or 0), int(m.group(5) or 0), 0, tz, now)
        return dt.isoformat(timespec="seconds") if dt else None
    return None


def _age_days(iso: str | None, now: datetime | None = None) -> float | None:
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso)
    except ValueError:
        return None
    now = now or datetime.now(timezone.utc)
    return round(max(0.0, (now - dt).total_seconds() / 86400.0), 2)


# ── tiêu đề / nguồn ──

def domain_of(url: str | None) -> str:
    if not url:
        return ""
    h = (urllib.parse.urlsplit(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def source_name(domain: str, site_name: str | None = None, publisher: str | None = None) -> str:
    """Tên ngắn dùng để ghi 'Nguồn: …'. Ưu tiên bảng báo quen thuộc (khớp cả tên miền con), rồi og:site_name/publisher, rồi tên miền."""
    d = domain
    while d:
        if d in KNOWN_SOURCES:
            return KNOWN_SOURCES[d]
        d = d.split(".", 1)[1] if "." in d else ""
    for cand in (publisher, site_name):
        c = clean(cand or "")
        if c and "." not in c.replace(" ", ""):
            return re.sub(r"^(báo|trang tin|tạp chí)\s+(điện tử\s+)?", "", c, flags=re.I).strip() or c
    parts = domain.split(".")
    stem = parts[-3] if len(parts) >= 3 and parts[-2] in ("com", "net", "org", "gov", "edu") else (parts[-2] if len(parts) >= 2 else domain)
    return stem.capitalize() if stem else (clean(site_name or "") or "Nguồn không rõ")


def _clean_title(t: str, src: str, site_name: str | None) -> str:
    t = clean(t)
    sites = {fold(x) for x in (src, site_name or "", "báo " + src) if x}
    for sep in _SEP_TITLE:
        if sep in t:
            head, tail = t.rsplit(sep, 1)
            ft = fold(tail)
            if head and (ft in sites or any(ft.endswith(s) or s.endswith(ft) for s in sites if len(s) > 3) or ft.startswith("bao ")):
                t = head
    return t.strip(" -–—|:")


def _find_author(doc: Any, meta: dict, ld: dict, src: str) -> str | None:
    cands: list[str | None] = [_ld_name(ld.get("author")), _mget(meta, "article:author"), _mget(meta, "author"), _mget(meta, "dc.creator"),
                               _mget(meta, "byl")]
    for xp in ("//*[@itemprop='author']", "//*[@data-role='author']//a[contains(@class,'name')]", "//*[contains(@class,'author-name')]",
               "//*[contains(@class,'name-author')]", "//*[contains(@class,'article-detail-author__main')]", "//a[@rel='author']",
               "//*[contains(@class,'byline')]", "//*[contains(@class,'detail-author')]//a[contains(@class,'name')]", "//*[@class='author']"):
        for el in doc.xpath(xp)[:2]:
            cands.append(_etext(el))
    sf = {fold(src), fold("báo " + src), "vnexpress", "vnexpress.net"}
    for c in cands:
        c = clean(c or "")
        if not c or c.startswith(("http://", "https://")) or "@" in c or len(c) > 60:
            continue
        c = re.sub(r"^(bởi|by|tác giả|text|ảnh)\s*:?\s+", "", c, flags=re.I).strip(" -–—|:")
        if c.isupper():
            c = c.title()                                  # 'MINH SƠN' → 'Minh Sơn'
        fc = fold(c)
        if fc in sf or "." in fc.replace(" ", "") or "tong hop" in fc or "ban bien tap" in fc or len(c.split()) > 6:
            continue
        return c
    return None


# ── lead (sapo) ──

def _find_lead(doc: Any, meta: dict, ld: dict) -> tuple[str | None, str | None]:
    desc = _mget(meta, "og:description", "twitter:description") or clean(ld.get("description") or "") or None
    cands: list[Any] = []
    for el in doc.xpath("//p | //div | //h2 | //h3 | //span"):
        if _SAPO_CLASS.search(el.get("class") or "") and not el.xpath("ancestor::article/ancestor::article"):
            cands.append(el)
        if len(cands) > 40:
            break
    best = None
    fd = fold(desc or "")[:48]
    for el in cands:
        t = _etext(el)
        if not (40 <= len(t) <= 700):
            continue
        if fd and fold(t)[:48] == fd:
            return t, "dom"
        if best is None and (len(el.xpath(".//p | .//div")) <= 1 or el.tag == "p"):
            best = t
    if best:
        return best, "dom"
    if desc:
        desc = _LEAD_PREFIX.sub("", desc)                # '(Dân trí) - …' là nhãn báo, không phải nội dung
        if 40 <= len(desc) <= 700:
            return desc, "meta"
    return None, None


# ── khối nội dung ──

def _drop(el: Any) -> None:
    try:
        el.drop_tree()
    except Exception:                                   # noqa: BLE001
        par = el.getparent()
        if par is not None:
            par.remove(el)


def _clean_tree(doc: Any) -> None:
    for el in doc.xpath("//script|//style|//noscript|//template|//iframe|//svg|//canvas|//form|//button|//select|//textarea|//object|//embed|"
                        "//video|//audio|//nav|//footer|//aside|//dialog|//link|//source"):
        _drop(el)
    for el in doc.xpath("//*[@hidden or @aria-hidden='true' or contains(translate(@style,' ',''),'display:none')]"):
        if el.getparent() is not None and el.tag not in ("html", "body"):
            _drop(el)
    for el in list(doc.iter()):
        if not _is_el(el) or el.getparent() is None or el.tag in ("html", "body", "article", "main", "head"):
            continue
        if _UNLIKELY_TYPE.search(el.get("type") or "") and el.tag in ("div", "section", "figure", "aside", "span"):
            _drop(el)
            continue
        c = _cls(el)
        if not c or not _UNLIKELY.search(c) or _OKMAYBE.search(c):
            continue
        long_ps = sum(1 for p in el.iter("p") if len(_etext(p)) >= 80)
        if long_ps >= 3:
            continue
        _drop(el)


def _score_children(root: Any) -> dict[Any, float]:
    scores: dict[Any, float] = {}
    for p in root.iter("p"):
        if _in_caption(p):
            continue
        t = _etext(p)
        n = len(t)
        if n < 25:
            continue
        s = 1.0 + t.count(",") + min(n / 100.0, 3.0)
        parent = p.getparent()
        if parent is None:
            continue
        scores[parent] = scores.get(parent, 0.0) + s
        gp = parent.getparent()
        if gp is not None:
            scores[gp] = scores.get(gp, 0.0) + s / 2.0
    for el in list(scores):
        c = _cls(el)
        bonus = 0.0
        if _OKMAYBE.search(c):
            bonus += 25.0
        if (el.get("itemprop") or "").lower() == "articlebody":
            bonus += 50.0
        n = len(_etext(el))
        scores[el] = (scores[el] + bonus) * (1.0 - _link_density(el, n))
    return scores


def _blocks(container: Any, title: str) -> tuple[list[dict], list[str]]:
    """Duyệt khối văn bản trong container theo thứ tự tài liệu → ([{kind,text,right,bold,links}], captions)."""
    for nested in container.xpath(".//article"):
        if nested is not container:
            _drop(nested)
    out: list[dict] = []
    caps: list[str] = []
    seen: set[str] = set()
    ft = fold(title)
    for el in container.xpath(".//p | .//h2 | .//h3 | .//h4 | .//li | .//blockquote | .//tr"):
        tag = el.tag
        if tag in ("li", "blockquote") and el.xpath(".//p"):
            continue
        if tag == "tr":
            tbl = next((a for a in el.iterancestors("table")), None)
            if tbl is None or tbl.xpath(".//p | .//img") or len(tbl.xpath(".//tr")) < 2 or tbl.xpath(".//table"):
                continue
            cells = [_etext(c) for c in el.xpath("./td | ./th")]
            text = " | ".join(c for c in cells if c)
            if len([c for c in cells if c]) < 2:
                continue
            rows = tbl.xpath(".//tr")
            is_head = (bool(el.xpath("./th")) and not el.xpath("./td")) or (
                rows[0] is el and len(rows) >= 3 and not re.search(r"\d", text) and any(re.search(r"\d", r.text_content() or "") for r in rows[1:]))
        else:
            text = _etext(el)
            is_head = False
        if not text:
            continue
        if _in_caption(el, container):
            if len(text) >= 8 and tag != "tr":
                caps.append(text)
            continue
        if tag == "p" and el.xpath("ancestor::blockquote[1]"):
            kind = "quote"
        elif tag in ("h2", "h3", "h4"):
            kind = "h"
        elif tag == "li":
            kind = "li"
        elif tag == "tr":
            kind = "tablehead" if is_head else "table"
        elif tag == "blockquote":
            kind = "quote"
        else:
            kind = "p"
        style = (el.get("style") or "").replace(" ", "").lower()
        bold_len = sum(len(_etext(b)) for b in el.xpath("./strong | ./b | ./*/strong | ./*/b"))
        key = fold(text)
        if key in seen or key == ft:
            continue
        seen.add(key)
        out.append({"kind": kind, "text": text, "right": "text-align:right" in style, "bold": bold_len >= 0.85 * len(text) and len(text) > 0,
                    "links": _link_density(el, len(text))})
    return out, caps


def _is_heading_like(b: dict) -> bool:
    t = b["text"]
    n = len(t.split())
    if b["kind"] != "p":
        return False
    if b["bold"] and n <= 14 and not t.endswith((".", "…")):
        return True
    return n <= 9 and len(t) <= 70 and not t.endswith(_END_PUNCT) and not re.search(r"\d{2,}", t) and t[:1].isupper() and "," not in t


def _finish_blocks(blocks: list[dict], title: str, lead: str | None) -> tuple[list[dict], dict]:
    extra: dict[str, Any] = {}
    kept: list[dict] = []
    for b in blocks:
        t = b["text"]
        if b["kind"] in ("p", "li") and (_BOILER.search(t) or (b["links"] > 0.6 and len(t) < 160)):
            continue
        kept.append(b)
    # chữ ký tác giả / dòng "Theo …" ở cuối bài
    while kept:
        b = kept[-1]
        t = b["text"]
        nwords = len(t.split())
        if b["right"] and nwords <= 6 and b["kind"] == "p":
            extra["author_sign"] = t.strip(" -–—*")
            kept.pop()
        elif b["kind"] == "p" and _CREDIT_LINE.match(t) and nwords <= 12:
            extra.setdefault("upstream_credit", t.strip("() "))
            kept.pop()
        elif b["kind"] == "p" and nwords <= 4 and b["bold"] and not re.search(r"\d", t) and t[:1].isupper() and "author_sign" not in extra:
            extra["author_sign"] = t.strip(" -–—*")
            kept.pop()
        else:
            break
    paras: list[dict] = []
    fl = fold(lead or "")
    for b in kept:
        kind = "h" if _is_heading_like(b) else b["kind"]
        if lead and kind == "p" and fold(b["text"]) == fl:
            continue
        paras.append({"kind": kind, "text": b["text"]})
    return paras, extra


def extract_body(doc: Any, title: str, lead: str | None, ld_body: str | None = None) -> tuple[list[dict], list[str], dict, str]:
    """Chọn khối nội dung chính (SỬA doc tại chỗ — truyền bản sao). Trả (paragraphs[{kind,text}], captions, extra{author_sign, upstream_credit}, method)."""
    _clean_tree(doc)
    root = doc.find("body")
    if root is None:
        root = doc
    scores = _score_children(root)
    method = "scored"
    blocks: list[dict] = []
    caps: list[str] = []
    if scores:
        best = max(scores, key=lambda e: scores[e])
        top = scores[best]
        chosen = [best]
        par = best.getparent()
        if par is not None:
            kids = [k for k in par.iterchildren() if _is_el(k)]
            for sib in kids:
                if sib is not best and scores.get(sib, 0.0) >= max(12.0, 0.25 * top):
                    chosen.append(sib)
            chosen.sort(key=lambda e: kids.index(e) if e in kids else 0)
        for c in chosen:
            b, cp = _blocks(c, title)
            blocks += b
            caps += cp
    paras, extra = _finish_blocks(blocks, title, lead)
    if sum(len(p["text"]) for p in paras) < 250:
        if ld_body and len(ld_body) >= 250:
            method = "jsonld"
            paras = [{"kind": "p", "text": clean(x)} for x in re.split(r"[\r\n]+", ld_body) if len(clean(x)) >= 3]
        else:
            method = "all-paragraphs"
            b, cp = _blocks(root, title)
            paras, extra2 = _finish_blocks([x for x in b if len(x["text"]) >= 40 or x["kind"] == "h"], title, lead)
            extra = extra or extra2
            caps = caps or cp
    return paras, caps, extra, method


def _int_or_none(v: Any) -> int | None:
    try:
        return int(str(v))
    except (TypeError, ValueError):
        return None


def _find_image(doc: Any, meta: dict, ld: dict, base: str | None, source: str, caps: list[str]) -> dict | None:
    url = _mget(meta, "og:image", "og:image:url", "twitter:image", "twitter:image:src") or _ld_image(ld.get("image")) or _ld_image(ld.get("thumbnailUrl"))
    if not url:
        for img in doc.xpath("//article//img | //main//img | //img"):
            src = img.get("data-src") or img.get("data-original") or img.get("src") or ""
            if src and not src.startswith("data:") and not re.search(r"logo|icon|avatar|sprite|pixel|tracking|1x1", src, re.I):
                url = src
                break
    if not url:
        return None
    if base:
        url = urllib.parse.urljoin(base, url)
    if not url.lower().startswith(("http://", "https://")):
        return None
    credit = next((c["credit"] for c in caps if c.get("credit")), None)
    return {
        "url": url, "width": _int_or_none(_mget(meta, "og:image:width")), "height": _int_or_none(_mget(meta, "og:image:height")),
        "alt": _mget(meta, "og:image:alt", "twitter:image:alt"), "caption": caps[0]["text"] if caps else None, "credit": credit, "downloaded": False,
        "rights_warning": IMAGE_WARNING.format(who=(credit or source or "chủ bài viết")),
    }


_CAP_CREDIT = (
    re.compile(r"\s*[-–—]\s*(?:ảnh|photo|nguồn|đồ họa|đồ hoạ|clip)\s*[:：]\s*([^()]{2,60}?)\s*\.?\s*$", re.I),
    re.compile(r"\s*\(\s*(?:ảnh|photo|nguồn|đồ họa|đồ hoạ)\s*[:：]\s*([^()]{2,60}?)\s*\)\s*\.?\s*$", re.I),
    re.compile(r"\s+(?:ảnh|photo)\s*[:：]\s*([^()]{2,60}?)\s*\.?\s*$", re.I),
)


def split_caption(text: str) -> tuple[str, str | None]:
    """'Nội thất tối giản - Ảnh: LINH ĐAN' → ('Nội thất tối giản.', 'Linh Đan'); không có ghi công → (text, None)."""
    t = clean(text)
    for rx in _CAP_CREDIT:
        m = rx.search(t)
        if m:
            who = m.group(1).strip(" .,;")
            if who.isupper():
                who = who.title()
            body = t[:m.start()].rstrip(" -–—,;")
            if body and body[-1] not in ".!?…":
                body += "."
            return body, who or None
    return t, None


_LEAD_PREFIX = re.compile(r"^(?:\(\s*[^()]{2,30}\)\s*[-–—:]\s*|[A-ZÀ-ỸĐ]{2,12}(?: [A-ZÀ-ỸĐ]{2,12}){0,2}[-–—]\s+)")   # '(Dân trí) - ', 'MỸ- '


def _vi_ratio(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    vi = sum(1 for c in letters if c in "đĐ" or unicodedata.normalize("NFD", c)[1:2] != "")
    return vi / len(letters)


def _strip_stamps(doc: Any) -> str | None:
    """Bỏ nhãn địa điểm (span.location-stamp: 'Đồng Nai') khỏi chữ; trả dateline."""
    dateline = None
    for el in doc.xpath("//*[contains(@class,'location-stamp') or contains(@class,'dateline')]"):
        dateline = dateline or (_etext(el) or None)
        _drop(el)
    return dateline


def parse_html(html: str, url: str | None = None, *, fetched_at: str | None = None, headers: dict | None = None,
               now: datetime | None = None) -> dict:
    """HTML → bài đã trích (dict, schema studio.news-article/1). Không ném lỗi vì bài xấu — xem `ok` + `warnings`."""
    doc = _parse_doc(html)
    body_doc = _parse_doc(html)
    dateline = _strip_stamps(doc)
    _strip_stamps(body_doc)
    meta = _collect_meta(doc)
    ldn = _jsonld(doc)
    ld = _ld_pick(ldn)
    canonical = None
    for el in doc.xpath("//link[@rel='canonical']"):
        canonical = el.get("href")
        break
    base = url or canonical or _mget(meta, "og:url")
    dom = domain_of(url or canonical or base)
    org = next((o for o in ldn if any(t.endswith("Organization") for t in _ld_types(o))), {})
    publisher = _ld_name(ld.get("publisher")) or _ld_name(org)
    site_name = _mget(meta, "og:site_name", "application-name")
    src = source_name(dom, site_name, publisher)

    h1 = next((_etext(h) for h in doc.xpath("//h1") if len(_etext(h)) >= 8), None)
    title_raw = _mget(meta, "og:title", "twitter:title") or h1 or clean(ld.get("headline") or "") or clean("".join(doc.xpath("//title/text()")))
    title = _clean_title(title_raw, src, site_name)

    lead, lead_src = _find_lead(doc, meta, ld)
    if lead:
        lead = _LEAD_PREFIX.sub("", lead).strip() or lead
    published = parse_datetime(clean(ld.get("datePublished") or "")) or parse_datetime(
        _mget(meta, "article:published_time", "og:article:published_time", "datepublished", "pubdate", "publishdate", "publish-date", "date",
              "dc.date", "dc.date.issued", "parsely-pub-date", "sailthru.date"))
    if not published:
        for el in doc.xpath("//time[@datetime]"):
            published = parse_datetime(el.get("datetime"))
            if published:
                break
    if not published:
        for el in doc.xpath("//*[contains(@class,'date') or contains(@class,'time') or contains(@class,'publish') or contains(@class,'pubdate')]")[:25]:
            published = parse_datetime(_etext(el)[:120])
            if published:
                break
    modified = parse_datetime(clean(ld.get("dateModified") or "")) or parse_datetime(_mget(meta, "article:modified_time", "og:updated_time", "datemodified", "lastmod"))

    author = _find_author(doc, meta, ld, src)
    section = _mget(meta, "article:section", "articlesection") or (ld.get("articleSection") if isinstance(ld.get("articleSection"), str) else None)
    kws = [k.strip() for k in (_mget(meta, "news_keywords", "keywords") or "").split(",") if k.strip()][:12]

    robots_meta = ",".join(meta.get("robots", []) + meta.get("googlebot", []) + meta.get("ai-content", []))
    xrt = (headers or {}).get("x-robots-tag", "")
    allrob = f"{robots_meta},{xrt}".lower()
    paywall = str(ld.get("isAccessibleForFree", "")).lower() == "false"
    restrictions = {"robots_meta": robots_meta or None, "x_robots_tag": xrt or None,
                    "noai": bool(_NOAI.search(allrob)), "noindex": "noindex" in allrob, "noarchive": "noarchive" in allrob,
                    "noimageai": "noimageai" in allrob, "paywall": paywall}

    ld_body = ld.get("articleBody") if isinstance(ld.get("articleBody"), str) else None
    paras, caps_raw, extra, method = extract_body(body_doc, title, lead, ld_body)
    caps: list[dict] = []
    seen_caps: set[str] = set()
    for c in caps_raw:
        ctext, ccredit = split_caption(c)
        if ctext and fold(ctext) not in seen_caps:
            seen_caps.add(fold(ctext))
            caps.append({"text": ctext, "credit": ccredit})
    img = _find_image(doc, meta, ld, base, src, caps)
    author = author or extra.get("author_sign")

    plist: list[dict] = []
    if lead:
        plist.append({"kind": "lead", "text": lead})
    plist += paras
    text_parts: list[str] = []
    pos = 0
    for i, p in enumerate(plist, 1):
        p["i"] = i
        p["start"] = pos
        text_parts.append(p["text"])
        pos += len(p["text"]) + 2
    text = "\n\n".join(text_parts)

    now = now or datetime.now(timezone.utc)
    age = _age_days(published, now)
    warnings: list[str] = []
    body_chars = sum(len(p["text"]) for p in plist if p["kind"] in ("p", "lead", "li", "quote", "table"))
    cap_chars = sum(len(c["text"]) for c in caps)
    ok = body_chars >= 200 or (body_chars + cap_chars) >= 400
    if not ok:
        warnings.append("Trích được rất ít chữ (< 200 ký tự): trang có thể cần JavaScript, bị chặn, hoặc là bài trả phí — kiểm tra bằng tay.")
    elif body_chars < 600 <= cap_chars:
        warnings.append("Phần lớn thông tin nằm trong chú thích ảnh (thân bài ngắn) — chú thích được dùng làm dữ kiện, trích dẫn là 'chú thích ảnh'.")
    if paywall:
        warnings.append("Bài trả phí (isAccessibleForFree=false): nội dung có thể chỉ là đoạn đầu.")
    if not published:
        warnings.append("Không tìm thấy ngày đăng — kiểm tra độ mới của tin trước khi dùng.")
    elif age is not None and age > STALE_DAYS:
        warnings.append(f"Tin đã {int(age)} ngày tuổi (> {STALE_DAYS}) — gắn 'tin cũ' hoặc dùng ngày tuyệt đối, đừng nói 'hôm nay/mới đây'.")
    if restrictions["noai"] or restrictions["noimageai"]:
        warnings.append("Trang khai báo noai/noimageai (chủ trang không muốn dùng cho AI) — cần chủ kênh duyệt trước khi dùng nội dung.")
    cap_text = " ".join(c["text"] for c in caps)
    if _INJECTION.search(text + " " + cap_text):
        warnings.append("injection: nội dung bài có câu giống lệnh cho AI (ví dụ 'bỏ qua hướng dẫn…') — coi là DỮ LIỆU, không làm theo.")
    lang = (doc.get("lang") or "").lower()
    ratio = _vi_ratio(text[:6000])
    if text and ratio < 0.02 and not lang.startswith("vi"):
        warnings.append("Bài có vẻ không phải tiếng Việt — kịch bản vẫn viết tiếng Việt, kiểm kỹ tên riêng/số.")
    if re.search(r"[\w.\-]+@[\w\-]+\.\w+", text):
        warnings.append("Bài chứa địa chỉ email — không đưa vào kịch bản.")

    scope = title + "\n" + text + "\n" + cap_text
    acc_hits = _ACCIDENT.findall(scope)
    acc = sorted({m.group(0).lower() for m in _ACCIDENT.finditer(scope)})
    leg = sorted({m.group(0).lower() for m in _LEGAL.finditer(scope)})
    sensitivity = {"accident_terms": acc, "legal_terms": leg, "accident_hits": len(acc_hits),
                   "sensitive": bool(_ACCIDENT.search(title)) or len(acc_hits) >= 3}
    if sensitivity["sensitive"]:
        warnings.append("Tin tai nạn/thương vong: không đoán nguyên nhân, không nêu tên nạn nhân, tắt quảng cáo.")

    return {
        "schema": SCHEMA_ARTICLE, "url": url or canonical or base,
        "canonical_url": (urllib.parse.urljoin(base, canonical) if canonical and base else canonical),
        "domain": dom, "fetched_at": fetched_at or now_iso(), "language": lang or ("vi" if ratio >= 0.02 else None),
        "title": title, "lead": lead, "lead_source": lead_src, "dateline": dateline, "text": text, "paragraphs": plist, "captions": caps[:40],
        "published": published, "modified": modified, "age_days": age, "stale": bool(age is not None and age > STALE_DAYS),
        "author": author, "author_sign": extra.get("author_sign"), "upstream_credit": extra.get("upstream_credit"),
        "source": {"name": src, "domain": dom, "site_name_raw": site_name, "publisher_raw": publisher},
        "section": section, "keywords": kws, "image": img, "restrictions": restrictions, "sensitivity": sensitivity,
        "stats": {"chars": len(text), "words": len(words(text)), "paragraphs": len(plist), "body_chars": body_chars, "extract": method},
        "sha256_text": sha256_hex(text), "warnings": warnings, "ok": ok,
    }


def ingest(url: str, **fetch_kw: Any) -> dict:
    """fetch + parse_html. Thêm article['fetch'] (trạng thái, byte, băm, chuyển hướng) để truy vết."""
    fr = fetch(url, **fetch_kw)
    art = parse_html(fr["text"], fr["final_url"], fetched_at=fr["fetched_at"], headers=fr["headers"])
    art["url"] = fr["url"]
    art["final_url"] = fr["final_url"]
    art["fetch"] = {k: fr[k] for k in ("status", "content_type", "encoding", "bytes", "sha256", "elapsed_s", "redirects", "robots_checked", "user_agent")}
    return art


def ingest_file(path: str | Path, url: str | None = None) -> dict:
    """Đọc trang đã lưu tay (khi trang chặn robot hoặc cần đăng nhập). `url` là địa chỉ gốc để ghi nguồn."""
    raw = Path(path).read_bytes()
    text, enc = decode_html(raw, "")
    art = parse_html(text, url)
    art["fetch"] = {"status": None, "content_type": "file", "encoding": enc, "bytes": len(raw), "sha256": sha256_hex(raw), "file": str(path)}
    art["warnings"].append("Nhập từ tệp đã lưu tay — không kiểm robots.txt; chủ kênh chịu trách nhiệm về nguồn.")
    return art


# ═════════════════════════════════════ số, tên riêng, câu ═════════════════════════════════════
# Dùng chung cho nguồn (dữ kiện) và kịch bản (kiểm): cùng một bộ trích ⇒ khớp công bằng.

_MULT = {"tỷ": 1e9, "tỉ": 1e9, "triệu": 1e6, "nghìn": 1e3, "ngàn": 1e3}
_NUM_TOKEN = re.compile(r"(?<![\w.,/])(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)")
_DATE_RX = re.compile(r"(?<![\w/])(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?(?![\w/])")
_TIME_RX = re.compile(r"(?<![\w])(\d{1,2})[:h](\d{2})(?![\w])", re.I)
_MULT_RX = re.compile(r"\s{0,2}(tỷ|tỉ|triệu|nghìn|ngàn)(?![^\W\d_])", re.I)
_MULT_ATTACHED_RX = re.compile(r"(k|tr)(?![^\W\d_])", re.I)
_MONTHYEAR_RX = re.compile(r"(?<![\w/])(\d{1,2})/(\d{4})(?![\w/])")
_MONEY_RX = re.compile(r"\s{0,2}(đồng|vnđ|vnd|₫|đ(?![^\W\d_]))", re.I)
_USD_RX = re.compile(r"\s{0,2}(usd|us\$|\$|đô la|đô(?![^\W\d_]))", re.I)
_EUR_RX = re.compile(r"\s{0,2}(eur|euro|€)", re.I)
_PCT_RX = re.compile(r"\s{0,2}(%|phần trăm)", re.I)
_UNIT_RX = re.compile(
    r"\s{0,1}(km/h|km/giờ|l/100\s?km|vòng/phút|g/km|mã lực|túi khí|phiên bản|hàng ghế|chế độ|kwh|kw|km|mm|cm|kg|tấn|lít|cc|hp|ps|nm|rpm|inch|"
    r"phút|giây|giờ|ngày|tuần|tháng|năm|tuổi|chỗ|người|xe|chiếc|mẫu|lần|cửa|cấp|bánh|lượt|đơn|điểm|sao|ah|v|a|l|m)(?![^\W\d_])", re.I)
_STRICT_UNITS = {"pct", "vnd", "usd", "eur"}

_VN_DIGIT = {"không": 0, "một": 1, "mốt": 1, "hai": 2, "ba": 3, "bốn": 4, "tư": 4, "năm": 5, "lăm": 5, "sáu": 6, "bảy": 7, "bẩy": 7, "tám": 8, "chín": 9}
_VN_WORDS = set(_VN_DIGIT) | {"mười", "mươi", "trăm", "nghìn", "ngàn", "triệu", "tỷ", "tỉ", "lẻ", "linh", "rưỡi", "chục"}
_COUNT_NOUNS = {"xe", "chiếc", "mẫu", "người", "chỗ", "phiên", "bản", "lần", "ngày", "tháng", "giờ", "phút", "km", "lít", "mã", "tuổi", "sao", "đời",
                "thế", "cửa", "cấp", "số", "trăm", "mươi", "nghìn", "ngàn", "triệu", "tỷ", "tỉ", "phần", "điểm", "năm", "hãng", "dòng", "tấm", "bánh",
                "ghế", "hàng", "chế", "túi", "lượt", "đơn", "bộ", "loại", "kiểu", "mức", "vị", "giải", "thương", "quốc", "nước", "tháng", "tuần"}
_YEAR_PREV = {"mỗi", "hàng", "một", "cả", "qua", "trong", "từ", "của", "vào", "đầu", "cuối", "giữa", "nửa", "các", "những", "cùng", "suốt", "nhiều", "mấy",
              "vài", "hơn", "gần", "khoảng", "sau", "trước", "mọi", "năm", "đến", "tới", "hết", "kể", "dài", "ngót"}
_NOT_NUM_NEXT = {"mẹ", "má", "bố", "tôi", "của", "nó", "em", "anh", "chị", "mình", "ơi"}


def _parse_num_token(tok: str) -> list[float]:
    """'1.250' → [1250, 1.25]; '2,34' → [2.34]; '73.700' → [73700, 73.7]; '1.234.567' → [1234567]; '1.234,5' → [1234.5]. Giá trị đầu là cách đọc ưu tiên (VN)."""
    if tok.isdigit():
        return [float(tok)]
    seps = re.findall(r"[.,]", tok)
    if len(seps) == 1:
        sep = seps[0]
        head, tail = tok.split(sep)
        if len(tail) == 3 and 1 <= len(head) <= 3:
            thousands, decimal = float(head + tail), float(head + "." + tail)
            return [thousands, decimal] if sep == "." else [decimal, thousands]
        return [float(head + "." + tail)]
    if len(set(seps)) == 1:                                       # 1.234.567 hoặc 1,234,567
        return [float(re.sub(r"[.,]", "", tok))]
    last = max(tok.rfind("."), tok.rfind(","))                  # hỗn hợp: dấu cuối là thập phân
    return [float(re.sub(r"[.,]", "", tok[:last]) + "." + tok[last + 1:])]


def _unit_after(text: str, pos: int) -> tuple[str | None, float, int]:
    """Đọc phần ngay sau số: (đơn vị, hệ số nhân, vị trí kết thúc). Đơn vị: pct|vnd|usd|eur| từ đơn vị thường | None."""
    mult, unit, end = 1.0, None, pos
    m = _MULT_RX.match(text, end)
    if m:
        mult = _MULT[m.group(1).lower()]
        end = m.end()
    else:
        ma = _MULT_ATTACHED_RX.match(text, end)                  # '50k', '300tr' (viết tắt dính liền số)
        if ma:
            mult = 1e3 if ma.group(1).lower() == "k" else 1e6
            end = ma.end()
    for key, rx in (("vnd", _MONEY_RX), ("usd", _USD_RX), ("eur", _EUR_RX)):
        m2 = rx.match(text, end)
        if m2:
            return key, mult, m2.end()
    if mult == 1.0:
        m3 = _PCT_RX.match(text, end)
        if m3:
            return "pct", mult, m3.end()
        m4 = _UNIT_RX.match(text, end)
        if m4:
            return m4.group(1).lower().replace(" ", ""), mult, m4.end()
    return unit, mult, end


def _vn_value(tokens: list[str]) -> float | None:
    """Đọc số bằng chữ: ['hai','trăm','năm','mươi'] → 250; ['một','tỷ','rưỡi'] → 1.5e9; None nếu không hợp lệ."""
    total, chunk, digit, last_mult = 0.0, 0.0, None, None
    zero_tens = False
    seen_digit = False
    for i, t in enumerate(tokens):
        if t in _VN_DIGIT:
            if digit is not None and not zero_tens:
                if t in ("lăm", "mốt", "tư") and i > 0 and tokens[i - 1] in ("mươi", "mười"):
                    pass
                else:
                    return None                                    # hai ba … : không đọc được
            if t in ("lăm", "mốt") and i == 0:
                return None
            if tokens[i - 1:i] in (["mươi"], ["mười"]) and t in ("lăm", "mốt", "tư", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"):
                chunk += _VN_DIGIT[t]
                digit = None
            elif zero_tens:
                chunk += _VN_DIGIT[t]
                zero_tens = False
                digit = None
            else:
                digit = _VN_DIGIT[t]
            seen_digit = True
        elif t == "mười":
            if digit is not None:
                return None
            chunk += 10
        elif t == "mươi":
            if digit is None:
                return None
            chunk += digit * 10
            digit = None
        elif t == "trăm":
            chunk += (digit if digit is not None else 1) * 100
            digit = None
        elif t in ("lẻ", "linh"):
            zero_tens = True
        elif t in ("nghìn", "ngàn", "triệu", "tỷ", "tỉ"):
            m = _MULT[t]
            part = chunk + (digit or 0)
            if part == 0 and not seen_digit:
                return None
            total += (part if part else 1) * m
            chunk, digit, zero_tens, last_mult = 0.0, None, False, m
        elif t == "rưỡi":
            base = last_mult if (last_mult and chunk == 0 and digit is None) else (100 if chunk and chunk % 100 == 0 else 1)
            total += base / 2.0
            last_mult = None
        elif t == "chục":
            chunk += (digit if digit is not None else 1) * 10
            digit = None
    total += chunk + (digit or 0)
    return float(total) if (seen_digit or total) else None


_MULT_WORDS = ("mươi", "trăm", "nghìn", "ngàn", "triệu", "tỷ", "tỉ")


def _can_join(run: list[str], nxt: str, nxt2: str) -> bool:
    """Từ `nxt` có nối tiếp được số đang đọc `run` không ('hai mươi năm' = 20 năm ⇒ KHÔNG nối 'năm'; 'hai trăm năm mươi' = 250 ⇒ nối)."""
    last = run[-1]
    if nxt == "năm":
        return nxt2 in _MULT_WORDS
    if nxt == "tư":
        return last == "mươi"
    if nxt in ("một", "mốt"):
        return last in ("mười", "mươi", "trăm", "nghìn", "ngàn", "triệu", "tỷ", "tỉ", "lẻ", "linh")
    if nxt == "lăm":
        return last in ("mười", "mươi", "trăm", "lẻ", "linh")
    if nxt in _VN_DIGIT:                                   # hai/ba/…: sau số hàng (mươi/trăm/nghìn…/lẻ/linh/mười) mới nối được
        return last in ("mười", "mươi", "trăm", "nghìn", "ngàn", "triệu", "tỷ", "tỉ", "lẻ", "linh")
    if nxt == "mươi":
        return last in _VN_DIGIT and last not in ("không", "lăm", "mốt")
    if nxt == "trăm":
        return last in _VN_DIGIT and last not in ("không", "lăm", "mốt")
    if nxt in ("nghìn", "ngàn", "triệu", "tỷ", "tỉ"):
        return True
    if nxt in ("rưỡi", "lẻ", "linh", "chục", "mười"):
        return nxt != "mười" and last not in ("rưỡi",) and (nxt != "chục" or last in _VN_DIGIT)
    return False


_WORD_SPAN = re.compile(r"[^\W\d_]+", re.U)


def extract_numbers(text: str) -> list[dict]:
    """Mọi con số trong câu: chữ số (kể cả 1.250 / 1,2 tỷ / 50-100% / ngày 8/10/2026 / 10h30) và số viết bằng chữ ('hai trăm', 'ba mẫu').
    Trả [{raw,start,end,value,alts[],unit,kind}] theo thứ tự xuất hiện. value/alts là các cách đọc khả dĩ — khớp nếu GIAO nhau."""
    t = nfc(text)
    out: list[dict] = []
    work = list(t)

    def blank(a: int, b: int) -> None:
        for i in range(a, b):
            work[i] = " "

    for m in _DATE_RX.finditer(t):
        d, mo, y = m.group(1), m.group(2), m.group(3)
        if not (1 <= int(d) <= 31 and 1 <= int(mo) <= 12):
            continue
        for g, nm in ((d, "ngày"), (mo, "tháng"), (y, "năm")):
            if g:
                out.append({"raw": m.group(0), "start": m.start(), "end": m.end(), "value": float(g if len(g) != 2 or not y or nm != "năm" else "20" + g),
                            "alts": [], "unit": "date", "kind": "date"})
        blank(m.start(), m.end())
    for m in _MONTHYEAR_RX.finditer("".join(work)):
        if 1 <= int(m.group(1)) <= 12:
            out.append({"raw": m.group(0), "start": m.start(), "end": m.end(), "value": float(m.group(1)), "alts": [], "unit": "date", "kind": "date"})
            out.append({"raw": m.group(0), "start": m.start(), "end": m.end(), "value": float(m.group(2)), "alts": [], "unit": "date", "kind": "date"})
            blank(m.start(), m.end())
    for m in _TIME_RX.finditer("".join(work)):
        hh, mm = int(m.group(1)), int(m.group(2))
        if hh < 24 and mm < 60:
            out.append({"raw": m.group(0), "start": m.start(), "end": m.end(), "value": float(hh), "alts": [], "unit": "time", "kind": "time"})
            out.append({"raw": m.group(0), "start": m.start(), "end": m.end(), "value": float(mm), "alts": [], "unit": "time", "kind": "time"})
            blank(m.start(), m.end())
    s = "".join(work)
    digit_items: list[dict] = []
    for m in _NUM_TOKEN.finditer(s):
        vals = _parse_num_token(m.group(1))
        unit, mult, end = _unit_after(s, m.end())
        if end == m.end() and m.end() < len(s) and _LETTER.match(s[m.end()]):
            continue                                              # '350h', '500e', '4x4': mã đời xe dính chữ — thuộc TÊN, không phải số lượng
        pre = s[max(0, m.start() - 5):m.start()].replace(" ", "").lower()
        if unit is None and (pre.endswith("$") or pre.endswith("usd")):
            unit = "usd"
        elif unit is None and pre.endswith("€"):
            unit = "eur"
        vals = [v * mult for v in vals]
        digit_items.append({"raw": s[m.start():end].strip(), "start": m.start(), "end": end, "value": vals[0], "alts": vals[1:], "unit": unit,
                            "kind": "digit", "_mult": mult, "_num_end": m.end()})
    # ghép '1 tỷ 200 triệu' → 1,2 tỷ
    merged: list[dict] = []
    for it in digit_items:
        if merged:
            prev = merged[-1]
            gap = s[prev["end"]:it["start"]]
            if prev["_mult"] > 1 and it["_mult"] > 1 and prev["_mult"] > it["_mult"] and gap.strip() == "" and len(gap) <= 2:
                prev["value"] += it["value"]
                prev["alts"] = [a + it["value"] for a in prev["alts"]]
                prev["raw"] = s[prev["start"]:it["end"]].strip()
                prev["end"] = it["end"]
                prev["unit"] = it["unit"] or prev["unit"]
                prev["_mult"] = it["_mult"]
                continue
        merged.append(it)
    for it in merged:
        it.pop("_mult", None)
        it.pop("_num_end", None)
    out += merged
    # số viết bằng chữ
    consumed = [(it["start"], it["end"]) for it in out]
    toks = [(m.group(0), m.start(), m.end()) for m in _WORD_SPAN.finditer(t)]
    i = 0
    while i < len(toks):
        w, a, b = toks[i]
        wl = w.lower()
        if wl not in _VN_WORDS or any(c0 <= a < c1 for c0, c1 in consumed) or (w[0].isupper() and i > 0 and not _sentence_start(t, a)):
            i += 1
            continue
        j = i
        run = [wl]
        while j + 1 < len(toks) and toks[j + 1][0].lower() in _VN_WORDS and t[toks[j][2]:toks[j + 1][1]].strip() == ""                 and not any(c0 <= toks[j + 1][1] < c1 for c0, c1 in consumed):
            nxt = toks[j + 1][0].lower()
            nxt2 = toks[j + 2][0].lower() if j + 2 < len(toks) and t[toks[j + 1][2]:toks[j + 2][1]].strip() == "" else ""
            if not _can_join(run, nxt, nxt2):
                break
            j += 1
            run.append(nxt)
        end_idx = j
        nxt_tok = toks[end_idx + 1][0].lower() if end_idx + 1 < len(toks) and t[toks[end_idx][2]:toks[end_idx + 1][1]].strip() == "" else ""
        prev_tok = toks[i - 1][0].lower() if i > 0 and t[toks[i - 1][2]:a].strip() == "" else ""
        accept = False
        has_digit_word = any(x in _VN_DIGIT or x == "mười" or x == "chục" for x in run)
        if has_digit_word and len(run) >= 2:
            accept = True
        elif len(run) == 1:
            if wl in ("hai", "bốn", "sáu", "bảy", "tám", "chín", "mười") and nxt_tok not in _NOT_NUM_NEXT:
                accept = True
            elif wl == "ba" and nxt_tok not in _NOT_NUM_NEXT and prev_tok not in ("của", "bố", "ông"):
                accept = True
            elif wl == "năm" and nxt_tok in _COUNT_NOUNS and prev_tok not in _YEAR_PREV:
                accept = True
            elif wl == "một" and nxt_tok in ("trăm", "nghìn", "ngàn", "triệu", "tỷ", "tỉ", "chục"):
                accept = True
        if run[0] not in _VN_DIGIT and run[0] != "mười" or run[0] in ("không", "lăm", "mốt", "tư"):
            accept = False
        if accept:
            # 'một phẩy hai': phần thập phân
            val = _vn_value(run)
            ends = toks[end_idx][2]
            if val is not None and end_idx + 2 < len(toks) and toks[end_idx + 1][0].lower() in ("phẩy", "chấm") and toks[end_idx + 2][0].lower() in _VN_DIGIT:
                dec = _VN_DIGIT[toks[end_idx + 2][0].lower()]
                val = val + dec / 10.0
                ends = toks[end_idx + 2][2]
                end_idx += 2
            if val is not None:
                unit, mult, uend = _unit_after(t, ends)
                if unit in ("pct", "vnd", "usd", "eur") or mult > 1.0:
                    ends = uend
                val *= mult if mult > 1.0 else 1.0
                out.append({"raw": t[a:ends].strip(), "start": a, "end": ends, "value": float(val), "alts": [], "unit": unit, "kind": "word"})
                consumed.append((a, ends))
                i = end_idx + 1
                continue
        i += 1
    out.sort(key=lambda d: (d["start"], d["end"]))
    return out


def _sentence_start(t: str, pos: int) -> bool:
    k = pos - 1
    while k >= 0 and t[k] in " \t“\"'(([-–—":
        k -= 1
    return k < 0 or t[k] in ".!?…:;\n"


def _num_values(n: dict) -> list[float]:
    return [n["value"], *n.get("alts", [])]


def number_in(n: dict, pool: list[dict]) -> bool:
    """Số `n` có trong nhóm số `pool` không (khớp GIÁ TRỊ; đơn vị tiền/% phải cùng loại nếu cả hai đều có)."""
    cand = _num_values(n)
    for s in pool:
        u1, u2 = n.get("unit"), s.get("unit")
        if u1 in _STRICT_UNITS and u2 in _STRICT_UNITS and u1 != u2:
            continue
        for a in cand:
            for b in _num_values(s):
                if math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9):
                    return True
    return False


# ── tên riêng ──

KNOWN_BRANDS = [
    "Toyota", "Honda", "Mazda", "Hyundai", "Kia", "Ford", "Mitsubishi", "Suzuki", "Nissan", "Subaru", "Isuzu", "Lexus", "Mercedes", "Mercedes-Benz",
    "BMW", "Audi", "Volkswagen", "Porsche", "Volvo", "Jaguar", "Land Rover", "Range Rover", "Bentley", "Rolls-Royce", "Ferrari", "Lamborghini",
    "Maserati", "McLaren", "Aston Martin", "Bugatti", "Tesla", "VinFast", "BYD", "Chery", "Geely", "Haval", "GWM", "MG", "SAIC", "Wuling", "Omoda",
    "Jaecoo", "Jeep", "Chevrolet", "Cadillac", "GMC", "Dodge", "Lincoln", "Peugeot", "Renault", "Citroen", "Opel", "Fiat", "Skoda", "Mini", "Smart",
    "Genesis", "Infiniti", "Acura", "Lotus", "Polestar", "Lucid", "Rivian", "Xpeng", "Nio", "Zeekr", "Denza", "Hongqi", "Dongfeng", "Thaco", "Daihatsu",
    "Proton", "Perodua", "Tata", "Mahindra", "SsangYong", "KGM", "Yamaha", "Piaggio", "Vespa", "Ducati", "Kawasaki", "Harley-Davidson", "Michelin",
    "Bridgestone", "Bosch", "Samsung", "Apple", "Google", "Huawei", "Xiaomi", "CATL", "Panasonic", "LG", "Hino", "Foton", "Kamaz",
]
_KNOWN_BRANDS_FOLD = {fold_words(b) for b in KNOWN_BRANDS}
GENERIC_ACRONYMS = {"SUV", "MPV", "EV", "BEV", "PHEV", "HEV", "REEV", "EREV", "MHEV", "ADAS", "ABS", "LED", "USB", "GPS", "CVT", "AT", "MT", "DCT", "AWD", "FWD",
                    "RWD", "4WD", "USD", "VND", "VNĐ", "EUR", "TV", "CEO", "AI", "OK", "ID", "PIN", "HD", "4K", "WIFI", "VIN", "ECU", "ESP", "TPMS", "AC", "DC", "OBD",
                    "KM", "KW", "KWH", "HP", "PS", "NM", "CC", "II", "III", "IV", "V", "X", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
                    "P", "Q", "R", "S", "T", "U", "W", "Y", "Z"}
_COMMON_START = {fold(x) for x in (
    "Theo", "Với", "Nhưng", "Tuy", "Tuy nhiên", "Ngoài", "Trong", "Đây", "Đó", "Khi", "Nếu", "Sau", "Trước", "Hiện", "Cũng", "Bên", "Mới", "Như", "Vì", "Do",
    "Và", "Hãy", "Bạn", "Các", "Những", "Một", "Mỗi", "Năm", "Tháng", "Ngày", "Giá", "Xe", "Mẫu", "Hãng", "Chiếc", "Bản", "Phiên", "Để", "Từ", "Tại", "Đến",
    "Cho", "Còn", "Dù", "Dẫu", "Song", "Ở", "Lần", "Hơn", "Gần", "Khoảng", "Chỉ", "Đặc", "Cụ", "Tính", "Riêng", "Thêm", "Đồng", "Mặt", "Trên", "Dưới", "Nhờ",
    "Tất", "Toàn", "Nhiều", "Hầu", "Phần", "Người", "Nhà", "Việc", "Sự", "Điều", "Thông", "Tin", "Ông", "Bà", "Anh", "Chị", "Giám", "Chủ", "Đại", "Thương",
    "Mức", "Động", "Hệ", "Nội", "Ngoại", "Khoang", "Thiết", "Sản", "Công", "Thị", "Bộ", "Sở", "Thủ", "Tổng", "Phó", "Thứ", "Quý", "Cả", "Lúc", "Vào", "Về",
    "Tiếp", "Hiện nay", "Ngoài ra", "Bên cạnh", "Cụ thể", "Đặc biệt", "Mặt khác", "Đồng thời", "Tuy vậy", "Dù vậy", "Vì vậy", "Do đó", "Chính", "Hai", "Ba", "Bốn",
    "Sáu", "Bảy", "Tám", "Chín", "Mười", "Không", "Chưa", "Đã", "Sẽ", "Đang", "Vẫn", "Còn", "Rất", "Quá", "Thế", "Vậy", "Nó", "Họ", "Chúng", "Tôi", "Mình")}
_NAME_TOK = re.compile(r"[^\W_]+(?:[-’'/][^\W_]+)*", re.U)
_CODE_TOKEN = re.compile(r"\d{1,4}[A-Za-z]{1,2}")                  # '350h', '500e', '4x'... đi sau tên hãng/dòng xe: 'ES 350h Premium'
_START_PUNCT = set(".!?…:;\n\"“‘'(([—–-")


def _is_upper_word(w: str) -> bool:
    letters = [c for c in w if c.isalpha()]
    return len(letters) >= 2 and all(c.isupper() for c in letters)


def is_mostly_upper(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    return len(letters) >= 6 and sum(1 for c in letters if c.isupper()) / len(letters) > 0.8


def extract_names(text: str) -> list[dict]:
    """Tên riêng/mẫu xe/viết tắt trong câu: dãy từ viết hoa liền nhau (có thể kèm số ≤ 3 chữ số: 'VF 8'), mã mẫu (CX-5, G63), viết tắt IN HOA.
    Từ viết hoa đầu câu chỉ tính khi là hãng quen thuộc/mã mẫu/viết tắt (tránh 'Theo', 'Với'…). Trả [{text,start,end}]."""
    t = nfc(text)
    toks = [(m.group(0), m.start(), m.end()) for m in _NAME_TOK.finditer(t)]
    upper_line = is_mostly_upper(t)
    out: list[dict] = []
    i = 0
    while i < len(toks):
        w, a, b = toks[i]
        first = w[0]
        has_digit = any(c.isdigit() for c in w)
        has_alpha = any(c.isalpha() for c in w)
        is_model = has_alpha and has_digit and first.isalpha() and first.isupper()
        capish = (first.isalpha() and first.isupper()) or is_model
        if upper_line:
            capish = fold_words(w) in _KNOWN_BRANDS_FOLD or is_model
        if not capish:
            i += 1
            continue
        group = [i]
        j = i
        while j + 1 < len(toks):
            w2, a2, b2 = toks[j + 1]
            gap = t[toks[j][2]:a2]
            if gap.strip() != "" or len(gap) > 2 or "\n" in gap:
                break
            f2 = w2[0]
            m2 = any(c.isalpha() for c in w2) and any(c.isdigit() for c in w2) and f2.isalpha() and f2.isupper()
            cap2 = (f2.isalpha() and f2.isupper()) or m2
            if upper_line:
                cap2 = fold_words(w2) in _KNOWN_BRANDS_FOLD or m2
            if cap2:
                j += 1
                group.append(j)
            elif (w2.isdigit() and len(w2) <= 3) or _CODE_TOKEN.fullmatch(w2):
                j += 1
                group.append(j)
            else:
                break
        gtoks = [toks[k] for k in group]
        start_pos = gtoks[0][1]
        at_start = _sentence_start(t, start_pos)
        # bỏ các từ đầu câu thường gặp ('Theo', 'Với') khỏi nhóm nhiều từ
        while len(gtoks) > 1 and at_start and fold(gtoks[0][0]) in _COMMON_START:
            gtoks = gtoks[1:]
            at_start = False
        # bỏ số trơ ở đầu nhóm
        while gtoks and gtoks[0][0].isdigit():
            gtoks = gtoks[1:]
        if not gtoks:
            i = group[-1] + 1
            continue
        if len(gtoks) == 1:
            w0 = gtoks[0][0]
            fw = fold_words(w0)
            m0 = any(c.isalpha() for c in w0) and any(c.isdigit() for c in w0)
            if len(w0) == 1 or (_is_upper_word(w0) and w0.upper() in GENERIC_ACRONYMS) or w0.upper() in GENERIC_ACRONYMS and len(w0) <= 3 and not m0:
                i = group[-1] + 1
                continue
            if at_start and not m0 and not _is_upper_word(w0) and fw not in _KNOWN_BRANDS_FOLD:
                i = group[-1] + 1
                continue
            if fold(w0) in _COMMON_START and not m0:
                i = group[-1] + 1
                continue
        s0, e0 = gtoks[0][1], gtoks[-1][2]
        out.append({"text": t[s0:e0], "start": s0, "end": e0})
        i = group[-1] + 1
    seen: set[str] = set()
    uniq = []
    for n in out:
        k = fold_words(n["text"])
        if k and k not in seen:
            seen.add(k)
            uniq.append(n)
    return uniq


class Pool:
    """Kho đối chiếu dựng từ dữ kiện: cụm từ (bỏ dấu) + tập từ + số theo từng dữ kiện."""

    def __init__(self, facts_list: list[dict], extra_terms: list[str] | None = None):
        self.facts = {f["id"]: f for f in facts_list}
        body = " \n ".join(f["text"] for f in facts_list)
        extra = " \n ".join(extra_terms or [])
        self.text = body
        self.extra = extra
        self.phrases = " " + fold_words(body + " \n " + extra) + " "
        self.tokens = set(self.phrases.split())
        self.raw_fold = fold(body)
        self.numbers_all: list[dict] = []
        self.numbers_by_fact: dict[str, list[dict]] = {}
        for f in facts_list:
            ns = f.get("numbers")
            if ns is None:
                ns = extract_numbers(f["text"])
            self.numbers_by_fact[f["id"]] = ns
            self.numbers_all += ns

    def has_phrase(self, s: str) -> bool:
        p = fold_words(s)
        return bool(p) and (" " + p + " ") in self.phrases

    def name_status(self, name: str) -> tuple[str, list[str]]:
        p = fold_words(name)
        if not p:
            return "ok", []
        if (" " + p + " ") in self.phrases:
            return "ok", []
        miss = [x for x in p.split() if x not in self.tokens]
        return ("partial", []) if not miss else ("missing", miss)


# ── tách câu ──

_ABBR = re.compile(r"\b(?:TP|TX|Tp|ThS|TS|PGS|GS|BS|KS|CN|Mr|Mrs|Ms|Dr|St|No|vs|ĐT|QL|TL|ĐH)\.(?=\s*[A-ZĐa-z0-9])|\b(?:Q|P|H|X)\.(?=\d)")
_QUOTE_RX = re.compile(r"“[^”]{1,800}”|\"[^\"\n]{1,800}\"|«[^»]{1,800}»")
_PH = "\u0001"


def split_sentences(text: str) -> list[tuple[int, int]]:
    """Tách câu tiếng Việt → [(start,end)] offset trong `text`. Giữ nguyên 'TP.HCM', '1.250', 'v.v.', trích dẫn có dấu chấm bên trong."""
    s = text
    chars = list(s)

    def protect(a: int, b: int) -> None:
        for k in range(a, b):
            if chars[k] in ".!?…":
                chars[k] = _PH

    for m in re.finditer(r"(?<=\d)[.,](?=\d)", s):
        chars[m.start()] = _PH if s[m.start()] == "." else chars[m.start()]
    for m in _ABBR.finditer(s):
        protect(m.start(), m.end())
    for m in re.finditer(r"v\.v\.?", s):
        protect(m.start(), m.end())
    for m in _QUOTE_RX.finditer(s):
        inner_end = m.end() - 1                                     # trước dấu nháy đóng
        if inner_end - 1 > m.start() and s[inner_end - 1] in ".!?…":
            inner_end -= 1                                          # chấm cuối trong nháy vẫn có thể kết thúc câu
        protect(m.start() + 1, inner_end)
    prot = "".join(chars)
    cuts = [0]
    for m in re.finditer(r"([.!?…]+[\"”’»)\]]*)\s+", prot):
        k = m.end()
        while k < len(prot) and prot[k] in "\"“‘'«([":
            k += 1
        if k < len(prot) and (prot[k].isupper() or prot[k].isdigit()):
            cuts.append(m.end())
    cuts.append(len(s))
    spans = []
    for a, b in zip(cuts, cuts[1:]):
        seg = s[a:b]
        lead = len(seg) - len(seg.lstrip())
        trail = len(seg) - len(seg.rstrip())
        if b - a - lead - trail > 0:
            spans.append((a + lead, b - trail))
    return spans


# ── dữ kiện ──

_SPEAK_VERBS = r"(?:nói|cho biết|chia sẻ|nhấn mạnh|khẳng định|cho rằng|tiết lộ|giải thích|bày tỏ|thừa nhận|dự báo|phát biểu|cho hay|nhận định|kể|trả lời|tuyên bố|bình luận|thông báo|lưu ý|đánh giá)"
_QUOTED = re.compile(r"[“\"«]([^”\"»]{12,600})[”\"»]")
_SPEAKER_AFTER = re.compile(r"[”\"»]\s*[,.]?\s*((?:ông|bà|anh|chị|ngài|giám đốc|tổng giám đốc|chủ tịch|đại diện|người phát ngôn|chuyên gia|nhà|đại diện hãng|phó|trưởng)?[^,.;:“”\"]{2,70}?)\s*(?:" + _SPEAK_VERBS + r")", re.I)
_SPEAKER_BEFORE = re.compile(r"((?:ông|bà|anh|chị|ngài|giám đốc|tổng giám đốc|chủ tịch|đại diện|người phát ngôn|chuyên gia|phó|trưởng)[^,.;:“”\"]{2,70}?)\s*" + _SPEAK_VERBS + r"\b", re.I)
_ATTRIB = re.compile(r"\b(?:theo|dẫn nguồn|cho biết|tuyên bố|thông báo)\s+([^,.;:]{2,60})", re.I)
_HEDGE_RUMOR = re.compile(r"tin đồn|rò rỉ|nghe nói|được cho là|chưa (?:được )?(?:xác nhận|công bố|chính thức|rõ|có thông tin)|nguồn tin|đồn đoán|có lẽ|dường như|nhiều khả năng", re.I)
_HEDGE_SOFT = re.compile(r"dự kiến|dự báo|dự định|có thể|có khả năng|ước tính|khoảng|tạm tính|theo kế hoạch|hy vọng|kỳ vọng|nếu|sẽ", re.I)
_HEDGE_MARKER = re.compile(
    r"dự kiến|dự báo|dự định|có thể|có khả năng|ước tính|tin đồn|rò rỉ|nghe nói|được cho là|chưa|theo\b|cho biết|nguồn tin|đồn đoán|có lẽ|dường như|"
    r"nhiều khả năng|khoảng|tạm tính|kỳ vọng|nếu|sẽ", re.I)


def _fact_kind(f: dict) -> str:
    if f.get("quote"):
        return "quote"
    if f.get("numbers"):
        return "number"
    if f.get("names"):
        return "claim"
    return "context"


def facts(article: dict, *, include_title: bool = True, min_words: int = 4, max_facts: int | None = None,
          include_captions: bool = True, caption_min_words: int = 6) -> list[dict]:
    """Danh sách dữ kiện đánh số F1…Fn. F1 = tiêu đề; kế đó là CÂU NGUYÊN VĂN của thân bài (bỏ tiêu đề phụ, câu hỏi, dòng 'Xem thêm', hàng tiêu đề bảng);
    cuối cùng là CHÚ THÍCH ẢNH đủ dài, chưa trùng thân bài (cite 'chú thích ảnh k') — nhiều báo (Tuổi Trẻ…) để thông số trong chú thích.
    Mỗi dữ kiện: {id,n,text,para,sent,span[a,b] trong article['text'] (None với tiêu đề/chú thích),cite,kind,numbers[],names[],quote,attribution,hedge,salience}."""
    out: list[dict] = []
    title = clean(article.get("title") or "")
    n = 0
    if include_title and title:
        n += 1
        out.append(_mk_fact(n, title, 0, 0, None, "tiêu đề", "title"))
    paras = article.get("paragraphs") or []
    for p in paras:
        if p.get("kind") in ("h", "tablehead"):
            continue
        ptxt = p["text"]
        start0 = p.get("start", 0)
        for si, (a, b) in enumerate(split_sentences(ptxt), 1):
            sent = ptxt[a:b].strip()
            if len(words(sent)) < min_words or not has_letters(sent):
                continue
            if sent.endswith("?") or _BOILER.search(sent) or _CREDIT_LINE.match(sent):
                continue
            n += 1
            cite = f"đoạn {p['i']}" + (" (sapo)" if p.get("kind") == "lead" else "") + f", câu {si}"
            out.append(_mk_fact(n, sent, p["i"], si, [start0 + a, start0 + b], cite, p.get("kind", "p")))
    if include_captions:
        body_fold = fold(" ".join(f["text"] for f in out))
        for ci, cap in enumerate(article.get("captions") or [], 1):
            ctext = clean(cap.get("text") if isinstance(cap, dict) else cap)
            for si, (a, b) in enumerate(split_sentences(ctext), 1):
                sent = ctext[a:b].strip()
                if len(words(sent)) < caption_min_words or not has_letters(sent) or sent.endswith("?") or fold(sent).rstrip(". ") in body_fold:
                    continue
                n += 1
                out.append(_mk_fact(n, sent, 0, si, None, f"chú thích ảnh {ci}" + (f", câu {si}" if si > 1 else ""), "caption"))
                body_fold += " " + fold(sent)
    if max_facts:
        out = out[:max_facts]
    L = max(1, len(out))
    for f in out:
        sal = 1.0
        sal += min(3, len(f["numbers"])) * 0.8 + min(3, len(f["names"])) * 0.5
        sal += 1.0 if f["quote"] else 0.0
        sal += 1.2 if (f["pkind"] == "title" or 0 < f["para"] <= 2) else 0.0
        sal -= 0.4 if f["pkind"] == "caption" else 0.0
        sal += 0.5 * (1.0 - f["n"] / L)
        sal -= 0.5 if f["hedge"] == "rumor" else 0.0
        f["salience"] = round(sal, 2)
    return out


def _mk_fact(n: int, text: str, para: int, sent: int, span: list[int] | None, cite: str, pkind: str) -> dict:
    nums = extract_numbers(text)
    names = [x["text"] for x in extract_names(text)]
    quote = None
    mq = _QUOTED.search(text)
    if mq and len(words(mq.group(1))) >= 3:
        sp = None
        m1 = _SPEAKER_AFTER.search(text, mq.start())
        if m1:
            sp = clean(m1.group(1))
        else:
            m2 = _SPEAKER_BEFORE.search(text[:mq.start()])
            if m2:
                sp = clean(m2.group(1))
        quote = {"text": clean(mq.group(1)), "speaker": sp}
    ma = _ATTRIB.search(text)
    hedge = "rumor" if _HEDGE_RUMOR.search(text) else ("soft" if _HEDGE_SOFT.search(text) else None)
    f = {"id": f"F{n}", "n": n, "text": text, "para": para, "sent": sent, "span": span, "cite": cite, "pkind": pkind,
         "numbers": [{k: v for k, v in x.items() if k in ("raw", "value", "alts", "unit", "kind")} for x in nums],
         "names": names, "quote": quote, "attribution": clean(ma.group(1)) if ma else None, "hedge": hedge}
    f["kind"] = "title" if pkind == "title" else _fact_kind(f)
    return f


def facts_doc(article: dict, **kw: Any) -> dict:
    fl = facts(article, **kw)
    return {"schema": SCHEMA_FACTS, "source": {"name": (article.get("source") or {}).get("name"), "url": article.get("url"),
                                               "published": article.get("published")},
            "count": len(fl), "generated_at": now_iso(), "facts": fl}

