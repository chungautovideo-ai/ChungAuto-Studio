// Làm đẹp người nói (camera.beauty, kiểu CapCut): canvas WebGL vẽ lại khung video gốc theo điểm mặt đã quét (work/face.json → window.__FACE)
// mịn da · trắng da · căng da · son môi · to mắt · sáng mắt · gọt mặt · cằm V · mũi nhỏ. Bản dựng chỉ chèn file này khi dự án bật làm đẹp.
// Xem trước: vẽ lại mỗi khung hình (requestAnimationFrame). Xuất video: HyperFrames thay video bằng ảnh từng khung (img.__render_frame__)
// rồi gọi window.__hf.colorGrading.redraw() → bọc hàm đó để vẽ lại đúng khung vừa chèn trước khi chụp.
(function () {
  var E = window.__EDIT__, F = window.__FACE, B = E && E.beauty;
  if (!B || !F || !(F.tracks?.length || F.f?.length)) return;
  var scans=F.tracks||[F];
  var coverStyle=document.createElement('style');coverStyle.textContent='video[data-beauty-covered],video[data-beauty-covered]+img.__render_frame__{opacity:0!important}';document.head.appendChild(coverStyle);

  // ---------- điểm mặt (chỉ số MediaPipe Face Landmarker 478 điểm) ----------
  var IX = {};
  scans[0].idx.forEach(function (k, i) { IX[k] = i; });
  var OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  var LIPO = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
  var LIPI = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
  var EYEL = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  var EYER = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
  var BROWL = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46], BROWR = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

  // điểm mặt tại giây gốc t (nội suy giữa 2 lần quét; mất mặt ở 1 trong 2 lần → không làm đẹp khung đó)
  function pts(t,src) {
    var track=F.tracks?scans.find(function(s){return s.src===src;}):F;
    if(!track)return null;
    var x = t * track.fps, i = Math.floor(x), a = track.f[i], b = track.f[i + 1], k = x - i;
    if (!a) return null;
    if(k>1e-6&&!b)return null;
    if (k <= 0) b = a;
    var out = new Array(a.length);
    for (var j = 0; j < a.length; j++) out[j] = (a[j] + (b[j] - a[j]) * k) / 10000;
    return out;
  }

  var NW = 20;
  var RENDER = false; // đang xuất video (đã thấy ảnh khung HyperFrames chèn) → chỉ vẽ khi redraw, mỗi khung 1 lần
  function now() { var T = window.__timelines && window.__timelines.main; return T ? T.time() : 0; }

  // Một lớp người: video nói (#camFrame) hoặc lớp tách nền (#matteFrame, có kênh trong suốt)
  function Layer(frame, sel, pvName, dedicated) {
  if (!frame) return null;
  var cv = document.createElement("canvas");
  cv.className = "beautyCv";
  frame.appendChild(cv);
  var gl = cv.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
  if (!gl) { cv.remove(); return null; }

  var VS = "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision highp float;varying vec2 uv;",
    "uniform sampler2D src,msk,body;uniform vec2 res,bodySize;uniform float on,smooth,white,lip,eyeB,firm,rad,bodyWhite,bodySmooth,personLight,maskView,maskShrink;uniform vec3 lipC;",
    "uniform vec4 wp[" + NW + "];uniform vec4 wd[" + NW + "];",
    // wp = (tâm x, tâm y, bán kính, độ mạnh) theo px gốc · wd.x = kiểu (0 phồng · 1 thu · 2 đẩy) · wd.yz = vector đẩy (px)
    "vec2 warp(vec2 q){vec2 o=q;for(int i=0;i<" + NW + ";i++){vec4 w=wp[i];if(w.z<=0.)continue;vec2 d=q-w.xy;float r=length(d)/w.z;if(r>=1.)continue;",
    " float f=1.-r*r;f*=f;if(wd[i].x<.5)o-=d*w.w*f;else if(wd[i].x<1.5)o+=d*w.w*f;else o-=wd[i].yz*f;}return o;}",
    "float lu(vec3 c){return dot(c,vec3(.299,.587,.114));}",
    "void main(){vec2 q=uv*res;vec2 s=on>.5?warp(q):q;vec2 u=clamp(s/res,0.,1.);vec4 c4=texture2D(src,u);vec3 c=c4.rgb;",
    " if(on<.5){gl_FragColor=c4;return;}",
    " vec3 m=texture2D(msk,u).rgb;",
    // mịn da: lọc 2 phía (giữ cạnh), 3 vòng × 8 điểm, chỉ trong vùng da
    " if(smooth>0.&&m.r>.01){vec3 acc=c;float ws=1.;for(int k=1;k<=3;k++){float rr=rad*float(k)/3.;for(int j=0;j<8;j++){float a=float(j)*.7854+float(k)*.39;",
    "  vec3 t=texture2D(src,u+vec2(cos(a),sin(a))*rr/res).rgb;vec3 e=t-c;float w=exp(-dot(e,e)*55.);acc+=t*w;ws+=w;}}",
    "  c=mix(c,acc/ws,m.r*smooth*.92);}",
    // căng da: lấp nếp nhăn / rãnh (điểm tối hơn vùng da quanh nó) + da căng bóng nhẹ — chỉ trong vùng da
    " if(firm>0.&&m.r>.01){vec3 bl=vec3(0.);for(int j=0;j<8;j++){float a=float(j)*.7854;bl+=texture2D(src,u+vec2(cos(a),sin(a))*rad*2.2/res).rgb;}bl/=8.;",
    "  float cr=clamp((lu(bl)-lu(c))*9.,0.,1.);c=mix(c,max(c,bl),cr*firm*m.r*.9);c=mix(c,clamp(c*1.035+.012,0.,1.),firm*m.r*.4);}",
    // Only the landmark face mask: chroma alone can also select seats, paint or background.
    " float wm=m.r;if(white>.0001&&wm>.01){float b=1.+white*2.5;vec3 w=log(c*(b-1.)+1.)/log(b);w=mix(w,vec3(lu(w)),.12*white);c=mix(c,w,wm*.85);}",
    // tô môi: giữ độ sáng gốc, thay sắc — chỉ điểm ảnh đỏ hơn xanh (môi), bỏ qua răng (sáng, ít màu) và trong miệng (tối)
    " if(lip>0.&&m.g>.01){float l=lu(c);float mxc=max(c.r,max(c.g,c.b)),sat=(mxc-min(c.r,min(c.g,c.b)))/max(mxc,.01);float lw=smoothstep(.0,.06,c.r-c.g)*smoothstep(.15,.3,sat)*smoothstep(.06,.16,l)*(1.-smoothstep(.72,.9,l));",
    "  vec3 t=lipC*(.35+1.35*l);t=mix(t,c*lipC*2.,.35);c=mix(c,clamp(t,0.,1.),m.g*lw*lip*.7);}",
    // sáng mắt: nâng sáng + tương phản trong vùng mắt
    " if(eyeB>0.&&m.b>.01){vec3 t=clamp((c-.5)*1.18+.5+.06,0.,1.);c=mix(c,t,m.b*eyeB);}",
    " vec2 bm=texture2D(body,u).rg;",
    " if(maskShrink>0.){vec2 d=vec2(maskShrink*3.)/bodySize;for(int j=0;j<8;j++){float a=float(j)*.785398163;bm=min(bm,texture2D(body,u+vec2(cos(a),sin(a))*d).rg);}}",
    " if(maskView>.5){float m=maskView>1.5?bm.g:bm.r;c=mix(c,vec3(.2,1.,.35),m*.6);gl_FragColor=vec4(c,c4.a);return;}",
    " if(bodySmooth>0.&&bm.g>.01){vec3 acc=c;float ws=1.;for(int j=0;j<8;j++){float a=float(j)*.7854;vec3 t=texture2D(src,u+vec2(cos(a),sin(a))*max(1.,res.x*.002)/res).rgb;vec3 e=t-c;float wt=exp(-dot(e,e)*55.);acc+=t*wt;ws+=wt;}c=mix(c,acc/ws,bm.g*bodySmooth*.85);}",
    " if(bodyWhite>.0001&&bm.g>.01){float b=1.+bodyWhite*2.5;vec3 light=log(c*(b-1.)+1.)/log(b);c=mix(c,light,bm.g*.85);}",
    " c=mix(c,min(vec3(1.),c*exp2(personLight*.7)),bm.r);",
    " gl_FragColor=vec4(c,c4.a);}",
  ].join("\n");
  function sh(type, s) { var o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn("beauty shader:", gl.getShaderInfoLog(o)); return o; }
  var pg = gl.createProgram();
  gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) { console.warn("beauty link:", gl.getProgramInfoLog(pg)); cv.remove(); return null; }
  gl.useProgram(pg);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var ap = gl.getAttribLocation(pg, "p");
  gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ["src", "msk", "body", "bodyWhite", "bodySmooth", "personLight", "maskView", "maskShrink", "bodySize", "res", "on", "smooth", "white", "lip", "eyeB", "firm", "rad", "lipC", "wp", "wd"].forEach(function (n) { U[n] = gl.getUniformLocation(pg, n === "wp" || n === "wd" ? n + "[0]" : n); });
  function tex(unit) {
    var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  var tSrc = tex(0), tMsk = tex(1);
  gl.uniform1i(U.src, 0); gl.uniform1i(U.msk, 1);
  var tBody=tex(2),maskKey='',maskData,maskRuns,maskPrev,maskNext,maskEdits,maskSelections;gl.uniform1i(U.body,2);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tMsk);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
  function bodyMask(src,time){
    var track=scans.find(function(s){return s.src===src;}),data=track&&track.skin,index=track?Math.floor(time*track.fps):0,runs=data&&data.f[index];
    var stability=Math.max(0,Math.min(1,Number(B.maskStability)||0)),previous=data&&(index>0?data.f[index-1]:runs),next=data&&(index+1<data.f.length?data.f[index+1]:runs),activeEdits=(B.maskEdits||[]).some(function(s){return s.src===src&&time>=s.from&&time<s.to;}),key=src+'|'+index+'|'+stability+(activeEdits?'|'+time:'');
    var selectionIndex=(B.personSelections||[]).findIndex(function(s){return s.src===src&&time>=s.from&&time<s.from+s.f.length/s.fps;}),selection=(B.personSelections||[])[selectionIndex];
    key+='|selected:'+selectionIndex+(selection?':'+Math.floor((time-selection.from)*selection.fps):'');
    if(key===maskKey&&data===maskData&&runs===maskRuns&&previous===maskPrev&&next===maskNext&&maskEdits===B.maskEdits&&maskSelections===B.personSelections)return !!runs;
    maskKey=key;maskData=data;maskRuns=runs;maskPrev=previous;maskNext=next;maskEdits=B.maskEdits;maskSelections=B.personSelections;
    var pixels=new Uint8Array(runs?data.w*data.h*4:4),at=0;
    if(runs)for(var i=0;i<runs.length;i+=2)for(var j=0;j<runs[i];j++){pixels[at++]=runs[i+1]>0?255:0;pixels[at++]=runs[i+1]===2?255:0;pixels[at++]=0;pixels[at++]=255;}
    // Stateless consensus: attenuate uncertain current pixels, never grow a mask
    // into background or reuse a previous source after seeking/cutting.
    if(runs&&stability>0){
      var support=new Uint8Array(data.w*data.h*2);
      [previous,next].forEach(function(neighbor){var p=0;if(neighbor)for(var n=0;n<neighbor.length;n+=2)for(var r=0;r<neighbor[n];r++){if(neighbor[n+1]>0)support[p*2]++;if(neighbor[n+1]===2)support[p*2+1]++;p++;}});
      for(var p=0;p<support.length/2;p++){pixels[p*4]=Math.round(pixels[p*4]*(1-stability*.25*(2-support[p*2])));pixels[p*4+1]=Math.round(pixels[p*4+1]*(1-stability*.25*(2-support[p*2+1])));}
    }
    if(runs&&typeof applyPersonMaskEdits==='function')applyPersonMaskEdits(pixels,data.w,data.h,B.maskEdits,src,track.fingerprint?.sha256,time);
    if(runs&&typeof applyPersonSelection==='function')applyPersonSelection(pixels,data.w,data.h,B.personSelections,src,track.fingerprint?.sha256,time);
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,tBody);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,runs?data.w:1,runs?data.h:1,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    gl.uniform2f(U.bodySize,runs?data.w:1,runs?data.h:1);
    return !!runs;
  }

  // mặt nạ vùng (kênh đỏ = da, xanh lá = môi, xanh dương = mắt), vẽ 2D ở độ phân giải thấp rồi làm mờ viền
  var MW = 540, mc = document.createElement("canvas"), mx = mc.getContext("2d"), mc2 = document.createElement("canvas"), mx2 = mc2.getContext("2d");
  function poly(P, list, sx, sy, grow, cx, cy) {
    mx2.beginPath();
    list.forEach(function (k, n) {
      var i = IX[k]; if (i == null) return;
      var x = P[i * 2] * sx, y = P[i * 2 + 1] * sy;
      if (grow) { x = cx + (x - cx) * grow; y = cy + (y - cy) * grow; }
      n ? mx2.lineTo(x, y) : mx2.moveTo(x, y);
    });
    mx2.closePath();
  }
  function centre(P, list, sx, sy) {
    var x = 0, y = 0, n = 0;
    list.forEach(function (k) { var i = IX[k]; if (i == null) return; x += P[i * 2] * sx; y += P[i * 2 + 1] * sy; n++; });
    return [x / n, y / n];
  }
  function mask(P, w, h, fwPx) {
    var mh = Math.round(MW * h / w);
    if (mc.width !== MW || mc.height !== mh) { mc.width = mc2.width = MW; mc.height = mc2.height = mh; }
    var sx = MW, sy = mh, bl = Math.max(1, fwPx * MW / w * 0.035);
    mx2.globalCompositeOperation = "source-over"; mx2.fillStyle = "#000"; mx2.fillRect(0, 0, MW, mh);
    var fc = centre(P, OVAL, sx, sy);
    // chỉ làm mờ quanh khuôn mặt (lọc mờ cả khung tốn thời gian xuất)
    var x0 = MW, y0 = mh, x1 = 0, y1 = 0, pad = bl * 3 + 2;
    OVAL.forEach(function (k) { var i = IX[k]; var x = P[i * 2] * sx, y = P[i * 2 + 1] * sy; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad)); x1 = Math.min(MW, Math.ceil(x1 + pad)); y1 = Math.min(mh, Math.ceil(y1 + pad));
    var bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
    mx2.fillStyle = "#f00"; poly(P, OVAL, sx, sy, 0.97, fc[0], fc[1]); mx2.fill();
    // khoét mắt, mày, môi khỏi vùng da
    mx2.globalCompositeOperation = "destination-out"; mx2.fillStyle = "#fff";
    [EYEL, EYER, BROWL, BROWR].forEach(function (L) { var c = centre(P, L, sx, sy); poly(P, L, sx, sy, 1.5, c[0], c[1]); mx2.fill(); });
    var lc = centre(P, LIPO, sx, sy); poly(P, LIPO, sx, sy, 1.12, lc[0], lc[1]); mx2.fill();
    mx2.globalCompositeOperation = "lighter";
    mx2.fillStyle = "#00f";
    [EYEL, EYER].forEach(function (L) { var c = centre(P, L, sx, sy); poly(P, L, sx, sy, 1.05, c[0], c[1]); mx2.fill(); });
    mx.globalCompositeOperation = "copy"; mx.filter = "blur(" + bl.toFixed(1) + "px)"; mx.drawImage(mc2, x0, y0, bw, bh, x0, y0, bw, bh);
    // môi: viền sắc hơn (miệng hé chỉ vài px — mờ nhiều thì son lem sang răng)
    mx2.globalCompositeOperation = "copy"; mx2.fillStyle = "#0f0"; mx2.beginPath();
    LIPO.forEach(function (k, n) { var i = IX[k]; n ? mx2.lineTo(P[i * 2] * sx, P[i * 2 + 1] * sy) : mx2.moveTo(P[i * 2] * sx, P[i * 2 + 1] * sy); }); mx2.closePath();
    LIPI.forEach(function (k, n) { var i = IX[k]; n ? mx2.lineTo(P[i * 2] * sx, P[i * 2 + 1] * sy) : mx2.moveTo(P[i * 2] * sx, P[i * 2 + 1] * sy); }); mx2.closePath();
    mx2.fill("evenodd");
    mx.globalCompositeOperation = "lighter"; mx.filter = "blur(" + Math.max(0.6, bl * 0.25).toFixed(1) + "px)"; mx.drawImage(mc2, x0, y0, bw, bh, x0, y0, bw, bh); mx.filter = "none";
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tMsk);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mc);
  }

  // biến dạng theo điểm mặt (px gốc)
  function warps(P, w, h) {
    var g = function (k) { var i = IX[k]; return [P[i * 2] * w, P[i * 2 + 1] * h]; };
    var d = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    var L = [], fw = d(g(234), g(454)), mid = g(168), chin = g(152);
    var add = function (c, r, s, type, vx, vy) { if (s) L.push([c[0], c[1], r, s, type, vx || 0, vy || 0]); };
    if (B.eye) [[468, 33, 133], [473, 263, 362]].forEach(function (e) {
      var c = IX[e[0]] != null ? g(e[0]) : [(g(e[1])[0] + g(e[2])[0]) / 2, (g(e[1])[1] + g(e[2])[1]) / 2];
      add(c, d(g(e[1]), g(e[2])) * 1.05, B.eye * 0.32, 0);
    });
    if (B.slim) [[132, 0.9], [58, 1], [172, 0.85], [361, 0.9], [288, 1], [397, 0.85]].forEach(function (e) {
      var p = g(e[0]); add(p, fw * 0.3, 1, 2, (mid[0] - p[0]) * 0.12 * B.slim * e[1], 0);
    });
    if (B.chin) [[149, 0.7], [150, 1], [176, 0.5], [378, 0.7], [379, 1], [400, 0.5]].forEach(function (e) {
      var p = g(e[0]); add(p, fw * 0.2, 1, 2, (chin[0] - p[0]) * 0.22 * B.chin * e[1], (chin[1] - p[1]) * 0.1 * B.chin * e[1]);
    });
    if (B.chin) add(chin, fw * 0.16, 1, 2, 0, fw * 0.025 * B.chin);
    // căng da: nâng gò má + đường hàm lên (kéo da chảy xệ), 4 điểm 2 bên
    if (B.firm) [[132, 1], [361, 1], [172, 0.8], [397, 0.8]].forEach(function (e) {
      var p = g(e[0]); add(p, fw * 0.28, 1, 2, (mid[0] - p[0]) * 0.03 * B.firm * e[1], -fw * 0.035 * B.firm * e[1]);
    });
    if (B.nose) { var nw = d(g(48), g(278)); add(g(4), nw * 1.15, B.nose * 0.22, 1); }
    var wp = new Float32Array(NW * 4), wd = new Float32Array(NW * 4);
    L.slice(0, NW).forEach(function (x, i) { wp.set([x[0], x[1], x[2], x[3]], i * 4); wd.set([x[4], x[5], x[6], 0], i * 4); });
    gl.uniform4fv(U.wp, wp); gl.uniform4fv(U.wd, wd);
    return fw;
  }

  // ---------- nguồn khung hiện tại ----------
  var talks = Array.prototype.slice.call(dedicated?[dedicated]:frame.querySelectorAll(sel));
  function source() {
    var pv = window[pvName]; // bản xem trước nhẹ: 1 video tự nhảy đoạn
    var T = now();
    for (var i = 0; i < talks.length; i++) {
      var v = talks[i], s = +v.getAttribute("data-start"), du = +v.getAttribute("data-duration");
      if (T < s - 1e-3 || T >= s + du) continue;
      var t = +(v.getAttribute("data-media-start") || 0) + (T - s)*Number(v.getAttribute('data-playback-rate')||1), img = v.nextElementSibling,src=v.getAttribute('data-face-source');
      if (img && img.classList.contains("__render_frame__") && img.style.visibility !== "hidden" && img.naturalWidth) return { el: img, t: t, w: img.naturalWidth, h: img.naturalHeight,video:v,src:src };
      if(pv&&pv.readyState>=2)return {el:pv,t:pv.currentTime,w:pv.videoWidth,h:pv.videoHeight,video:v,src:src};
      if (v.readyState >= 2) return { el: v, t: Number.isFinite(v.currentTime)?v.currentTime:t, w: v.videoWidth, h: v.videoHeight,video:v,src:src };
    }
    if(!talks.length&&pv&&pv.readyState>=2&&!F.tracks)return {el:pv,t:pv.currentTime,w:pv.videoWidth,h:pv.videoHeight};
    return null;
  }

  var lastKey = "";
  function draw(force) {
    var S = source();
    if (!S || !S.w) { cv.style.visibility = "hidden"; if(dedicated)dedicated.removeAttribute("data-beauty-covered"); return; }
    if(S.video){
      if(cv.parentNode!==S.video.parentNode)S.video.parentNode.appendChild(cv);
      var style=getComputedStyle(S.video);
      if(dedicated){
        var sibling=S.video.nextElementSibling;if(sibling?.classList.contains('__render_frame__'))sibling.insertAdjacentElement('afterend',cv);else S.video.insertAdjacentElement('afterend',cv);
      }
      ['position','left','top','right','bottom','width','height','objectFit','objectPosition','transform','transformOrigin','borderRadius','clipPath','zIndex','filter','opacity','rotate','boxShadow','border','padding','boxSizing'].forEach(function(k){cv.style[k]=style[k];});
      if(dedicated){cv.style.opacity=S.video.style.opacity||'1';S.video.setAttribute('data-beauty-covered','');}
    }
    if (S.el.tagName === "IMG") RENDER = true;
    if (RENDER && !force) return;
    // video: đếm khung đã hiện (requestVideoFrameCallback) → vẽ lại khi có hình mới, kể cả lần đầu nạp / sau khi tua
    var el = S.el;
    if (el.requestVideoFrameCallback && !el.__bfOn) {
      el.__bfOn = 1; el.__bf = 0;
      el.requestVideoFrameCallback(function cb() { el.__bf++; el.requestVideoFrameCallback(cb); });
    }
    var key = S.src+"|"+(el.currentSrc || el.src || "") + "|" + (el.__bf || 0) + "|" + S.t.toFixed(3) + "|" + S.w;
    if (!force && key === lastKey) return;
    lastKey = key;
    if (cv.width !== S.w || cv.height !== S.h) { cv.width = S.w; cv.height = S.h; gl.viewport(0, 0, S.w, S.h); }
    try {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tSrc);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, S.el);
    } catch (e) { cv.style.visibility = "hidden";if(dedicated)dedicated.removeAttribute("data-beauty-covered");return; }
    var P = pts(S.t,S.src);
    var track=scans.find(function(t){return t.src===S.src;});
    var adjustment=typeof resolvePersonSourceAdjustment==='function'?resolvePersonSourceAdjustment(B.sourceAdjustments,S.src,track?.fingerprint?.sha256,{personLight:(B.personLight||0)*100,bodyWhite:(B.bodyWhite||0)*100,bodySmooth:(B.bodySmooth||0)*100},B.personSelections,S.t):{personLight:(B.personLight||0)*100,bodyWhite:(B.bodyWhite||0)*100,bodySmooth:(B.bodySmooth||0)*100};
    gl.uniform1f(U.personLight,adjustment.personLight/100);gl.uniform1f(U.bodyWhite,adjustment.bodyWhite/100);gl.uniform1f(U.bodySmooth,adjustment.bodySmooth/100);
    gl.uniform2f(U.res, S.w, S.h);
    var hasBody=bodyMask(S.src,S.t);
    gl.uniform1f(U.on, P||hasBody ? 1 : 0);
    if (P) {
      var fw = warps(P, S.w, S.h);
      mask(P, S.w, S.h, fw);
      gl.uniform1f(U.rad, fw * 0.018);
    }else{gl.uniform4fv(U.wp,new Float32Array(NW*4));gl.uniform4fv(U.wd,new Float32Array(NW*4));gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tMsk);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));}
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cv.style.visibility = dedicated?getComputedStyle(S.el).visibility:"visible";
  }
  function setParams() {
    gl.uniform1f(U.maskShrink,Math.max(0,Math.min(1,Number(B.maskShrink)||0)));
    gl.uniform1f(U.bodyWhite,B.bodyWhite||0);gl.uniform1f(U.bodySmooth,B.bodySmooth||0);gl.uniform1f(U.personLight,B.personLight||0);
    gl.uniform1f(U.smooth, B.smooth || 0); gl.uniform1f(U.white, B.white || 0); gl.uniform1f(U.lip, B.lip || 0); gl.uniform1f(U.eyeB, B.eyeBright || 0); gl.uniform1f(U.firm, B.firm || 0);
    var c = /^#?([0-9a-f]{6})$/i.exec(B.lipColor || "") ? parseInt(B.lipColor.replace("#", ""), 16) : 0xd0475a;
    gl.uniform3f(U.lipC, (c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255);
  }
  setParams();
  return { draw: draw, setParams: setParams,maskView:function(mode){gl.uniform1f(U.maskView,mode);draw(true);} };
  }

  var layers = [Layer(document.getElementById("camFrame"), "video.talk", "__pv"), Layer(document.getElementById("matteFrame"), "video", "__pm")]
    .filter(Boolean);
  // One composited canvas per B-roll preserves simultaneous source clocks and layout.
  document.querySelectorAll('video.broll[data-face-source]').forEach(function(video){
    if(!scans.some(function(track){return track.src===video.getAttribute('data-face-source');}))return;
    var l=Layer(video.parentNode,'',null,video);if(l)layers.push(l);
  });
  if (!layers.length) return;
  var drawAll = function (force) { layers.forEach(function (l) { l.draw(force); }); };
  // editor kéo thanh trượt → đổi ngay không cần nạp lại
  window.__beautySet = function (b) { B = Object.assign({}, B, b); layers.forEach(function (l) { l.setParams(); l.draw(true); }); };
  window.__beautyMask=function(mode){layers.forEach(function(l){l.maskView(Number(mode)||0);});};

  // xuất video: vẽ lại sau khi HyperFrames chèn ảnh khung (gọi colorGrading.redraw nếu có)
  function hook() {
    var hf = window.__hf = window.__hf || {}, cg = hf.colorGrading;
    if (cg && cg.__beauty) return;
    var w = Object.create(cg || null);
    w.__beauty = true;
    w.redraw = function () { if (cg && cg.redraw) cg.redraw.apply(cg, arguments); drawAll(true); };
    try { Object.defineProperty(hf, "colorGrading", { configurable: true, get: function () { return w; }, set: function (v) { cg = v; Object.setPrototypeOf(w, v || null); } }); }
    catch (e) { hf.colorGrading = w; }
  }
  hook();
  var tl = window.__timelines && window.__timelines.main;
  if (tl) tl.eventCallback("onUpdate", function () { hook(); drawAll(false); });
  (function loop() { drawAll(false); requestAnimationFrame(loop); })();
})();
