// ZIP đọc/ghi tối giản (store + deflate) bằng zlib có sẵn của Node — không cần thư viện.
import zlib from "node:zlib";

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
export const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function dosStamp(d = new Date()) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

// files: [{ name: "a/b.txt", data: Buffer }]. Nén deflate, trừ file đã nén sẵn (mp4, jpg, zip…).
export function zip(files, { compress = true } = {}) {
  const { time, date } = dosStamp();
  const parts = [], central = [];
  let offset = 0;
  for (const { name, data, mode } of files) {
    // Quyền kiểu Unix (để file .command / .sh chạy được trên macOS sau khi giải nén)
    const perm = mode ?? (/\.(command|sh)$/.test(name) ? 0o100755 : 0o100644);
    const nm = Buffer.from(name.replace(/\\/g, "/"), "utf8");
    const crc = crc32(data);
    const skip = /\.(mp4|mov|webm|m4v|jpe?g|png|webp|gif|mp3|m4a|aac|zip|woff2?)$/i.test(name);
    let body = data, method = 0;
    if (compress && !skip && data.length > 64) {
      const d = zlib.deflateRawSync(data, { level: 9 });
      if (d.length < data.length) { body = d; method = 8; }
    }
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, nm, body);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE((3 << 8) | 20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE((perm << 16) >>> 0, 38); ch.writeUInt32LE(offset, 42);
    central.push(ch, nm);
    offset += lh.length + nm.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

// Thêm 1 file (không nén) vào zip có sẵn mà không đọc lại cả gói — dùng để gắn thông tin người tải vào bản phần mềm
export function zipAppend(buf, name, data) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("File zip hỏng.");
  const count = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOff = buf.readUInt32LE(eocd + 16);
  const { time, date } = dosStamp(), nm = Buffer.from(name, "utf8"), crc = crc32(data);
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8);
  lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26); lh.writeUInt16LE(0, 28);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE((3 << 8) | 20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10);
  ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE((0o100644 << 16) >>> 0, 38); ch.writeUInt32LE(cdOff, 42);
  const added = lh.length + nm.length + data.length, end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(count + 1, 8); end.writeUInt16LE(count + 1, 10);
  end.writeUInt32LE(cdSize + ch.length + nm.length, 12); end.writeUInt32LE(cdOff + added, 16);
  return Buffer.concat([buf.subarray(0, cdOff), lh, nm, data, buf.subarray(cdOff, cdOff + cdSize), ch, nm, end]);
}
// tên thư mục gốc trong zip (vd "video-edit-kit/") — lấy từ mục đầu tiên của central directory
export function zipRoot(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) {
    const p = buf.readUInt32LE(i + 16), name = buf.toString("utf8", p + 46, p + 46 + buf.readUInt16LE(p + 28));
    return name.includes("/") ? name.slice(0, name.indexOf("/") + 1) : "";
  }
  return "";
}

// Đọc zip → [{ name, data }]. Kiểm tra CRC từng file.
export function unzip(buf, {maxOutputBytes=Infinity,maxFileBytes=Infinity} = {}) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("File zip hỏng.");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];let totalOutput=0;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("File zip hỏng (central directory).");
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const declaredSize=buf.readUInt32LE(p+24);if(declaredSize>maxFileBytes||totalOutput+declaredSize>maxOutputBytes)throw new Error('Gói ZIP giải nén quá lớn.');
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    p += 46 + nlen + elen + clen;
    if (name.endsWith("/")) continue;
    const ds = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(ds, ds + csize);
    const data = method === 0 ? Buffer.from(raw) : method === 8 ? zlib.inflateRawSync(raw,Number.isFinite(maxFileBytes)?{maxOutputLength:maxFileBytes}:undefined) : null;
    if(data){totalOutput+=data.length;if(data.length>maxFileBytes||totalOutput>maxOutputBytes||data.length!==declaredSize)throw new Error('Kích thước ZIP không hợp lệ hoặc quá lớn.');}
    if (!data) throw new Error(`Kiểu nén không hỗ trợ: ${name}`);
    if (crc32(data) !== crc) throw new Error(`Sai CRC: ${name}`);
    out.push({ name, data });
  }
  return out;
}
