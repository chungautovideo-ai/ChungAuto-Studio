// Brand kit: font + màu + kiểu phụ đề. Dùng chung cho build (Node) và editor (trình duyệt).

// Chỉ các font Google Fonts có đủ dấu tiếng Việt. Giá trị = tham số family cho css2 API
// (mỗi font 1 thẻ <link> riêng để một font lỗi không làm hỏng font khác).
export const FONTS = {
  "iCiel Panton": "local:panton-black.otf",
  "UTM Bebas": "local:utm-bebas.ttf",
  "Anton": "Anton",
  "Oswald": "Oswald:wght@400;500;600;700",
  "Barlow Condensed": "Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;1,600",
  "Roboto Condensed": "Roboto+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,600",
  "Archivo": "Archivo:ital,wght@0,500;0,600;0,700;0,800;1,600",
  "Be Vietnam Pro": "Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,600;1,800",
  "Montserrat": "Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900",
  "Inter": "Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600",
  "Lexend": "Lexend:wght@400;500;600;700;800",
  "Nunito": "Nunito:ital,wght@0,500;0,600;0,700;0,800;1,600",
  "Playfair Display": "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600",
};

export const LOCAL_FONT_FACES={
 "iCiel Panton":[{file:'panton-light.otf',weight:300,style:'normal'},{file:'panton-light-italic.otf',weight:300,style:'italic'},{file:'panton-black.otf',weight:900,style:'normal'},{file:'panton-black-italic.otf',weight:900,style:'italic'}],
 "UTM Bebas":[{file:'utm-bebas.ttf',weight:400,style:'normal'}]
};
export function fontVariants(family){
 const labels={100:'Thin',200:'Extra Light',300:'Light',400:'Regular',500:'Medium',600:'Semi Bold',700:'Bold',800:'Extra Bold',900:'Black'};
 const spec=FONTS[family];if(!spec)return [];
 const faces=LOCAL_FONT_FACES[family]||(!spec.includes(':')?[{weight:400,style:'normal'}]:spec.split('@')[1].split(';').map(part=>{const values=part.split(',');return {weight:Number(values.at(-1)),style:values.length>1&&values[0]==='1'?'italic':'normal'};}));
 return faces.map(f=>({...f,id:f.weight+'-'+f.style,label:labels[f.weight]+(f.style==='italic'?' Italic':'')}));
}
export function fontVariantStyle(family,id){const face=fontVariants(family).find(f=>f.id===(id||(family==='iCiel Panton'?'900-normal':'')));return face?`font-weight:${face.weight};font-style:${face.style};`:'';}
export function localFontCss(family,prefix='assets/fonts/'){
 return (LOCAL_FONT_FACES[family]||[]).map(f=>`@font-face{font-family:'${family}';src:url('${prefix+f.file}');font-weight:${f.weight};font-style:${f.style};font-display:block}`).join('');
}
export function textTypographyStyle(text,key,defaults={}){
 const family=text[key]||defaults[key];
 let css=(FONTS[text[key]]?`font-family:'${text[key]}',sans-serif;`:'')+fontVariantStyle(family,text[key+'Variant']);
 const prefix=key==='fontTitle'?'':key==='fontLabel'?'label':'sub';
 const fields=[[prefix?prefix+'Size':'size',12,300,key==='fontTitle'?'--fs':'font-size','px'],[prefix?prefix+'LetterSpacing':'letterSpacing',-10,40,'letter-spacing','px'],[prefix?prefix+'LineHeight':'lineHeight',.7,3,'line-height','']];
 for(const [field,min,max,property,unit] of fields){const value=text[field];if(value!==undefined&&value!==''&&Number.isFinite(Number(value)))css+=`${property}:${Math.max(min,Math.min(max,Number(value)))}${unit};`;}
 return css;
}

export const BRAND_DEFAULT = {
  name: "Vàng cao cấp",
  fontTitle: "Anton",
  fontSub: "Montserrat",
  fontLabel: "Montserrat",
  c1: "#FFF1A1",
  c2: "#F6E96B",
  c3: "#EED33F",
  sub: "#FAF8F0",
  caption: { style: "pill", size: 58, color: "#FFFFFF", active: "#F6E96B", uppercase: false },
};

export const CAPTION_STYLES = [
  ["pill", "Viên sáng chạy theo từ"],
  ["clean", "Chữ trắng, từ đang nói đổi màu"],
  ["bold", "In hoa đậm, từ đang nói phóng to"],
  ["box", "Khung tối, từ đang nói đổi màu"],
  ["stack", "Chữ xếp chồng nhiều màu, từng từ bật ra"],
];

// Hiệu ứng riêng cho 1 từ trong phụ đề kiểu "stack"
export const WORD_FX = [
  ["", "Tự động"], ["plain", "Thường"], ["glow", "Phát sáng neon"], ["grad", "Tô gradient"], ["italic", "Nghiêng sang"],
  ["glitch", "Nhiễu RGB"], ["flash", "Loé màu cả khung"],
];

export const CAPTION_DEFAULT = { enabled: false, y: 1450, x: 0, scale: 1, maxWords: 4, hideOnScenes: false, lines: [] };

export function brandOf(p) {
  const b = { ...BRAND_DEFAULT, ...(p.brand || {}) };
  b.caption = { ...BRAND_DEFAULT.caption, ...(p.brand?.caption || {}) };
  return b;
}

export function fontLinks(b) {
  const names=[...new Set([b.fontTitle,b.fontSub,b.fontLabel,b.caption?.font,...(b.extraFontNames||[])])];
  const local=names.filter(f=>LOCAL_FONT_FACES[f]).map(f=>`<style>${localFontCss(f)}</style>`).join('\n');
  const fams = names.filter((f) => FONTS[f]&&!FONTS[f].startsWith('local:')).map((f) => FONTS[f]);
  // Mẫu có thể mang font Google riêng: brand.fonts = ["Bodoni Moda:ital,opsz,wght@0,6..96,400..900", …]
  for (const x of Array.isArray(b.fonts) ? b.fonts : []) if (/^[\w ]+(:[\w,.;@ ]+)?$/.test(x)) fams.push(x.replace(/ /g, "+"));
  return local+[...new Set(fams)].map((f) => `<link href="https://fonts.googleapis.com/css2?family=${f}&display=block&subset=vietnamese" rel="stylesheet">`).join("\n");
}

export function brandVars(b) {
  const q = (f) => `'${String(f).replace(/'/g, "")}'`;
  return `:root{--f-title:${q(b.fontTitle)},sans-serif;--f-sub:${q(b.fontSub)},sans-serif;--f-label:${q(b.fontLabel)},sans-serif;` +
    `--c1:${b.c1};--c2:${b.c2};--c3:${b.c3};--c-sub:${b.sub};` +
    `--cap-size:${Number(b.caption.size) || 58}px;--cap-color:${b.caption.color};--cap-active:${b.caption.active}}` +
    // font riêng cho phụ đề: đè cả kiểu phụ đề và css của mẫu, trừ từ nhấn nghiêng
    (b.caption.font ? `.cap,.cap .cw:not(.fx-italic){font-family:${q(b.caption.font)},sans-serif!important}` : "");
}

// ---------- Chỉnh màu video gốc ----------
// Màu video (camera.color): brightness / contrast / saturate (CSS filter) · hue (độ, hue-rotate) · sepia (0–1)
// · temp (−1 lạnh … 1 ấm, lớp phủ) · fade (0–1, nâng vùng tối kiểu phim) · vignette (0–1, tối viền)
export const COLOR_NEUTRAL = { brightness: 1, contrast: 1, saturate: 1, hue: 0, sepia: 0, temp: 0, fade: 0, vignette: 0 };
// Bộ lọc có sẵn (tab Bộ lọc) — nhóm theo phong cách như CapCut
export const COLOR_PRESETS = {
  none: { label: "Gốc", group: "Cơ bản" },
  bright: { label: "Sáng trong", group: "Cơ bản", brightness: 1.1, contrast: 1.03, saturate: 1.05, temp: 0.05 },
  fresh: { label: "Tươi mát", group: "Cơ bản", brightness: 1.06, contrast: 1.04, saturate: 1.15, temp: -0.12 },
  vivid: { label: "Rực rỡ", group: "Cơ bản", brightness: 1.03, contrast: 1.1, saturate: 1.3, temp: 0.1 },
  warm: { label: "Ấm áp", group: "Ấm / lạnh", brightness: 1.02, contrast: 1.05, saturate: 1.08, temp: 0.5, vignette: 0.15 },
  sunset: { label: "Chiều tà", group: "Ấm / lạnh", brightness: 1.02, contrast: 1.06, saturate: 1.12, hue: -6, temp: 0.7, vignette: 0.2 },
  cool: { label: "Lạnh", group: "Ấm / lạnh", contrast: 1.04, saturate: 0.95, temp: -0.5, vignette: 0.1 },
  ocean: { label: "Xanh biển", group: "Ấm / lạnh", brightness: 1.03, contrast: 1.06, saturate: 1.05, hue: 8, temp: -0.7 },
  film: { label: "Phim", group: "Điện ảnh", brightness: 1.03, contrast: 0.92, saturate: 0.85, temp: 0.25, fade: 0.12, vignette: 0.35 },
  cinema: { label: "Điện ảnh", group: "Điện ảnh", brightness: 0.98, contrast: 1.15, saturate: 0.9, hue: -4, temp: -0.15, vignette: 0.45 },
  moody: { label: "Trầm buồn", group: "Điện ảnh", brightness: 0.95, contrast: 1.1, saturate: 0.7, temp: -0.25, fade: 0.08, vignette: 0.5 },
  faded: { label: "Mờ nhẹ", group: "Điện ảnh", brightness: 1.05, contrast: 0.85, saturate: 0.8, fade: 0.2 },
  vintage: { label: "Cổ điển", group: "Hoài cổ", brightness: 1.02, contrast: 0.95, saturate: 0.8, sepia: 0.35, fade: 0.15, vignette: 0.35 },
  retro: { label: "Retro", group: "Hoài cổ", brightness: 1.04, contrast: 1.05, saturate: 1.1, hue: -10, sepia: 0.2, temp: 0.3, fade: 0.1 },
  pink: { label: "Hồng phấn", group: "Hoài cổ", brightness: 1.06, contrast: 0.97, saturate: 1.05, hue: -12, temp: 0.15, fade: 0.08 },
  bw: { label: "Đen trắng", group: "Đen trắng", brightness: 1.02, contrast: 1.15, saturate: 0, vignette: 0.25 },
  noir: { label: "Noir", group: "Đen trắng", brightness: 0.96, contrast: 1.35, saturate: 0, vignette: 0.5 },
  sepiaBw: { label: "Nâu cũ", group: "Đen trắng", brightness: 1.02, contrast: 1.05, saturate: 0, sepia: 0.6, fade: 0.1, vignette: 0.3 },
};
// Màu da (tab Màu da): chỉnh nhẹ tông cả khung cho da đẹp hơn (không tách riêng vùng da)
export const SKIN_PRESETS = {
  none: { label: "Tự nhiên" },
  bright: { label: "Da sáng", brightness: 1.08, contrast: 0.96, saturate: 1.02, temp: 0.08 },
  rosy: { label: "Hồng hào", brightness: 1.04, saturate: 1.1, hue: -6, temp: 0.18 },
  warm: { label: "Da ấm", brightness: 1.03, contrast: 1.02, saturate: 1.06, temp: 0.32 },
  fair: { label: "Trắng mịn", brightness: 1.1, contrast: 0.92, saturate: 0.92, temp: -0.05, fade: 0.06 },
  tan: { label: "Da nâu khoẻ", brightness: 0.98, contrast: 1.08, saturate: 1.12, hue: -3, temp: 0.4 },
  soft: { label: "Dịu mắt", brightness: 1.05, contrast: 0.9, saturate: 0.95, fade: 0.1 },
};
export function colorOf(cam) {
  return { ...COLOR_NEUTRAL, ...(cam?.color || {}) };
}
// Giá trị màu cuối cùng: bộ lọc (theo cường độ) chồng lên màu da, cộng chỉnh tay (adjust: lệch so với trung tính)
export function mixColor(filterId, amount = 1, skinId = "none", adjust = {}) {
  const f = COLOR_PRESETS[filterId] || {}, s = SKIN_PRESETS[skinId] || {}, out = {};
  for (const [k, n] of Object.entries(COLOR_NEUTRAL)) {
    const fv = (f[k] ?? n) - n, sv = (s[k] ?? n) - n;
    out[k] = Math.round((n + fv * amount + sv + (Number(adjust[k]) || 0)) * 1000) / 1000;
  }
  return out;
}

// ---------- Chuyển cảnh ----------
export const CUT_TRANSITIONS = [["none", "Cắt thẳng"], ["fade", "Mờ qua đen"], ["flash", "Loé sáng"], ["zoom", "Zoom giật"], ["blur", "Nhoè"], ["slide", "Trượt ngang"], ["smear", "Vệt nhoè dọc"], ["dissolve", "Hoà tan 2 cảnh"], ["leak", "Vệt sáng (light leak)"], ["spin", "Xoáy nhoè"], ["zoomblur", "Phóng nhoè + tia sáng"], ["glare", "Loé sáng quét ngang"]];
// Hiệu ứng hình trên cả khung (project.vfx): rung · lệch màu RGB · hạt nhiễu · biến dạng · dừng hình (lời nói vẫn chạy)
export const VFX_TYPES = [["shake", "Rung", "Shake"], ["rgb", "Lệch màu RGB", "RGB Split"], ["grain", "Hạt nhiễu", "Grain"], ["warp", "Biến dạng", "Displace"], ["freeze", "Dừng hình", "Freeze Frame"], ["pixel", "Độ phân giải thấp", "Pixelate"]];
export const ENTER_TRANSITIONS = [["fade", "Mờ dần"], ["slide", "Trượt lên"], ["zoom", "Phóng ra"], ["wipe", "Quét ngang"], ["drop", "Rơi xuống"], ["none", "Không hiệu ứng"]];

// ---------- Phụ đề ----------
// Gom từ thành dòng: tối đa maxWords từ, ngắt ở dấu câu hoặc khoảng lặng > 0.35s.
export function groupCaptionLines(words, maxWords = 4) {
  const lines = [];
  let cur = [];
  const flush = () => { if (cur.length) lines.push(cur); cur = []; };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= maxWords || (prev && w.s - prev.e > 0.35))) flush();
    cur.push(w);
    if (/[.,!?;:…]$/.test(w.w)) flush();
  });
  flush();
  return lines.map((ws, i) => ({ id: `c${i + 1}`, words: ws.map((w) => ({ w: w.w, s: w.s, e: w.e })) }));
}

// Sửa chữ một dòng: giữ mốc thời gian nếu số từ không đổi, nếu đổi thì chia lại theo độ dài chữ.
export function retimeLine(line, text) {
  const toks = String(text).normalize("NFC").trim().split(/\s+/).filter(Boolean);
  if (!toks.length || !line.words.length) return { ...line, words: [] };
  if (toks.length === line.words.length) return { ...line, words: line.words.map((w, i) => ({ ...w, w: toks[i] })) };
  const s = line.words[0].s, e = line.words[line.words.length - 1].e;
  const total = toks.reduce((n, t) => n + t.length + 1, 0);
  let acc = s;
  const words = toks.map((t) => {
    const d = ((t.length + 1) / total) * (e - s);
    const w = { w: t, s: Math.round(acc * 1000) / 1000, e: Math.round((acc + d) * 1000) / 1000 };
    acc += d;
    return w;
  });
  return { ...line, words };
}
// Text appearance is data, never arbitrary CSS. Shared by inspector and builds.
export function normalizeTextAppearance(value){
 if(!value||!['solid','gradient'].includes(value.mode))return null;
 const color=(v,f)=>/^#[\da-f]{6}$/i.test(String(v))?v.toLowerCase():f;
 const num=(v,f,min,max)=>v!==''&&v!=null&&Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):f;
 const stops=(Array.isArray(value.stops)?value.stops:[]).slice(0,8).map((s,i)=>({color:color(s?.color,'#ffffff'),at:num(s?.at,i?100:0,0,100)}));
 if(stops.length<2)stops.splice(0,stops.length,{color:'#fff4b8',at:0},{color:'#e89b20',at:100});
 const a={mode:value.mode,color:color(value.color,'#ffffff'),angle:num(value.angle,180,0,360),stops,strokeColor:color(value.strokeColor,'#000000'),strokeWidth:num(value.strokeWidth,0,0,16),shadowColor:color(value.shadowColor,'#000000'),shadowX:num(value.shadowX,0,-50,50),shadowY:num(value.shadowY,4,-50,50),shadowBlur:num(value.shadowBlur,8,0,80),shadowOpacity:num(value.shadowOpacity,60,0,100)};
 a.outerStrokeWidth=num(value.outerStrokeWidth,0,0,10);a.outerStrokeColor=color(value.outerStrokeColor,'#75be16');a.italic=value.italic===true;
 a.gradient=`linear-gradient(${a.angle}deg,${[...stops].sort((x,y)=>x.at-y.at).map(s=>s.color+' '+s.at+'%').join(',')})`;return a;
}
export function textAppearanceStyle(value){
 const a=normalizeTextAppearance(value);if(!a)return '';
 const ring=a.outerStrokeWidth?Array.from({length:8},(_,i)=>{const r=a.outerStrokeWidth/(1+Math.SQRT2),t=i*Math.PI/4;return `drop-shadow(${(Math.cos(t)*r).toFixed(2)}px ${(Math.sin(t)*r).toFixed(2)}px 0 ${a.outerStrokeColor})`;}).join(' '):'opacity(1)';
 const rgb=a.shadowColor.slice(1).match(/../g).map(x=>parseInt(x,16));
 return `--ta-ring:${ring};--ta-slant:${a.italic?'italic':'inherit'};--ta-weight:${a.italic?'900':'inherit'};--ta-fill:${a.mode==='gradient'?a.gradient:a.color};--ta-ink:${a.mode==='gradient'?'transparent':a.color};--ta-stroke:${a.strokeWidth}px ${a.strokeColor};--ta-shadow:${a.shadowX}px ${a.shadowY}px ${a.shadowBlur}px rgba(${rgb.join(',')},${a.shadowOpacity/100});`;
}
const look=(label,value,group=value.mode==='gradient'?'Gradient':value.shadowBlur>=18?'Phát sáng':'Viền & bóng')=>({label,value,group});
const gradient=(colors,extra={})=>({mode:'gradient',angle:180,stops:colors.map((color,i)=>({color,at:Math.round(i*100/(colors.length-1))})),...extra});
export const TEXT_LOOKS={
 limeDouble:look('Trắng nghiêng viền xanh kép',{mode:'solid',color:'#ffffff',strokeWidth:6,strokeColor:'#16220c',outerStrokeWidth:4,outerStrokeColor:'#80cf20',italic:true,shadowColor:'#101b08',shadowX:1,shadowY:5,shadowBlur:2,shadowOpacity:95}),
 white:look('Trắng nổi',{mode:'solid',color:'#ffffff',strokeWidth:2,strokeColor:'#131720'}),
 gold:look('Ánh kim',gradient(['#fff4bd','#d38b16','#fff2ba','#b87513'],{strokeWidth:1,strokeColor:'#8a5715'})),
 sunset:look('Hoàng hôn',gradient(['#fff3a1','#ff9235','#ff3f67'])),
 ocean:look('Đại dương',gradient(['#b9fffc','#38bdf8','#5260ff'])),
 candy:look('Kẹo ngọt',gradient(['#ffc7f4','#c084fc','#71d8ff'])),
 mint:look('Ngọc bích',gradient(['#deffba','#54efbf','#04a794'])),
 neon:look('Neon xanh',{mode:'solid',color:'#b6ffff',strokeWidth:1,strokeColor:'#1edfff',shadowColor:'#00c8ff',shadowBlur:24,shadowOpacity:100,shadowY:0}),
 pink:look('Neon hồng',{mode:'solid',color:'#fff0fc',strokeWidth:1,strokeColor:'#ff4ae0',shadowColor:'#ff12bb',shadowBlur:24,shadowOpacity:100,shadowY:0}),
 comic:look('Truyện tranh',{mode:'solid',color:'#ffdf32',strokeWidth:4,strokeColor:'#151515',shadowBlur:0,shadowX:5,shadowY:5,shadowOpacity:100}),
 silver:look('Bạc',gradient(['#ffffff','#aeb9d0','#ffffff','#677890'],{strokeWidth:1,strokeColor:'#48536a'})),
 limeWhite:look('Trắng viền xanh',{mode:'solid',color:'#ffffff',strokeWidth:4,strokeColor:'#75be16',shadowColor:'#152b04',shadowBlur:1,shadowY:3,shadowOpacity:100}),
 lemonGreen:look('Vàng chanh xanh',{mode:'solid',color:'#f7ff44',strokeWidth:4,strokeColor:'#23760d',shadowColor:'#0c2706',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 whiteBlue:look('Trắng viền lam',{mode:'solid',color:'#ffffff',strokeWidth:4,strokeColor:'#3989e8',shadowColor:'#153b76',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 whiteRed:look('Trắng viền đỏ',{mode:'solid',color:'#ffffff',strokeWidth:4,strokeColor:'#f12632',shadowColor:'#6f0a14',shadowBlur:0,shadowY:4,shadowOpacity:100}),
 redWhite:look('Đỏ viền trắng',{mode:'solid',color:'#f31d2f',strokeWidth:4,strokeColor:'#ffffff',shadowColor:'#561219',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 orangeWhite:look('Cam viền trắng',{mode:'solid',color:'#ff7a19',strokeWidth:4,strokeColor:'#ffffff',shadowColor:'#832d07',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 yellowBlack:look('Vàng viền đen',{mode:'solid',color:'#ffd934',strokeWidth:4,strokeColor:'#141414',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 blackWhite:look('Đen viền trắng',{mode:'solid',color:'#17191e',strokeWidth:4,strokeColor:'#ffffff',shadowBlur:2,shadowY:4,shadowOpacity:90}),
 whiteBlack:look('Trắng viền đậm',{mode:'solid',color:'#ffffff',strokeWidth:5,strokeColor:'#101116',shadowBlur:0,shadowX:3,shadowY:5,shadowOpacity:100}),
 blueWhite:look('Lam viền trắng',{mode:'solid',color:'#347df4',strokeWidth:4,strokeColor:'#ffffff',shadowColor:'#163d85',shadowBlur:0,shadowY:5,shadowOpacity:100}),
 amberBlue:look('Vàng viền lam',{mode:'solid',color:'#ffcf27',strokeWidth:4,strokeColor:'#2876bd',shadowColor:'#ffffff',shadowBlur:2,shadowY:0,shadowOpacity:90}),
 peachDark:look('Đào viền nâu',{mode:'solid',color:'#ffc384',strokeWidth:4,strokeColor:'#4b2517',shadowBlur:0,shadowX:2,shadowY:4,shadowOpacity:100}),
 goldRim:look('Vàng ánh sáng',gradient(['#fffbd5','#d7aa35','#fff8ba'],{strokeWidth:3,strokeColor:'#b8983d',shadowColor:'#fff0ab',shadowBlur:12,shadowY:0,shadowOpacity:85})),
 fireRim:look('Lửa viền đỏ',gradient(['#fff9b1','#ffcc20','#ff761a'],{strokeWidth:3,strokeColor:'#8a1910',shadowColor:'#f94613',shadowBlur:8,shadowY:2,shadowOpacity:85})),
 orangeGold:look('Cam ánh vàng',gradient(['#ffffac','#ffc62c','#f48817'],{strokeWidth:3,strokeColor:'#ffffff',shadowColor:'#825009',shadowBlur:1,shadowY:4,shadowOpacity:100})),
 blueRim:look('Lam chuyển sắc',gradient(['#ffffff','#b7ddff','#3985eb'],{strokeWidth:3,strokeColor:'#2865d0',shadowColor:'#101b5d',shadowBlur:0,shadowY:4,shadowOpacity:100})),
 purpleRim:look('Tím chuyển sắc',gradient(['#ffffff','#d9c8ff','#8174ff'],{strokeWidth:3,strokeColor:'#5644b1',shadowColor:'#251350',shadowBlur:2,shadowY:4,shadowOpacity:100})),
 limeGlow:look('Lục phát sáng',{mode:'solid',color:'#f0ffdc',strokeWidth:2,strokeColor:'#6eda24',shadowColor:'#61e322',shadowBlur:18,shadowY:0,shadowOpacity:100},'Phát sáng'),
 redGlow:look('Đỏ phát sáng',{mode:'solid',color:'#fff8dc',strokeWidth:2,strokeColor:'#ff432a',shadowColor:'#ff271a',shadowBlur:18,shadowY:0,shadowOpacity:100},'Phát sáng'),
 royalGlow:look('Lam phát sáng',{mode:'solid',color:'#ffffff',strokeWidth:2,strokeColor:'#5668ff',shadowColor:'#4935ff',shadowBlur:20,shadowY:0,shadowOpacity:100},'Phát sáng'),
};
