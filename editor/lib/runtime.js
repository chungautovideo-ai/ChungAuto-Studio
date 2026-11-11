// Runtime chạy bên trong index.html: dựng GSAP timeline từ window.__EDIT__.
// Chỉ dùng fromTo/to trên timeline paused → seek tới bất kỳ frame nào cũng đúng.
(function () {
  var E = window.__EDIT__;
  var tl = gsap.timeline({ paused: true });
  // Source-bound effects read tl.time(). Keep that clock valid even when the
  // edit contains no graphics, or its last animation ends before the footage.
  var compositionClock = { time: 0 };
  tl.to(compositionClock, { time: E.total, duration: E.total, ease: 'none' }, 0);
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var GOLD_LINE = "rgba(246,233,107,.75)";
  var DIM_LINE = "rgba(250,248,240,.12)";

  // Hiệu ứng xuất hiện dùng chung cho cảnh minh hoạ và cảnh trám.
  function enter(el, type, t, d) {
    if (!el || type === "none" || d === 0) return; // d: tInDuration đã quy đổi, bỏ trống = mặc định cũ
    if (type === "slide") tl.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: d ?? 0.45, ease: "power3.out" }, t);
    else if (type === "zoom") tl.fromTo(el, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: d ?? 0.4, ease: "power3.out" }, t);
    // rơi từ trên xuống, nảy nhẹ (thẻ / ảnh dán kiểu scrapbook)
    else if (type === "drop") tl.fromTo(el, { opacity: 0, y: -260, rotation: 4 }, { opacity: 1, y: 0, rotation: 0, duration: d ?? 0.42, ease: "back.out(1.6)" }, t);
    else if (type === "wipe") tl.fromTo(el, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: d ?? 0.45, ease: "power2.inOut" }, t);
    else tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d ?? 0.3, ease: "power1.out" }, t);
  }

  (E.sourceZooms||[]).forEach(function(entry){
    var el=document.getElementById(entry.id),keys=entry.zoom.keys;if(!el)return;
    var offset=entry.zoom.timeOffset||0;
    function easing(kind){return function(t){return kind==='linear'?t:kind==='out'?1-Math.pow(1-t,3):t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};}
    var initial=keys[0].scale;
    keys.forEach(function(k,i){if(offset>=k.time)initial=k.scale;if(i<keys.length-1&&offset>k.time&&offset<keys[i+1].time){var b=keys[i+1];initial=k.scale+(b.scale-k.scale)*easing(k.ease)((offset-k.time)/(b.time-k.time));}});
    tl.set(el,{scale:initial},0);
    for(var i=0;i<keys.length-1;i++){
      var a=keys[i],b=keys[i+1];if(b.time<=offset)continue;
      var from=Math.max(a.time,offset),ratio=(from-a.time)/(b.time-a.time),ease=easing(a.ease),e0=ease(ratio);
      // Restrict the original easing curve rather than restarting it after a cut.
      var cropped=(function(fn,r,start){return function(t){return 1-start<1e-12?1:(fn(r+(1-r)*t)-start)/(1-start);};})(ease,ratio,e0);
      tl.fromTo(el,{scale:a.scale+(b.scale-a.scale)*e0},{scale:b.scale,duration:b.time-from,ease:cropped,immediateRender:false},entry.start+from-offset);
    }
  });

  // Hoạt ảnh Vào / Ra / Lặp kiểu CapCut (editor/lib/text-effects.js giữ danh mục + mốc thời gian).
  // Vào/Ra chạy trên cả .tx-box; Lặp chạy trên nhãn/tiêu đề/chữ phụ để không đè transform của Vào/Ra.
  var TX_IN = {
    "fade": [{ opacity: 0 }, { ease: "power1.out" }],
    "zoom-in": [{ opacity: 0, scale: 0.4 }, { ease: "power3.out" }],
    "zoom-out": [{ opacity: 0, scale: 1.7 }, { ease: "power3.out" }],
    "slide-up": [{ opacity: 0, y: 160 }, { ease: "power3.out" }],
    "slide-down": [{ opacity: 0, y: -160 }, { ease: "power3.out" }],
    "slide-left": [{ opacity: 0, x: 220 }, { ease: "power3.out" }],
    "slide-right": [{ opacity: 0, x: -220 }, { ease: "power3.out" }],
    "bounce": [{ opacity: 0, scale: 0.2 }, { ease: "elastic.out(1,0.45)" }],
    "spin": [{ opacity: 0, rotation: -200, scale: 0.3 }, { ease: "back.out(1.4)" }],
    "shake": [{ opacity: 0, x: -70 }, { ease: "elastic.out(1.2,0.25)" }],
    "blur": [{ opacity: 0, filter: "blur(22px)", scale: 1.08 }, { ease: "power2.out" }],
  };
  var TX_OUT = {
    "fade": [{ opacity: 0 }, "power1.in"],
    "zoom-out": [{ opacity: 0, scale: 1.6 }, "power2.in"],
    "shrink": [{ opacity: 0, scale: 0.3 }, "power2.in"],
    "slide-up": [{ opacity: 0, y: -160 }, "power2.in"],
    "slide-down": [{ opacity: 0, y: 160 }, "power2.in"],
    "slide-left": [{ opacity: 0, x: -220 }, "power2.in"],
    "slide-right": [{ opacity: 0, x: 220 }, "power2.in"],
    "drop": [{ opacity: 0, y: 420, rotation: 10 }, "power2.in"],
    "blur": [{ opacity: 0, filter: "blur(22px)" }, "power1.in"],
  };
  var TX_REST = { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, filter: "blur(0px)" };
  function textIn(t, box, title, at, d) {
    var type = t.anim.in.type;
    if (type === "type") {
      tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at);
      var chars = title ? $$(".ch", title) : [], step = d / Math.max(chars.length, 1);
      chars.forEach(function (c, i) { tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.01 }, at + i * step); });
      return at + d;
    }
    var p = TX_IN[type] || TX_IN.fade, to = {};
    for (var k in p[0]) to[k] = TX_REST[k];
    tl.fromTo(box, p[0], Object.assign(to, { duration: d, ease: p[1].ease }), at);
    return at + d;
  }
  function textOut(box, type, at, d) {
    var p = TX_OUT[type] || TX_OUT.fade;
    // immediateRender:false — trạng thái trước lúc ra là trạng thái sau Vào/Lặp, không bị ghi đè khi dựng timeline
    tl.to(box, Object.assign({}, p[0], { duration: d, ease: p[1], immediateRender: false }), at);
  }
  // Lặp: yoyo số lần chẵn → kết thúc đúng trạng thái nghỉ trước khi Ra bắt đầu.
  function textLoop(els, L, s) {
    if (!els.length) return;
    var len = L.end - L.start, at = s + L.start, sp = L.speed || 1;
    var P = {
      pulse: [{ scale: 1 }, { scale: 1.1 }, 0.8, "sine.inOut"],
      wiggle: [{ rotation: -5 }, { rotation: 5 }, 0.9, "sine.inOut"],
      blink: [{ opacity: 1 }, { opacity: 0.25 }, 0.6, "steps(1)"],
      float: [{ y: 0 }, { y: -18 }, 1.6, "sine.inOut"],
      shake: [{ x: -5 }, { x: 5 }, 0.12, "none"],
    }[L.type];
    if (!P) return;
    var half = P[2] / sp / 2, n = Math.floor(len / (half * 2));
    if (n < 1) return;
    tl.fromTo(els, P[0], Object.assign({}, P[1], { duration: half, ease: P[3], yoyo: true, repeat: n * 2 - 1, immediateRender: false }), at);
    tl.set(els, TX_LOOP_REST[L.type], at + n * half * 2);
  }
  var TX_LOOP_REST = { pulse: { scale: 1 }, wiggle: { rotation: 0 }, blink: { opacity: 1 }, float: { y: 0 }, shake: { x: 0 } };
  // ---------- Chữ nhấn ----------
  E.texts.forEach(function (t) {
    var el = document.getElementById(t.id);
    if (!el) return;
    var box = $(".tx-box", el), title = $(".tx-title", el), sub = $(".tx-sub", el),
      label = $(".tx-label", el), shade = $(".tx-shade", el), bars = $$(".em-bar", el);
    var s = t.start, end = t.start + t.dur, after = s + 0.38, A = t.anim || {};
    // Thứ tự ưu tiên: anim.in (hoạt ảnh Vào kiểu CapCut) thay toàn bộ hiệu ứng vào theo fx; anim.out thay mờ ra mặc định;
    // anim.loop chạy thêm giữa lúc vào xong và lúc ra bắt đầu. Không có anim → giữ nguyên hành vi fx cũ.
    if (A.in) {
      after = textIn(t, box, title, s + A.in.start, A.in.dur);
      if (bars.length) tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.inOut", stagger: 0.15 }, after);
    } else textFx(t, shade, label, title, sub, bars, s);
    if (A.loop) textLoop([label, title, sub].filter(Boolean), A.loop, s);
    if (A.out) textOut(box, A.out.type, s + A.out.start, A.out.dur);
    else tl.to(box, { opacity: 0, y: -12, duration: 0.24, ease: "power1.in" }, Math.max(s + 0.6, end - 0.26));
  });

  // Hiệu ứng vào theo fx (words | slide | mask | marker | type) — hành vi gốc.
  function textFx(t, shade, label, title, sub, bars, s) {
    var after = s + 0.38;
    tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, s);
    if (label) tl.fromTo(label, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, s);

    if (title) {
      if (t.fx === "type") {
        var chars = $$(".ch", title);
        var step = Math.min(0.055, 1.1 / Math.max(chars.length, 1));
        chars.forEach(function (c, i) {
          tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.01 }, s + 0.05 + i * step);
        });
        after = s + 0.05 + chars.length * step;
        var caret = $(".caret", title);
        if (caret) tl.to(caret, { opacity: 0, duration: 0.2 }, after + 0.3);
      } else if (t.fx === "words") {
        var words = $$(".w", title);
        var st = Math.min(0.09, 0.3 / Math.max(words.length - 1, 1));
        tl.fromTo(words, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", stagger: st }, s);
        after = s + 0.3 + st * (words.length - 1);
      } else if (t.fx === "mask") {
        tl.fromTo(title, { clipPath: "inset(-20% -10% 120% -10%)", y: 26 },
          { clipPath: "inset(-20% -10% -20% -10%)", y: 0, duration: 0.45, ease: "power3.out" }, s);
        after = s + 0.45;
      } else if (t.fx === "marker") {
        tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, s);
        after = s + 0.2;
      } else {
        // slide
        tl.fromTo(title, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, s);
        after = s + 0.4;
      }
      if (bars.length) {
        tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: t.fx === "marker" ? 0.45 : 0.35, ease: "power2.inOut", stagger: 0.15 }, after);
      }
    }
    if (sub) tl.fromTo(sub, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, Math.min(after, s + 0.6));
  }


  // ---------- Kích thước khung: 1080×1920 (9:16) hoặc 1920×1080 (16:9) ----------
  var FW = E.W || 1080, FH = E.H || 1920, WIDE = FW > FH;

  // ---------- Zoom người nói ----------
  // khối bám theo người có lớp bọc .trk-cam: nhận mọi chuyển động của camera (zoom, dời người, rung) y như #cam
  var trkCam = $$(".trk-cam");
  var cam = [document.getElementById("cam"), document.getElementById("matte")].filter(Boolean).concat(trkCam);
  // #cam phóng quanh tâm O (vị trí mặt trong video gốc); mặt đang hiện ở FC (khác O khi khung người đã thu / dời — nền thay sau người).
  // place(s, tx, ty): x, y để phóng s lần mà mặt tới (tx, ty) — mặc định giữ mặt tại chỗ
  var O = { x: (E.faceX == null ? 0.5 : E.faceX) * FW, y: E.faceY * FH }, FC = E.faceAt || O;
  var place = function (s, tx, ty) {
    var X = tx == null ? FC.x : tx, Y = ty == null ? FC.y : ty;
    return { scale: s, x: Math.round(X - O.x - (FC.x - O.x) * s), y: Math.round(Y - O.y - (FC.y - O.y) * s) };
  };
  var moveTo = function (c) { return place(c.scale, c.faceTo == null ? null : c.faceTo * FW, c.faceToY == null ? null : c.faceToY * FH); };
  var REST = { scale: 1, x: 0, y: 0 };
  // cắt nhảy khung / dời người (zoom cut, cảnh trám, khối): gom lại rồi đặt theo từng mốc — mục bắt đầu sau thắng,
  // hết mục này mà mục khác còn hiện thì về vị trí của mục kia (không về chỗ cũ đè lên cú dời cùng thời điểm)
  var jumps = [];
  var jump = function (a, b, st) { if (b > a) jumps.push({ a: a, b: b, st: st, n: jumps.length }); };
  E.zooms.forEach(function (z) {
    // mode "cut": nhảy thẳng sang khung gần (giả cắt 2 máy quay), hết đoạn nhảy về · to: dời mặt tới chỗ khác cùng lúc
    if (z.cut) { jump(z.start, z.start + z.dur, z.to ? moveTo(z.to) : place(z.amount)); return; }
    // mode "board": nền phẳng toàn khung, người nói thu (scale = amount) vào khung bo góc ở đáy, mặt ở sát mép trên khung
    // (đầu nhô lên nhờ lớp tách người #matte không bị cắt). Đồ hoạ đặt ở phần trên.
    if (z.board) {
      var bd = document.getElementById("board"), cm = document.getElementById("cam"), mt = document.getElementById("matte");
      var b = z.board;
      var s = Math.min(1, Math.max(0.3, z.amount < 1 ? z.amount : 0.89));
      var ox = (E.faceX == null ? 0.5 : E.faceX) * FW, oy = E.faceY * FH;
      // có tách nền: mặt sát mép trên khung, đầu nhô lên · không có: hạ mặt vào trong khung để không cắt ngang đầu
      var faceAt = mt ? (b.face || b.top + 46) : Math.max(b.face || 0, b.top + 150 + 100 * s);
      var tx = FW / 2 - ox, ty = faceAt - oy;
      ty = Math.max(FH - oy - s * (FH - oy), ty); // đáy video không hở
      // khung bám theo bề ngang video: người thu nhỏ (thấy cổ, vai) thì khung hẹp lại — không bao giờ lộ mép video
      var vl = ox * (1 - s) + tx, vr = ox + s * (FW - ox) + tx;
      if (vr - vl < FW - 2 * b.side) { var dx = FW / 2 - (vl + vr) / 2; tx += dx; vl += dx; vr += dx; } // khung hẹp → căn giữa màn hình
      else { var cx = Math.min(0, b.side - vl) || Math.max(0, FW - b.side - vr); tx += cx; vl += cx; vr += cx; } // khung rộng → không hở mép
      var bl = Math.max(b.side, vl), br = Math.min(FW - b.side, vr);
      var loc = function (v, o, t) { return o + (v - o - t) / s; };
      var top = loc(b.top, oy, ty), left = loc(bl, ox, tx), right = FW - loc(br, ox, tx), bottom = Math.min(0, FH - loc(FH + 70, oy, ty));
      var clip = "inset(" + top.toFixed(1) + "px " + right.toFixed(1) + "px " + bottom.toFixed(1) + "px " + left.toFixed(1) + "px round " + (b.round / s).toFixed(1) + "px)";
      var on = { scale: s, x: tx, y: ty }, off = { scale: 1, x: 0, y: 0 };
      if (bd) { tl.set(bd, { opacity: 1 }, z.start); tl.set(bd, { opacity: 0 }, z.start + z.dur); }
      tl.set(cm, Object.assign({ clipPath: clip }, on), z.start); tl.set(cm, Object.assign({ clipPath: "none" }, off), z.start + z.dur);
      if (mt) { tl.set(mt, on, z.start); tl.set(mt, off, z.start + z.dur); }
      if (trkCam.length) { tl.set(trkCam, on, z.start); tl.set(trkCam, off, z.start + z.dur); }
      return;
    }
    // mode "frame": người nói thu (scale = amount) vào khung chữ nhật giữa màn hình (x, y, w, h), nền #board phía sau;
    // thu vào / phóng ra mượt trong f.ease giây (0 = cắt thẳng). Khung trang trí (viền tem, giấy…) là khối đồ hoạ đặt đúng vị trí khung.
    if (z.frame) {
      var fbd = document.getElementById("board"), fcm = document.getElementById("cam"), fmt = document.getElementById("matte");
      // người luôn phủ kín khung (không lộ nền trong khung): cỡ tối thiểu = khung / khung hình
      var f = z.frame, fs = Math.min(1, Math.max(0.2, f.w / FW, f.h / FH, z.amount < 1 ? z.amount : 0.62));
      var fox = (E.faceX == null ? 0.5 : E.faceX) * FW, foy = E.faceY * FH;
      var foff = { scale: 1, x: 0, y: 0, clipPath: "inset(0px 0px 0px 0px round 0px)" };
      var fe = Math.min(f.ease, z.dur / 3), fl = [fcm].concat(fmt ? [fmt] : [], trkCam);
      // trôi chậm: cả khung (và khối đồ hoạ trang trí, anim scale span quanh giữa màn hình) phóng dần tới drift lần
      var fk = f.drift || 1, fcx = FW / 2, fcy = FH / 2;
      var fdr = function (o, k, dx, dy) { // trạng thái người khi khung phóng k lần quanh giữa màn hình + dời (dx, dy)
        var r = { x: fcx + (f.x - fcx) * k + dx, y: fcy + (f.y - fcy) * k + dy, w: f.w * k, h: f.h * k }, sc = fs * k;
        // canh mặt theo khung nhưng video luôn PHỦ KÍN khung — không hở mép trên / dưới / trái / phải (mép video sau phóng: o·(1−sc)+t … o + (W−o)·sc + t)
        var cl = function (v, lo, hi) { return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)); };
        var tx = cl(r.x + r.w / 2 - fox, r.x + r.w - fox - (FW - fox) * sc, r.x - fox * (1 - sc));
        var ty = cl(r.y + r.h * f.face - foy, r.y + r.h - foy - (FH - foy) * sc, r.y - foy * (1 - sc));
        var lc = function (v, o2, t) { return o2 + (v - o2 - t) / sc; };
        return { scale: sc, x: tx, y: ty, clipPath: "inset(" + lc(r.y, foy, ty).toFixed(1) + "px " + (FW - lc(r.x + r.w, fox, tx)).toFixed(1) + "px " +
          (FH - lc(r.y + r.h, foy, ty)).toFixed(1) + "px " + lc(r.x, fox, tx).toFixed(1) + "px round " + (f.round / fs).toFixed(1) + "px)" };
      };
      var fon = fdr(null, 1, 0, 0);
      var DIR = { up: [0, -FH], down: [0, FH], left: [-FW, 0], right: [FW, 0], pan: [f.pan ? f.pan.x : 0, f.pan ? f.pan.y : -FH] };
      var fin2 = DIR[f.in], fout = DIR[f.out], isPan = f.in === "pan" || f.out === "pan";
      var fpd = isPan ? Math.min(f.panDur || 0.6, z.dur / 2) : Math.min(0.5, z.dur / 3), fez = isPan ? "power2.inOut" : "power3.inOut";
      var t0 = z.start, t1 = z.start + z.dur, fend = fdr(null, fk, 0, 0);
      if (fbd) { tl.set(fbd, { opacity: 1 }, t0); tl.set(fbd, { opacity: 0 }, t1); }
      // vào: lia từ hướng (khung + người trượt vào cùng khối "pan-*") · phóng từ toàn khung · hoặc cắt thẳng
      if (fin2) { tl.fromTo(fl, fdr(null, 1, -fin2[0], -fin2[1]), Object.assign({ duration: fpd, ease: fez, immediateRender: false }, fon), t0); }
      else if (fe > 0.02) tl.fromTo(fl, foff, Object.assign({ duration: fe, ease: "power3.inOut", immediateRender: false }, fon), t0);
      else tl.set(fl, fon, t0);
      var tin = t0 + (fin2 ? fpd : fe > 0.02 ? fe : 0), tout = t1 - (fout ? fpd : f.out === "cut" ? 0 : fe > 0.02 ? fe : 0);
      if (fk !== 1 && tout > tin) tl.fromTo(fl, fon, Object.assign({ duration: tout - tin, ease: "none", immediateRender: false }, fend), tin);
      // ra: lia theo hướng · phóng về toàn khung · cắt thẳng
      if (fout) tl.fromTo(fl, fend, Object.assign({ duration: fpd, ease: fez, immediateRender: false }, fdr(null, fk, fout[0], fout[1])), tout);
      else if (f.out !== "cut" && fe > 0.02) tl.fromTo(fl, fend, Object.assign({ duration: fe, ease: "power3.inOut", immediateRender: false }, foff), tout);
      tl.set(fl, Object.assign({}, foff, { clipPath: "none" }), t1);
      return;
    }
    var d = Math.min(0.7, z.dur / 3), zin = place(z.amount);
    tl.fromTo(cam, REST, Object.assign({ duration: d, ease: "power2.inOut", immediateRender: false }, zin), z.start);
    tl.fromTo(cam, zin, Object.assign({ duration: d, ease: "power2.inOut", immediateRender: false }, REST), z.start + z.dur - d);
  });

  // ---------- Chia màn hình: minh hoạ trên, người nói dưới (16:9: minh hoạ trái, người nói phải) ----------
  var shift = WIDE ? Math.round(FW * 0.75 - (E.faceX == null ? 0.5 : E.faceX) * FW) : Math.round(FH * 0.75 - E.faceY * FH);
  E.splits.forEach(function (sp) {
    var d = Math.min(0.45, sp.dur / 4);
    var ax = WIDE ? "x" : "y", o0 = {}, o1 = {};
    o0[ax] = 0; o1[ax] = shift;
    tl.fromTo(cam, Object.assign({}, o0), Object.assign({ duration: d, ease: "power3.out", immediateRender: false }, o1), sp.start);
    tl.fromTo(cam, Object.assign({}, o1), Object.assign({ duration: d, ease: "power3.inOut", immediateRender: false }, o0), sp.start + sp.dur - d);
  });

  // ---------- Cảnh motion graphic nền đen ----------
  E.scenes.forEach(function (sc) {
    var root = document.getElementById(sc.id);
    if (!root) return;
    var s = sc.start, dur = sc.dur, end = s + dur;
    var cue = function (i, fb) { return s + (sc.cues && sc.cues[i] != null ? sc.cues[i] : fb); };
    var mt = document.getElementById("matte");
    if (mt && !sc.overlay) { tl.set(mt, { opacity: 0 }, s); tl.set(mt, { opacity: 1 }, end); }
    if (sc.type === "chips") {
      // Thẻ hiện lần lượt, con trỏ sáng chạy tới từng thẻ; cả cụm mờ ra cuối cảnh
      var chips = $$(".chip", root), cur = $(".chip-cursor", root), hd = $$(".sc-kicker, .sc-title", root);
      if (hd.length) tl.fromTo(hd, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, s);
      var gap = Math.min(0.9, Math.max(0.35, (dur - 1.2) / Math.max(chips.length, 1)));
      chips.forEach(function (ch, i) {
        var at = cue(i, 0.25 + i * gap); // giống chipTimes() trong runtime-times.js
        tl.fromTo(ch, { opacity: 0, x: 60, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, at);
        if (cur) tl.fromTo(cur, { opacity: 0, x: ch.offsetLeft + ch.offsetWidth - 20, y: ch.offsetTop + 70 },
          { opacity: 1, x: ch.offsetLeft + ch.offsetWidth - 40, y: ch.offsetTop + ch.offsetHeight / 2 - 29, duration: 0.3, ease: "power2.out", immediateRender: false }, at + 0.1);
      });
      if (cur) tl.to(cur, { opacity: 0, duration: 0.25 }, end - 0.5);
      tl.to(root, { opacity: 0, duration: 0.3, ease: "power1.in" }, end - 0.3);
      return;
    }
    if (sc.fadeIn) enter(root, sc.tIn, s);
    if (sc.fadeOut && sc.tIn !== "none") tl.to(root, { opacity: 0, duration: 0.3, ease: "power1.in" }, end - 0.3);
    tl.fromTo($(".glow", root), { scale: 0.9, opacity: 0.6 }, { scale: 1.08, opacity: 1, duration: dur, ease: "sine.inOut" }, s);
    var head = $$(".sc-kicker, .sc-title", root);
    if (head.length) tl.fromTo(head, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.1 }, s + 0.1);

    if (sc.type === "process") {
      var steps = $$(".step", root), links = $$(".link", root);
      var span = Math.max(0.6, dur - 1.8), n = Math.max(steps.length, 1);
      steps.forEach(function (st, i) {
        var at = cue(i, 0.6 + (i * span) / n);
        if (i > 0) tl.fromTo(links[i - 1], { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power2.inOut" }, at - 0.3);
        tl.fromTo(st, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, at);
        tl.fromTo(st, { borderColor: DIM_LINE }, { borderColor: GOLD_LINE, duration: 0.3, immediateRender: false }, at + 0.1);
        if (i > 0) tl.fromTo(steps[i - 1], { borderColor: GOLD_LINE }, { borderColor: DIM_LINE, duration: 0.3, immediateRender: false }, at + 0.1);
      });
    } else if (sc.type === "stat") {
      var num = $(".num", root), fill = $(".bar-fill", root), lab = $(".stat-label", root);
      var to = parseFloat(num.getAttribute("data-to")) || 0, dec = parseInt(num.getAttribute("data-dec"), 10) || 0;
      var proxy = { v: 0 }, at0 = cue(0, 0.5), cd = Math.min(1.4, dur * 0.4);
      var fmt = function () {
        num.textContent = proxy.v.toLocaleString("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      };
      tl.fromTo($(".stat-val", root), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, at0 - 0.1);
      tl.fromTo(proxy, { v: 0 }, { v: to, duration: cd, ease: "power2.out", onUpdate: fmt, onComplete: fmt }, at0);
      if (fill) tl.fromTo(fill, { scaleX: 0 }, { scaleX: parseFloat(fill.getAttribute("data-ratio")) || 0, duration: cd, ease: "power2.out" }, at0);
      if (lab) tl.fromTo(lab, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, at0 + cd * 0.6);
      tl.fromTo($(".stat-val", root), { scale: 1 }, { scale: 1.035, duration: Math.max(0.5, dur - cd - 1), ease: "sine.inOut", immediateRender: false }, at0 + cd);
    } else if (sc.type === "compare") {
      var before = $(".before", root), arrow = $(".arrow", root), afterC = $(".after", root);
      var tb = cue(0, 0.5), ta = cue(1, dur * 0.38), tf = cue(2, dur * 0.45);
      tl.fromTo(before, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, tb);
      tl.fromTo($$("li", before), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.15 }, tb + 0.2);
      tl.fromTo(arrow, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, ta);
      tl.fromTo(afterC, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tf);
      tl.fromTo($$("li", afterC), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.18 }, tf + 0.25);
    } else if (sc.type === "timeline") {
      var items = $$(".tl-item", root), prog = $(".tl-prog", root), m = Math.max(items.length, 1);
      var sp2 = Math.max(0.6, dur - 1.8), first = cue(0, 0.5), last = first;
      items.forEach(function (it, i) {
        var at = cue(i, 0.5 + (i * sp2) / m);
        last = Math.max(last, at);
        tl.fromTo(it, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, at);
        tl.fromTo($(".tl-dot", it), { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.4)" }, at);
      });
      tl.fromTo(prog, { scaleY: 0 }, { scaleY: 1, duration: last - first + 0.4, ease: "none" }, first);
    } else if (sc.type === "doc") {
      var doc = $(".doc", root), lines = $$(".ln", root), marks = $$(".mk", root), res = $(".result", root);
      tl.fromTo(doc, { opacity: 0, scaleY: 0.7, y: 40 }, { opacity: 1, scaleY: 1, y: 0, duration: 0.5, ease: "power3.out" }, s + 0.3);
      tl.fromTo(lines, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12 }, s + 0.7);
      if (marks.length) tl.fromTo(marks, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.inOut", stagger: 0.4 }, cue(0, dur * 0.45));
      if (res) tl.fromTo(res, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, cue(1, dur * 0.62));
    }
  });

  // ---------- Cảnh trám: hiệu ứng vào ----------
  (E.brolls || []).forEach(function (b) {
    enter(document.getElementById(b.id), b.tIn, b.start, b.tInDuration);
    // dời người trong lúc cảnh trám hiện (vd thu về góc dưới khi cảnh trám phủ kín / dải trên)
    if (b.cam && cam.length) jump(b.start, b.start + b.dur, moveTo(b.cam));
  });
  // Cảnh trám toàn màn hình che cả người: ẩn lớp người tách nền (z cao hơn cảnh trám) trong lúc cảnh trám hiện
  var matteEl = document.getElementById("matte");
  if (matteEl) (E.brolls || []).forEach(function (b) {
    if (!b.full || b.cam) return; // có dời người (thu về góc) → người vẫn hiện trên cảnh trám
    tl.set(matteEl, { opacity: 0 }, b.start);
    tl.set(matteEl, { opacity: 1 }, b.start + b.dur);
  });

  // ---------- Hiệu ứng hình trên cả khung (rung, lệch màu RGB, hạt nhiễu, biến dạng, dừng hình) ----------
  // đặt giá trị theo từng khung bằng số ngẫu nhiên có hạt giống: seek tới đâu cũng ra đúng hình đó
  (function () {
    var layers = [document.getElementById("cam"), document.getElementById("matte")].filter(Boolean).concat(trkCam);
    var FX_FPS = 30, seed = function (n) { return function () { n = (n + 0x6d2b79f5) | 0; var t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    (E.vfx || []).forEach(function (v, idx) {
      var rnd = seed(idx * 7919 + 1), n = Math.max(1, Math.round(v.dur * FX_FPS)), end = v.start + v.dur, a = v.amount, k;
      var fade = function (i) { return Math.min(1, (n - i) / Math.max(1, n * 0.25)); }; // dịu dần ở cuối
      if (v.type === "shake") {
        var amp = 6 + 34 * a;
        tl.set(layers, { "--fx-s": 1 + (amp * 2.2) / E.W }, v.start);
        for (k = 0; k < n; k++) tl.set(layers, { "--fx-x": ((rnd() - 0.5) * 2 * amp * fade(k)).toFixed(1) + "px", "--fx-y": ((rnd() - 0.5) * 2 * amp * fade(k)).toFixed(1) + "px" }, v.start + k / FX_FPS);
        tl.set(layers, { "--fx-x": "0px", "--fx-y": "0px", "--fx-s": 1 }, end);
      } else if (v.type === "lia") {
        // lia cả khung theo chữ / đồ hoạ: từ (x0, y0, s0) tới (x, y, s) trong v.vao giây, giữ tới hết rồi trả về (cắt)
        tl.fromTo(layers, { "--fx-x": v.x0 + "px", "--fx-y": v.y0 + "px", "--fx-s": v.s0 }, { "--fx-x": v.x + "px", "--fx-y": v.y + "px", "--fx-s": v.s, duration: Math.min(v.vao, v.dur), ease: v.ease || (v.y0 || v.x0 ? "power3.out" : "power2.inOut"), immediateRender: false }, v.start);
        tl.set(layers, { "--fx-x": "0px", "--fx-y": "0px", "--fx-s": 1 }, end);
      } else if (v.type === "rgb") {
        var fr = document.getElementById("fxRgbR"), fb = document.getElementById("fxRgbB"), off = 4 + 26 * a;
        tl.set(layers, { "--fx-filter": "url(#fxRgb)", "--fx-s": 1 + (off * 2.4) / E.W }, v.start);
        for (k = 0; k < n; k++) { var d = (off * (0.6 + 0.4 * rnd()) * fade(k)).toFixed(1); tl.set(fr, { attr: { dx: d } }, v.start + k / FX_FPS); tl.set(fb, { attr: { dx: -d } }, v.start + k / FX_FPS); }
        tl.set(layers, { "--fx-filter": "brightness(1)", "--fx-s": 1 }, end);
      } else if (v.type === "warp") {
        var ft = document.getElementById("fxWarpT"), fd = document.getElementById("fxWarpD"), sc = 8 + 56 * a;
        tl.set(layers, { "--fx-filter": "url(#fxWarp)", "--fx-s": 1 + (sc * 1.4) / E.W }, v.start);
        for (k = 0; k < n; k += 2) { tl.set(ft, { attr: { seed: 1 + Math.floor(rnd() * 90) } }, v.start + k / FX_FPS); tl.set(fd, { attr: { scale: (sc * fade(k)).toFixed(1) } }, v.start + k / FX_FPS); }
        tl.set(layers, { "--fx-filter": "brightness(1)", "--fx-s": 1 }, end);
      } else if (v.type === "pixel") {
        // độ phân giải thấp (144p, 240p…): ô vuông cạnh 2–32px; ô dưới 6px thì nhoè như video phóng từ bản nhỏ
        var bs = Math.round(2 + 30 * a);
        if (bs >= 6) {
          // vỡ mạnh (từ 0,4) thêm giảm số màu như video 144p
          var px = a >= 0.4 ? "fxPixP" : "fxPix";
          tl.set(document.getElementById(px + "F"), { attr: { x: Math.floor(bs / 2), y: Math.floor(bs / 2) } }, v.start);
          tl.set(document.getElementById(px + "C"), { attr: { width: bs, height: bs } }, v.start);
          tl.set(document.getElementById(px + "M"), { attr: { radius: bs / 2 } }, v.start);
          tl.set(document.getElementById(px + "B"), { attr: { stdDeviation: (bs * 0.35).toFixed(1) } }, v.start); // màu trung bình mỗi ô, không lấm tấm
          tl.set(layers, { "--fx-filter": "url(#" + px + ")" }, v.start);
        } else tl.set(layers, { "--fx-filter": "blur(" + (bs * 0.6).toFixed(1) + "px)" }, v.start);
        // nối liền mức sau (144p → 240p…): không trả về nét ở giữa, kẻo đè lên mức sau cùng thời điểm
        var noi = (E.vfx || []).some(function (w) { return w !== v && w.type === "pixel" && Math.abs(w.start - end) < 0.02; });
        if (!noi) tl.set(layers, { "--fx-filter": "brightness(1)" }, end);
      } else if (v.type === "grain") {
        var gr = document.getElementById("fxGrain");
        tl.set(gr, { opacity: 0.2 + 0.6 * a }, v.start);
        for (k = 0; k < n; k++) tl.set(gr, { x: Math.round((rnd() - 0.5) * 300), y: Math.round((rnd() - 0.5) * 300) }, v.start + k / FX_FPS);
        tl.set(gr, { opacity: 0 }, end);
      } else if (v.type === "freeze") {
        var mt = document.getElementById("matte"); // ảnh dừng che video, người tách nền cũng phải ẩn
        if (mt) { tl.set(mt, { opacity: 0 }, v.start); tl.set(mt, { opacity: 1 }, end); }
      }
    });
    (E.dissolves || []).forEach(function (d) {
      var el = document.getElementById(d.id);
      if (el) tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: d.dur, ease: "none", immediateRender: false }, d.start);
    });
  })();

  // ---------- Chuyển cảnh ở điểm cắt lời nói ----------
  var tr = document.getElementById("trLayer"), frame = [document.getElementById("camFrame"), document.getElementById("matteFrame")].filter(Boolean);
  (E.cuts || []).forEach(function (c) {
    var t = c.t;
    if (c.type === "fade") {
      tl.fromTo(tr, { opacity: 0, backgroundColor: "#000", backgroundImage: "none", mixBlendMode: "normal" }, { opacity: 1, duration: 0.12, ease: "power1.in", immediateRender: false }, t - 0.12);
      tl.to(tr, { opacity: 0, duration: 0.2, ease: "power1.out" }, t);
    } else if (c.type === "flash") {
      tl.fromTo(tr, { opacity: 0, backgroundColor: "#fff", backgroundImage: "none", mixBlendMode: "normal" }, { opacity: 1, duration: 0.06, immediateRender: false }, t - 0.06);
      tl.to(tr, { opacity: 0, duration: 0.32, ease: "power2.out" }, t + 0.06);
    } else if (c.type === "zoom") {
      tl.fromTo(frame, { scale: 1.09 }, { scale: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
    } else if (c.type === "spin") {
      // xoáy nhoè: cảnh cũ xoay + phóng + nhoè 2 khung trước điểm cắt, cảnh mới xoay ngược về thẳng 5 khung
      tl.fromTo(frame, { rotation: 0, scale: 1, filter: "blur(0px)" }, { rotation: -24, scale: 1.4, filter: "blur(14px)", duration: 0.09, ease: "power2.in", immediateRender: false }, t - 0.09);
      tl.fromTo(frame, { rotation: 22, scale: 1.35, filter: "blur(16px)" }, { rotation: 0, scale: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out", immediateRender: false }, t);
    } else if (c.type === "zoomblur") {
      // phóng nhoè: cảnh cũ phóng vào tâm 3 khung, cảnh mới từ phóng to nhoè về nét 3 khung; tia sáng toả từ tâm chớp qua điểm cắt
      tl.fromTo(frame, { scale: 1, filter: "blur(0px)" }, { scale: 1.7, filter: "blur(12px)", duration: 0.12, ease: "power2.in", immediateRender: false }, t - 0.12);
      tl.fromTo(frame, { scale: 1.6, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 0.13, ease: "power2.out", immediateRender: false }, t);
      tl.set(tr, { backgroundColor: "rgba(0,0,0,0)", mixBlendMode: "screen", backgroundSize: "100% 100%", backgroundPosition: "50% 50%",
        backgroundImage: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(255,255,255,.28) 1.5deg, rgba(255,255,255,0) 3deg 7deg), radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0, rgba(255,255,255,0) 14%, rgba(255,255,255,.12) 60%)" }, t - 0.09);
      tl.fromTo(tr, { opacity: 0, scale: 1, filter: "blur(3px)" }, { opacity: 0.7, scale: 1.4, filter: "blur(3px)", duration: 0.09, ease: "power1.in", immediateRender: false }, t - 0.09);
      tl.to(tr, { opacity: 0, scale: 1.8, duration: 0.12, ease: "power1.out" }, t);
      tl.set(tr, { scale: 1, filter: "none" }, t + 0.13);
    } else if (c.type === "glare") {
      // loé sáng quét ngang: quầng trắng mềm tràn từ mép phải vào 4 khung (cả khung sáng lên), phủ gần kín ở điểm cắt, cảnh mới lộ ra khi quầng lùi về mép phải 3 khung
      var gi = 0.16, go = c.dur || 0.1;
      tl.set(tr, { opacity: 1, backgroundColor: "rgba(0,0,0,0)", mixBlendMode: "normal", backgroundSize: "300% 100%",
        backgroundImage: "linear-gradient(90deg, rgba(255,250,242,0) 0%, rgba(255,250,242,0) 33%, rgba(255,248,238,.55) 48%, rgba(255,250,244,.96) 62%, #FFFBF6 100%)" }, t - gi);
      tl.fromTo(tr, { backgroundPosition: "0% 0%" }, { backgroundPosition: "62% 0%", duration: gi, ease: "power1.in", immediateRender: false }, t - gi);
      tl.to(tr, { backgroundPosition: "0% 0%", duration: go, ease: "power2.out" }, t);
      tl.fromTo(frame, { filter: "brightness(1)" }, { filter: "brightness(1.35)", duration: gi, ease: "power1.in", immediateRender: false }, t - gi);
      tl.to(frame, { filter: "brightness(1)", duration: go, ease: "power2.out" }, t);
      tl.set(tr, { opacity: 0, clearProps: "backgroundColor,mixBlendMode,backgroundSize,backgroundImage,backgroundPosition" }, t + go + 0.01);
    } else if (c.type === "blur") {
      tl.fromTo(frame, { filter: "blur(14px)" }, { filter: "blur(0px)", duration: c.dur || 0.3, ease: "power2.out", immediateRender: false }, t);
    } else if (c.type === "smear") {
      // vệt nhoè dọc: khung kéo giãn + nhoè rồi bật về (như lướt nhanh màn hình)
      var sd = c.dur || 0.12;
      tl.fromTo(frame, { filter: "blur(16px) brightness(1.15)", scaleY: 1.35, y: -120 }, { filter: "blur(0px) brightness(1)", scaleY: 1, y: 0, duration: sd, ease: "power2.out", immediateRender: false }, t);
    } else if (c.type === "slide") {
      tl.fromTo(frame, { x: 90 }, { x: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, t);
    } else if (c.type === "leak") {
      // vệt sáng cam (light leak): loang chéo từ góc dưới trái lên, hoà sáng (screen); điểm cắt nằm giữa vệt
      var ld = c.dur || 0.7;
      // đặt nền bằng set: fromTo bỏ các thuộc tính chỉ có ở from nên lớp chuyển sẽ giữ nền đen
      tl.set(tr, {
        backgroundColor: "rgba(0,0,0,0)", mixBlendMode: "screen", backgroundSize: "220% 220%",
        backgroundImage: "radial-gradient(ellipse 62% 48% at 50% 50%, rgba(255,235,150,1), rgba(255,165,50,.95) 38%, rgba(235,70,40,.7) 68%, rgba(200,40,40,.28) 100%)",
      }, t - ld * 0.45);
      tl.fromTo(tr, { opacity: 0, backgroundPosition: "0% 100%" }, { opacity: 1, backgroundPosition: "45% 55%", duration: ld * 0.45, ease: "power1.out", immediateRender: false }, t - ld * 0.45);
      tl.to(tr, { opacity: 0, backgroundPosition: "100% 0%", duration: ld * 0.55, ease: "power1.in" }, t);
      tl.set(tr, { clearProps: "backgroundColor,mixBlendMode,backgroundSize,backgroundImage,backgroundPosition" }, t + ld * 0.55 + 0.01);
    }
  });

  // Lắc theo "máy quay ảo" của từng cảnh: biên độ / chu kỳ cố định theo số thứ tự cảnh (render lặp lại y hệt)
  function swayLine(el, c, cend) {
    var k = c.segIdx || 0, amp = Math.min((c.room || 200) * 0.5, (c.sway == null ? 1 : c.sway) * (28 + ((k * 17) % 34))), per = 1.9 + ((k * 0.37) % 0.8), ph = k * 1.7;
    if (!amp) return;
    var pr = { t: c.start };
    var draw = function () {
      var u = pr.t - (c.segStart || 0);
      gsap.set(el, { x: amp * Math.sin((2 * Math.PI * u) / per + ph) });
    };
    tl.fromTo(pr, { t: c.start }, { t: cend, duration: Math.max(0.1, cend - c.start), ease: "none", immediateRender: false, onUpdate: draw, onStart: draw }, c.start);
  }

  // ---------- Phụ đề karaoke ----------
  var style = E.capStyle || "pill";
  var base = E.capColor || "#fff", act = E.capActive || "#F6E96B";
  var on = style === "pill" ? { backgroundColor: act, color: "#111", scale: 1.04 }
    : style === "bold" ? { color: act, scale: 1.14, backgroundColor: "rgba(0,0,0,0)" }
    : { color: act, scale: 1, backgroundColor: "rgba(0,0,0,0)" };
  var off = { backgroundColor: "rgba(0,0,0,0)", color: base, scale: 1 };
  // reveal: từ chưa nói ẩn hẳn, hiện đúng lúc nói và giữ tới hết dòng (phụ đề cộng dồn từng từ)
  if (E.capReveal) { on.opacity = 1; off.opacity = 0; }
  (E.caps || []).forEach(function (c) {
    var el = document.getElementById("cap-" + c.id);
    if (!el) return;
    if (style === "stack") {
      // Hàng đầu của khối bay từ xa tới (nhỏ, mờ, nhạt → to, rõ, trôi lên);
      // các từ sau trượt ngang có vệt nhoè; khối ở lại rồi nhoè trượt ra.
      var sws = el.querySelectorAll(".cw"), sline = el.querySelector(".cap-line");
      var firstRow = el.querySelector(".cs-row"), heroN = firstRow ? firstRow.querySelectorAll(".cw").length : 1;
      var cend = c.start + (c.dur || 2);
      tl.set(sws, { opacity: 0 }, c.start);
      if (c.single) {
        // từng từ một tại cùng một chỗ: bật ra (phóng nhẹ) rồi nhường cho từ sau
        c.words.forEach(function (w, i) {
          if (!sws[i]) return;
          var t = c.start + w[0], nx = c.words[i + 1] ? c.start + c.words[i + 1][0] : cend;
          tl.fromTo(sws[i], { opacity: 0, scale: 0.7, filter: "blur(6px)" },
            { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.12, ease: "power3.out", immediateRender: false }, t);
          tl.fromTo(sws[i], { scale: 1 }, { scale: 1.08, duration: Math.max(0.1, nx - t), ease: "none", immediateRender: false }, t + 0.12);
          tl.to(sws[i], { opacity: 0, duration: 0.03 }, Math.max(t + 0.14, nx - 0.04)); // tắt hẳn trước khi từ sau hiện, không chồng hình
        });
        return;
      }
      c.words.forEach(function (w, i) {
        if (!sws[i]) return;
        var t = c.start + w[0];
        if (i < heroN && c.n > 0) {
          // hàng đầu của khối lao ra từ sát máy quay: to, nhoè → nét (giống "let me", "why", "AI" trong video mẫu)
          tl.fromTo(sws[i], { opacity: 0, scale: 1.8, y: -50, filter: "blur(16px)" },
            { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out", immediateRender: false }, t);
        } else if (i < heroN) {
          // khối mở đầu video bay từ xa tới trong ~1s: nhỏ, tối, mờ (như ở xa sau người nói) → to, rõ, bay lên vị trí
          tl.fromTo(sws[i], { opacity: 0.35, scale: 0.42, y: 260, filter: "blur(8px) grayscale(1) brightness(.6)" },
            { opacity: 1, scale: 1, y: 0, filter: "blur(0px) grayscale(0) brightness(1)", duration: 0.95, ease: "power2.out", immediateRender: false }, t);
        } else {
          // các từ sau lướt vào từ 2 bên với vệt nhoè kéo giãn ngang rất mạnh
          var dir = i % 2 ? 1 : -1;
          tl.fromTo(sws[i], { opacity: 0, x: 240 * dir, scaleX: 2.1, filter: "blur(12px)" },
            { opacity: 1, x: 0, scaleX: 1, filter: "blur(0px)", duration: 0.24, ease: "power3.out", immediateRender: false }, t);
        }
        if (sws[i].classList.contains("fx-glitch")) {
          tl.fromTo(sws[i], { skewX: 18 }, { skewX: 0, duration: 0.3, ease: "steps(6)", immediateRender: false }, t);
        }
      });
      // Cả khối: trôi lên + phóng to dần suốt lúc đứng (đo từ video mẫu: ~100–200px lên, +15% cỡ),
      // cộng lắc ngang theo nhịp bước của "máy quay ảo" của cảnh.
      var hold = Math.max(0.6, cend - c.start);
      var rise = Math.min(220, 70 + hold * 45);
      tl.fromTo(sline, { y: rise * 0.45, scale: 0.94 }, { y: -rise * 0.55, scale: 1.12, duration: hold, ease: "power1.out", immediateRender: false }, c.start);
      swayLine(sline, c, cend);
      // Từng từ trôi MỘT CHIỀU theo hướng riêng (thị sai 3D): từ lẻ sang phải, từ chẵn sang trái,
      // biên độ khác nhau theo vị trí — các từ tách dần khỏi nhau như trong video mẫu.
      Array.prototype.forEach.call(el.querySelectorAll(".cwm"), function (wr, i) {
        // cùng hàng trôi cùng hướng (từ sau trôi xa hơn → giãn ra, không đâm vào nhau); hàng kế tiếp trôi ngược hướng
        var row = +wr.getAttribute("data-r") || 0, k = +wr.getAttribute("data-k") || 0;
        var s = (row + c.n) % 2 ? 1 : -1, d = Math.min((c.room || 200) * 0.45, 25 + ((c.n * 29 + row * 47) % 40) + k * 18), up = ((i * 13 + c.n * 5) % 24) - 12;
        tl.fromTo(wr, { x: -d * 0.35 * s, y: 0 }, { x: d * s, y: up, duration: hold, ease: "sine.out", immediateRender: false }, c.start);
      });
      if (c.atCut) {
        // tới điểm cắt: bị hút về phía máy quay (phóng to + nhoè)
        tl.to(sws, { opacity: 0, scale: 1.6, filter: "blur(18px)", duration: 0.18, ease: "power2.in" }, Math.max(c.start + 0.5, cend - 0.15));
      } else {
        // nhường chỗ khối mới: các từ mờ đi lần lượt gần như tại chỗ (nhoè nhẹ, dịch rất ít)
        tl.to(sws, { opacity: 0, x: function (i) { return i % 2 ? 30 : -30; }, scale: 0.96, filter: "blur(8px)", duration: 0.16, ease: "power1.in", stagger: 0.07 },
          Math.max(c.start + 0.5, cend - 0.16 - 0.07 * (sws.length - 1)));
      }
      return;
    }
    var line = el.querySelector(".cap-line"), ws = el.querySelectorAll(".cw");
    if (E.capEnter === "none") tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.01 }, c.start);
    else tl.fromTo(line, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, c.start);
    c.words.forEach(function (w, i) {
      var span = ws[i];
      if (!span) return;
      if (E.capReveal) tl.set(span, { opacity: 0 }, c.start);
      var nextStart = c.words[i + 1] ? c.words[i + 1][0] : w[1] + 0.25;
      tl.fromTo(span, off, Object.assign({ duration: 0.07, ease: "power1.out", immediateRender: false }, on), c.start + w[0]);
      // fill: từ đã nói giữ màu "đang nói" (tô dần cả dòng) thay vì trả về màu thường
      if (!E.capFill) tl.fromTo(span, on, Object.assign({ duration: 0.07, ease: "power1.in", immediateRender: false }, off), c.start + Math.max(w[0] + 0.07, nextStart));
    });
  });
  // Loé màu cả khung đúng lúc nói từ có hiệu ứng "flash"
  var fl = document.getElementById("flashLayer");
  (E.flashes || []).forEach(function (f) {
    var c = (E.caps || []).filter(function (x) { return x.id === f.cap; })[0];
    if (!c || !fl || !c.words[f.i]) return;
    var t = c.start + c.words[f.i][0];
    tl.fromTo(fl, { opacity: 0, backgroundColor: f.color }, { opacity: 0.42, duration: 0.08, ease: "power1.out", immediateRender: false }, t);
    tl.to(fl, { opacity: 0, duration: 0.6, ease: "power2.in" }, t + 0.35);
  });

  // ---------- Khối đồ hoạ tự do (mẫu / AI tự vẽ) ----------
  // fx vào: pop | fade | rise | drop | left | right | mask | blur | none · out: fade | pop | drop | none
  // anim: [{ sel, from, to, at | cue, dur, ease, stagger, set }] — mốc tính từ lúc khối bắt đầu
  var SVGNS = "http://www.w3.org/2000/svg", fxN = 0;
  var prng = function (n) { return function () { n = (n + 0x6d2b79f5) | 0; var t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // nhiều hiệu ứng cùng lọc 1 phần tử: mỗi hiệu ứng giữ 1 khoá, nối lại thành 1 chuỗi filter
  function setF(n, k, v) {
    var f = n.__fl || (n.__fl = {});
    if (v) f[k] = v; else delete f[k];
    n.style.filter = Object.keys(f).map(function (x) { return f[x]; }).join(" ");
  }
  function addFilter(el, inner, box) {
    var id = "tf" + (++fxN), svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0");
    svg.innerHTML = '<filter id="' + id + '" ' + (box || 'x="-40%" y="-40%" width="180%" height="180%"') + ' color-interpolation-filters="sRGB">' + inner + "</filter>";
    el.appendChild(svg);
    return { id: id, url: "url(#" + id + ")", f: svg.firstChild };
  }
  // tách chữ: chars | words | lines. Theo cụm ký tự (giữ dấu tiếng Việt), mỗi từ không bẻ dòng giữa từ; dòng tách theo <br> để không phụ thuộc lúc font tải xong
  var graphemes = function (w) {
    w = w.normalize("NFC");
    if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(w), function (x) { return x.segment; });
    return Array.from(w);
  };
  function splitLines(n) {
    var run = [], out = [], flush = function (before) {
      if (!run.length) return;
      var l = document.createElement("span"); l.className = "sp-l"; n.insertBefore(l, before); run.forEach(function (c) { l.appendChild(c); }); out.push(l); run = [];
    };
    Array.prototype.slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeName === "BR") { flush(c); n.removeChild(c); } else run.push(c);
    });
    flush(null);
    return out;
  }
  function splitWords(n, chars) {
    var walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), nodes = [], c;
    while ((c = walk.nextNode())) if (!c.parentNode.closest("svg,style")) nodes.push(c);
    nodes.forEach(function (t) {
      var fr = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { fr.appendChild(document.createTextNode(" ")); return; }
        var sp = document.createElement("span"); sp.className = "sp-w";
        if (chars) graphemes(w).forEach(function (g) { var ch = document.createElement("span"); ch.className = "sp-c"; ch.textContent = g; sp.appendChild(ch); });
        else sp.textContent = w.normalize("NFC");
        fr.appendChild(sp);
      });
      t.parentNode.replaceChild(fr, t);
    });
  }
  function splitText(tg, kind) {
    var out = [];
    tg.forEach(function (n) {
      var done = n.__sp || (n.__sp = {});
      if (kind === "lines") { done.lines = done.lines || splitLines(n); out = out.concat(done.lines); return; }
      if (!done.text) { splitWords(n, true); done.text = 1; } // luôn tách tới ký tự để nhiều chuyển động cùng dùng được
      out = out.concat($$(kind === "words" ? ".sp-w" : ".sp-c", n));
    });
    return out;
  }
  // trễ từng phần theo thứ tự: start | end | center | edges | random
  function orderDelays(n, a, sd) {
    var each = a.stagger || 0, o = a.order || "start", d = [], i, mid = (n - 1) / 2;
    if (o === "random") {
      var rnd = prng(sd), idx = []; for (i = 0; i < n; i++) idx.push(i);
      for (i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), x = idx[i]; idx[i] = idx[j]; idx[j] = x; }
      idx.forEach(function (v, k) { d[v] = k; });
    } else for (i = 0; i < n; i++) d[i] = o === "end" ? n - 1 - i : o === "center" ? Math.abs(i - mid) : o === "edges" ? mid - Math.abs(i - mid) : i;
    return d.map(function (v) { return v * each; });
  }
  // nhoè theo hướng thật: trung bình các bản dịch dọc 1 vector (Premiere Directional Blur, After Effects Motion Blur)
  function dirFilter(el, n, maxLen) {
    var N = 8, s = "", i;
    for (i = 0; i < N; i++) s += '<feOffset in="SourceGraphic" dx="0" dy="0" result="o' + i + '"/>' +
      (i ? '<feComposite in="r' + (i - 1) + '" in2="o' + i + '" operator="arithmetic" k1="0" k2="' + (i / (i + 1)).toFixed(4) + '" k3="' + (1 / (i + 1)).toFixed(4) + '" k4="0" result="r' + i + '"/>' : '<feMerge result="r0"><feMergeNode in="o0"/></feMerge>');
    var pad = Math.min(700, Math.ceil(120 * maxLen / Math.max(20, Math.min(n.offsetWidth || 200, n.offsetHeight || 80))));
    var F = addFilter(el, s, 'x="-' + pad + '%" y="-' + pad + '%" width="' + (100 + 2 * pad) + '%" height="' + (100 + 2 * pad) + '%"'), off = Array.prototype.slice.call(F.f.querySelectorAll("feOffset"));
    return function (dx, dy) {
      off.forEach(function (o, i) { var k = i / (N - 1) - 0.5; o.setAttribute("dx", (dx * k).toFixed(2)); o.setAttribute("dy", (dy * k).toFixed(2)); });
      setF(n, "dir", Math.hypot(dx, dy) > 0.6 ? F.url : "");
    };
  }
  // kiểu chữ nhiều lớp: nhiều viền chồng nhau, bóng trong, vát nổi (Layer Styles)
  function styleFilter(el, st) {
    var s = "", merge = "", r = 0;
    (st.strokes || []).forEach(function (x, i) {
      r += x[0];
      s = '<feMorphology in="SourceAlpha" operator="dilate" radius="' + r + '" result="d' + i + '"/><feFlood flood-color="' + x[1] + '" result="c' + i + '"/><feComposite in="c' + i + '" in2="d' + i + '" operator="in" result="s' + i + '"/>' + s;
      merge = '<feMergeNode in="s' + i + '"/>' + merge;
    });
    merge += '<feMergeNode in="SourceGraphic"/>';
    if (st.inner) {
      var q = st.inner;
      s += '<feComponentTransfer in="SourceAlpha" result="na"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer><feOffset in="na" dx="' + (q.x || 0) + '" dy="' + (q.y || 0) + '" result="no"/><feGaussianBlur in="no" stdDeviation="' + (q.blur || 4) + '" result="nb"/><feFlood flood-color="' + (q.color || "#000") + '" result="nc"/><feComposite in="nc" in2="nb" operator="in" result="ni"/><feComposite in="ni" in2="SourceAlpha" operator="in" result="inner"/>';
      merge += '<feMergeNode in="inner"/>';
    }
    if (st.bevel) {
      var v = st.bevel;
      s += '<feGaussianBlur in="SourceAlpha" stdDeviation="' + (v.size || 3) + '" result="ba"/><feSpecularLighting in="ba" surfaceScale="' + (v.depth || 5) + '" specularConstant="' + (v.light || 0.8) + '" specularExponent="18" lighting-color="#fff" result="sp"><feDistantLight azimuth="' + (v.angle == null ? 235 : v.angle) + '" elevation="45"/></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="bv"/>';
      merge += '<feMergeNode in="bv"/>';
    }
    return addFilter(el, s + "<feMerge>" + merge + "</feMerge>");
  }
  // tia hạt bung từ giữa phần tử; góc, quãng đường theo seed nên seek tới khung nào cũng giống nhau
  function burst(n, el, q, t, dur, sd) {
    var rnd = prng(sd), cnt = Math.min(60, q.n || 12), dist = q.dist || 160, size = q.size || 10;
    if (getComputedStyle(n).position === "static") n.style.position = "relative";
    for (var i = 0; i < cnt; i++) {
      var d = document.createElement("span"), ang = (i / cnt + rnd() * 0.08) * Math.PI * 2, far = dist * (0.55 + rnd() * 0.45);
      d.className = "sp-dot"; d.style.cssText = "width:" + size + "px;height:" + size + "px;margin:-" + size / 2 + "px;background:" + (q.color || "currentColor");
      n.appendChild(d);
      tl.set(d, { opacity: 0 }, b0);
      tl.set(d, { opacity: 1 }, t);
      tl.fromTo(d, { x: 0, y: 0, scale: 1 }, { x: Math.cos(ang) * far, y: Math.sin(ang) * far, scale: 0.3, duration: dur, ease: "power3.out", immediateRender: false }, t);
      tl.to(d, { opacity: 0, duration: dur * 0.45, ease: "power1.in" }, t + dur * 0.55);
    }
  }
  var b0 = 0;

  (E.blocks || []).forEach(function (b, bIdx) {
    var el = document.getElementById(b.id);
    if (!el) return;
    var inner = $(".blk-in", el) || el, s = b.start, end = b.start + b.dur;
    // dời người nói (cắt thẳng) trong lúc khối hiện: tâm mặt tới faceTo × bề ngang khung
    if (b.cam && cam.length) jump(s, end, moveTo(b.cam));
    b0 = s;
    if (b.blend) el.style.mixBlendMode = b.blend; // Screen, Multiply…; chữ trắng trên nền đen + multiply = video nằm trong chữ
    // bám theo người / vật: dời, phóng, xoay cả khối quanh điểm đầu theo các mốc đo bằng editor/tools/theo-doi.mjs
    var obj = $(".trk-obj", el);
    if (obj && b.follow.length > 1) {
      var k0 = b.follow[0], fv = function (k) { return { "--tkx": (k[1] - k0[1]) + "px", "--tky": (k[2] - k0[2]) + "px", "--tks": (k[3] || 1) / (k0[3] || 1), "--tkr": ((k[4] || 0) - (k0[4] || 0)).toFixed(2) + "deg" }; };
      obj.style.transformOrigin = k0[1] + "px " + k0[2] + "px";
      tl.set(obj, fv(k0), s);
      b.follow.slice(1).forEach(function (k, i) {
        var p = b.follow[i];
        tl.to(obj, Object.assign(fv(k), { duration: Math.max(0.001, k[0] - p[0]), ease: "none" }), s + p[0]);
      });
    }
    // tách chữ trước mọi chuyển động để sel có thể trỏ .sp-c / .sp-w / .sp-l
    (b.anim || []).forEach(function (a) { if (a.split) splitText(a.sel ? $$(a.sel, el) : [inner], a.split); });
    var IN = {
      pop: [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(1.8)" }],
      fade: [{ opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }],
      rise: [{ opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }],
      drop: [{ opacity: 0, y: -80 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }],
      left: [{ opacity: 0, x: -140 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }],
      right: [{ opacity: 0, x: 140 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }],
      mask: [{ clipPath: "inset(100% -10% -10% -10%)", y: 40 }, { clipPath: "inset(-10% -10% -10% -10%)", y: 0, duration: 0.3, ease: "power3.out" }],
      blur: [{ opacity: 0, filter: "blur(18px)", scale: 1.06 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.3, ease: "power2.out" }],
    };
    // lia cả khung (như camera lướt sang cảnh khác): khối trượt nguyên khung hình vào / ra trong 0,5s
    var PAN = { "pan-up": { y: FH }, "pan-down": { y: -FH }, "pan-left": { x: FW }, "pan-right": { x: -FW } };
    var PD = Math.min(0.5, b.dur / 3);
    // "pan": lia theo vector bất kỳ (cả chéo) — b.pan {x, y} = hướng nội dung trượt, b.panDur giây (mặc định 0,6), power2.inOut
    var PV = b.pan || { x: 0, y: -FH }, PVD = Math.min(Number(b.panDur) || 0.6, b.dur / 2);
    var fin = IN[b.fx];
    if (b.fx === "pan") tl.fromTo(inner, { x: -PV.x, y: -PV.y }, { x: 0, y: 0, duration: PVD, ease: "power2.inOut", immediateRender: true }, s);
    else if (PAN[b.fx]) tl.fromTo(inner, Object.assign({}, PAN[b.fx]), { x: 0, y: 0, duration: PD, ease: "power3.inOut", immediateRender: true }, s);
    else if (fin) tl.fromTo(inner, fin[0], Object.assign({ immediateRender: true }, fin[1]), s);
    (b.anim || []).forEach(function (a, aIdx) {
      // mốc: tính từ lúc khối hiện · end: true = số giây TRƯỚC khi khối hết (chuyển động ra) · span: true = kéo dài tới hết khối
      var t = a.end ? end - (a.at || 0) : s + (a.cue != null && b.cues && b.cues[a.cue] != null ? b.cues[a.cue] : a.at || 0);
      if (a.span) a = Object.assign({}, a, { dur: Math.max(0.05, end - (a.stop || 0) - t) }); // stop: dừng trước khi khối hết (vd khung lia ra)
      var tg = a.sel ? $$(a.sel, el) : [inner];
      if (a.split) tg = splitText(tg, a.split);
      if (!tg.length) return;
      var sd = (bIdx + 1) * 7919 + aIdx * 131 + 7, dly = orderDelays(tg.length, a, sd);
      if (a.textStyle) { var TS = styleFilter(el, a.textStyle); tg.forEach(function (n) { setF(n, "ts", TS.url); }); }
      // rung nét: đổi hạt nhiễu theo nhịp (boil), nét chữ sống mà vị trí không đổi
      if (a.boil) {
        var BF = addFilter(el, '<feTurbulence type="fractalNoise" baseFrequency="' + (a.freq || 0.03) + '" numOctaves="2" seed="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" xChannelSelector="R" yChannelSelector="G" scale="' + a.boil + '"/>'), tb = BF.f.querySelector("feTurbulence"), rb = prng(sd);
        tg.forEach(function (n) { setF(n, "boil", BF.url); });
        for (var ib = 0, nb = Math.min(600, Math.ceil(a.dur * (a.rate || 12))); ib < nb; ib++) tl.set(tb, { attr: { seed: 1 + Math.floor(rb() * 90) } }, t + ib / (a.rate || 12));
      }
      // nhúc nhích ngẫu nhiên từng phần (wiggle): [px, độ], chạy trên translate / rotate riêng nên không đè x, y của chuyển động khác
      if (a.wiggle) {
        var rw = prng(sd + 1), wr = a.rate || 8, wn = Math.min(240, Math.ceil(a.dur * wr));
        tg.forEach(function (n) {
          n.classList.add("wgl");
          for (var iw = 0; iw < wn; iw++) {
            var vw = { "--wx": ((rw() - 0.5) * 2 * a.wiggle[0]).toFixed(1) + "px", "--wy": ((rw() - 0.5) * 2 * a.wiggle[0]).toFixed(1) + "px", "--wr": ((rw() - 0.5) * 2 * (a.wiggle[1] || 0)).toFixed(1) + "deg" };
            if (a.hold) tl.set(n, vw, t + iw / wr); else tl.to(n, Object.assign(vw, { duration: 1 / wr, ease: "sine.inOut" }), t + iw / wr);
          }
        });
      }
      // vẽ nét: path, hoặc chữ SVG (len = độ dài nét px) — Trim Paths, Stroke write-on
      if (a.draw) tg.forEach(function (n, i) {
        var len = a.len || 1, pr = { v: a.draw[0] };
        if (!a.len) n.setAttribute("pathLength", "1");
        var ve = function () { n.style.strokeDasharray = (pr.v * len).toFixed(3) + " " + len * 1.05; n.style.strokeOpacity = pr.v > 0.0005 ? "" : 0; };
        ve();
        tl.fromTo(pr, { v: a.draw[0] }, { v: a.draw[1], duration: a.dur, ease: a.ease, immediateRender: false, onUpdate: ve, onStart: ve, onComplete: ve }, t + dly[i]);
      });
      // chữ chạy theo đường: startOffset của <textPath>, tính bằng %
      if (a.pathOffset) tg.forEach(function (n, i) {
        var pr = { v: a.pathOffset[0] }, ve = function () { n.setAttribute("startOffset", pr.v.toFixed(2) + "%"); };
        ve();
        tl.fromTo(pr, { v: a.pathOffset[0] }, { v: a.pathOffset[1], duration: a.dur, ease: a.ease, immediateRender: false, onUpdate: ve, onStart: ve, onComplete: ve }, t + dly[i]);
      });
      if (a.burst) tg.forEach(function (n, i) { burst(n, el, a.burst, t + dly[i], a.dur, sd + i); });
      // nhoè một hướng đặt tay: dblur [đầu, cuối] px, angle độ (0 = ngang, 90 = dọc)
      if (a.dblur) tg.forEach(function (n, i) {
        var ang = (a.angle || 0) * Math.PI / 180, set = dirFilter(el, n, Math.max(a.dblur[0], a.dblur[1])), pr = { v: a.dblur[0] }, ve = function () { set(Math.cos(ang) * pr.v, Math.sin(ang) * pr.v); };
        tl.fromTo(pr, { v: a.dblur[0] }, { v: a.dblur[1], duration: a.dur, ease: a.ease, immediateRender: false, onUpdate: ve, onStart: ve, onComplete: ve }, t + dly[i]);
      });
      // nhoè theo tốc độ thật của chính chuyển động: mblur = màn trập (0,5 = 180°), vector tính từ đường cong nên seek tới đâu cũng đúng
      if (a.mblur && a.from) {
        var mx = (Number(a.to.x) || 0) - (Number(a.from.x) || 0), my = (Number(a.to.y) || 0) - (Number(a.from.y) || 0), ef = gsap.parseEase(a.ease), dp = 1 / (30 * Math.max(0.03, a.dur));
        if (mx || my) tg.forEach(function (n, i) {
          var maxS = 0, q; for (q = 0; q <= 1; q += 0.05) maxS = Math.max(maxS, Math.abs(ef(Math.min(1, q + dp)) - ef(q)));
          var set = dirFilter(el, n, Math.hypot(mx, my) * maxS * a.mblur + 2), pr = { p: 0 };
          var ve = function () { var p = pr.p, de = p >= 1 ? 0 : ef(p) - ef(Math.max(0, p - dp)); set(mx * de * a.mblur, my * de * a.mblur); };
          tl.fromTo(pr, { p: 0 }, { p: 1, duration: a.dur, ease: "none", immediateRender: false, onUpdate: ve, onComplete: ve }, t + dly[i]);
        });
      }
      // hblur: [đầu, cuối] nhoè một chiều theo trục ngang · bend: [đầu, cuối] uốn cong đường chân chữ (px, âm = cong xuống) · warp: [đầu, cuối] méo nhiễu làm chữ nát mảng (px), đi cùng chuyển động này
      if (a.hblur || a.bend || a.warp) {
        var NS = "http://www.w3.org/2000/svg", hid = "hb" + (window.__hbN = (window.__hbN || 0) + 1), hsvg = document.createElementNS(NS, "svg");
        var cong = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none"><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#6e6e6e"/><stop offset=".5" stop-color="#000"/><stop offset=".75" stop-color="#6e6e6e"/><stop offset="1" stop-color="#fff"/></linearGradient><rect width="100" height="100" fill="url(#g)"/></svg>';
        hsvg.setAttribute("style", "position:absolute;width:0;height:0");
        hsvg.innerHTML = '<filter id="' + hid + '" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">' +
          (a.bend ? '<feImage result="m" preserveAspectRatio="none" href="data:image/svg+xml;utf8,' + encodeURIComponent(cong) + '"/><feDisplacementMap in="SourceGraphic" in2="m" xChannelSelector="A" yChannelSelector="R" scale="0" result="d"/>' : '') +
          (a.warp ? '<feTurbulence result="n" type="fractalNoise" baseFrequency="0.0045 0.013" numOctaves="2" seed="4"/><feDisplacementMap class="fw" in="' + (a.bend ? 'd' : 'SourceGraphic') + '" in2="n" xChannelSelector="R" yChannelSelector="G" scale="0" result="w"/>' : '') +
          '<feGaussianBlur in="' + (a.warp ? 'w' : a.bend ? 'd' : 'SourceGraphic') + '" stdDeviation="0 0"/></filter>';
        el.appendChild(hsvg);
        (function (fb, fd, fw, hb, id, ns, A) {
          var ve = function () { fb.setAttribute("stdDeviation", hb.h.toFixed(1) + " 0"); if (fd) fd.setAttribute("scale", hb.b.toFixed(1)); if (fw) fw.setAttribute("scale", hb.w.toFixed(1)); ns.forEach(function (n) { setF(n, "hb", hb.h > 0.4 || Math.abs(hb.b) > 0.5 || hb.w > 0.5 ? "url(#" + id + ")" : ""); }); };
          var h0 = A.hblur ? A.hblur[0] : 0, h1 = A.hblur ? A.hblur[1] : 0, b0 = A.bend ? A.bend[0] : 0, b1 = A.bend ? A.bend[1] : 0, w0 = A.warp ? A.warp[0] : 0, w1 = A.warp ? A.warp[1] : 0;
          tl.fromTo(hb, { h: h0, b: b0, w: w0 }, { h: h1, b: b1, w: w1, duration: A.dur, ease: A.ease, immediateRender: false, onUpdate: ve, onStart: ve, onComplete: ve }, t);
        })(hsvg.querySelector("feGaussianBlur"), hsvg.querySelector("feDisplacementMap:not(.fw)"), hsvg.querySelector(".fw"), { h: a.hblur ? a.hblur[0] : 0, b: a.bend ? a.bend[0] : 0, w: a.warp ? a.warp[0] : 0 }, hid, tg, a);
      }
      if (a.count) {
        // đếm số (seek được: giá trị tính từ tiến độ tween)
        var fmt = function (v) {
          var s0 = v.toFixed(a.dec || 0), parts = s0.split(".");
          if (a.sep) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, a.sep);
          return parts.join(".");
        };
        var pr = { v: a.count[0] };
        var draw = function () { tg.forEach(function (n) { n.textContent = fmt(pr.v); }); };
        tl.set(pr, { v: a.count[0], onComplete: draw }, s);
        tl.fromTo(pr, { v: a.count[0] }, { v: a.count[1], duration: a.dur, ease: a.ease, immediateRender: false, onUpdate: draw, onStart: draw }, t);
        return;
      }
      if (!a.set && !a.from && !Object.keys(a.to || {}).length) return; // dòng chỉ có hiệu ứng ở trên, không có thuộc tính để tween
      var to = Object.assign({}, a.to, { duration: a.set ? 0 : a.dur, ease: a.ease, stagger: function (i) { return dly[i] || 0; }, immediateRender: false });
      if (a.loop && a.dur > 0) to.repeat = Math.max(0, Math.ceil((end - t) / a.dur) - 1); // lặp đủ số vòng tới hết khối (không lặp vô hạn)
      if (a.set) tl.set(tg, a.to, t);
      else if (a.from) {
        // trạng thái đầu có ngay từ lúc khối hiện (không lộ trạng thái cuối trước giờ) — chỉ theo chuyển động ĐẦU TIÊN của phần tử,
        // chuyển động nối tiếp (cuộn lần 2, 3…) không được đè trạng thái đầu
        // (theo từng thuộc tính: chuyển động khác thuộc tính trên cùng phần tử vẫn được đặt trạng thái đầu)
        tg.forEach(function (n) {
          var seen = n.__pxInit || (n.__pxInit = {}), init = {};
          Object.keys(a.from).forEach(function (k) { if (!seen[k]) { seen[k] = 1; init[k] = a.from[k]; } });
          if (Object.keys(init).length) tl.set(n, init, s);
        });
        // scatter: mỗi phần lệch ngẫu nhiên một ít lúc đầu (Text Animator Randomize), seed cố định nên bản xuất nào cũng giống nhau
        if (a.scatter) {
          var rs = prng(sd + 2), sc = a.scatter;
          tg.forEach(function (n, i) {
            var fi = Object.assign({}, a.from), ti = Object.assign({}, to, { stagger: 0 }), rr = function (v) { return (rs() - 0.5) * 2 * v; };
            if (sc.x) fi.x = (Number(fi.x) || 0) + rr(sc.x);
            if (sc.y) fi.y = (Number(fi.y) || 0) + rr(sc.y);
            if (sc.rot) fi.rotation = (Number(fi.rotation) || 0) + rr(sc.rot);
            if (sc.scale) fi.scale = (fi.scale == null ? 1 : Number(fi.scale)) + rr(sc.scale);
            tl.set(n, fi, s);
            tl.fromTo(n, fi, ti, t + dly[i]);
          });
        } else tl.fromTo(tg, a.from, to, t);
      } else tl.to(tg, to, t);
    });
    var d = Math.min(0.25, b.dur / 4);
    // ra kiểu lia: "pan-up" = cả khung trượt lên khỏi màn hình (cảnh sau lia vào từ dưới)
    var POUT = { "pan-up": { y: -FH }, "pan-down": { y: FH }, "pan-left": { x: -FW }, "pan-right": { x: FW } };
    if (b.out === "pan") tl.to(inner, { x: PV.x, y: PV.y, duration: PVD, ease: "power2.inOut" }, end - PVD);
    else if (POUT[b.out]) tl.to(inner, Object.assign({ duration: PD, ease: "power3.inOut" }, POUT[b.out]), end - PD);
    else if (b.out === "fade") tl.to(inner, { opacity: 0, duration: d, ease: "power1.in" }, end - d);
    else if (b.out === "pop") tl.to(inner, { opacity: 0, scale: 0.7, duration: d, ease: "back.in(1.6)" }, end - d);
    else if (b.out === "drop") tl.to(inner, { opacity: 0, y: 90, duration: d, ease: "power2.in" }, end - d);
  });

  if (E.capHideOnScenes) {
    E.scenes.forEach(function (sc) {
      if (sc.overlay) return;
      document.querySelectorAll(".cap").forEach(function (cap) {
        tl.set(cap, { opacity: 0 }, sc.start);
        tl.set(cap, { opacity: 1 }, sc.start + sc.dur);
      });
    });
  }

  if (jumps.length && cam.length) {
    var marks = [];
    jumps.forEach(function (j) { marks.push(j.a, j.b); });
    marks = marks.sort(function (x, y) { return x - y; }).filter(function (t, i, a) { return i === 0 || t - a[i - 1] > 0.0005; });
    marks.forEach(function (t) {
      var on = null;
      jumps.forEach(function (j) { if (j.a <= t + 0.0005 && j.b > t + 0.0005 && (!on || j.a > on.a || (j.a === on.a && j.n > on.n))) on = j; });
      tl.set(cam, on ? on.st : REST, t);
    });
  }
  if(E.endCard){
    var endCard=document.getElementById('contentos-end-card'),endContent=endCard&&endCard.querySelector('.end-card-content');
    tl.set(endCard,{autoAlpha:0},0);tl.set(endCard,{autoAlpha:1},E.endCard.start);
    if(endContent)tl.fromTo(endContent,{opacity:0,y:28},{opacity:1,y:0,duration:.35,ease:'power2.out',immediateRender:false},E.endCard.start);
  }
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
