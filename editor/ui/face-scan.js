// Quét điểm mặt cho Làm đẹp: MediaPipe Face Landmarker chạy ngay trong trình duyệt (editor/vendor/mediapipe, không gửi video đi đâu)
// Tua video gốc FPS lần / giây, lưu các điểm cần dùng (viền mặt, môi, mắt, mày, mũi, con ngươi) → PUT /api/face → work/face.json
import { searchFace } from './face-search.js';
import {measurePersonExposure,summarizePersonExposure} from '/lib/person-exposure.js';
// chỉ số điểm MediaPipe (478 điểm) mà lớp làm đẹp dùng — runtime tra theo mảng idx này
const IDX = [...new Set([
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185,
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191,
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
  70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 300, 293, 334, 296, 336, 285, 295, 282, 283, 276,
  1, 4, 5, 6, 48, 278, 98, 327, 168, 468, 473,
])];

let landmarker = null;
let cropLandmarker = null;
let detectorClock=0;
async function load() {
  if (landmarker) return landmarker;
  const { FilesetResolver, FaceLandmarker } = await import("/vendor/mediapipe/vision_bundle.mjs");
  const files = await FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
  const opt = (delegate) => ({ baseOptions: { modelAssetPath: "/vendor/mediapipe/face_landmarker.task", delegate }, runningMode: "VIDEO", numFaces: 1 });
  try { landmarker = await FaceLandmarker.createFromOptions(files, opt("GPU")); }
  catch { landmarker = await FaceLandmarker.createFromOptions(files, opt("CPU")); }
  return landmarker;
}

async function loadCrop() {
  if(cropLandmarker)return cropLandmarker;
  const {FilesetResolver,FaceLandmarker}=await import('/vendor/mediapipe/vision_bundle.mjs');
  const files=await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
  // IMAGE mode is independent of the full-frame VIDEO tracker. Crop coordinates
  // must never become tracking history for the next full source frame.
  const options=delegate=>({baseOptions:{modelAssetPath:'/vendor/mediapipe/face_landmarker.task',delegate},runningMode:'IMAGE',numFaces:1});
  try{cropLandmarker=await FaceLandmarker.createFromOptions(files,options('GPU'));}
  catch{cropLandmarker=await FaceLandmarker.createFromOptions(files,options('CPU'));}
  return cropLandmarker;
}

const seek = (v, t) => new Promise((ok,bad) => {if(Math.abs(v.currentTime-t)<1e-5&&v.readyState>=2)return ok();const timer=setTimeout(()=>{v.removeEventListener('seeked',done);bad(new Error('Không tua được video để quét mặt.'));},15000);const done=()=>{clearTimeout(timer);ok();};v.addEventListener('seeked',done,{once:true});v.currentTime=t;});

// làm mượt theo thời gian (1-2-1) để mặt không rung — chỉ giữa các lần quét đều thấy mặt; môi giữ nguyên (miệng mở / khép nhanh)
const LIPS = new Set([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191]);
function smooth(f) {
  return f.map((a, i) => {
    const p = f[i - 1], n = f[i + 1];
    if (!a || !p || !n) return a;
    return a.map((x, j) => (LIPS.has(IDX[j >> 1]) ? x : Math.round((p[j] + 2 * x + n[j]) / 4)));
  });
}

export async function scanFace(src, { onProgress, signal,sourceId, smallFaceSearch = true, personSkin = false, fps = 15 } = {}) {
  if(fps!==15&&fps!==30)throw new Error('Chất lượng quét phải là15hoặc30fps.');
  // A source must not inherit a face tracker from a previous source/scan.
  if(landmarker){landmarker.close();landmarker=null;}
  const lm = await load();
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = src;
  await new Promise((ok, bad) => { v.onloadeddata = ok; v.onerror = () => bad(new Error("Không mở được video gốc.")); });
  const n = Math.max(1, Math.floor(v.duration * fps) + 1);
  if(!Number.isFinite(v.duration)||v.duration<=0||n>18000){v.removeAttribute('src');v.load();throw new Error(`Quét${fps}fps tối đa18.000mẫu/nguồn (khoảng${fps===30?10:20}phút); chia nguồn ngắn hơn.`);}
  const f = new Array(n).fill(null);
  const crop=document.createElement('canvas'),ctx=crop.getContext('2d');
  let previous=null, recovered=0,skin=null,maskSize=0;
  const exposureSamples=[],exposureCanvas=document.createElement('canvas'),exposureCtx=exposureCanvas.getContext('2d',{willReadFrequently:true}),sampleEvery=Math.max(1,Math.ceil(n/120));
  const segment=personSkin?(await import('./person-skin-scan.js')).segmentPersonSkin:null;
  const detect=async region=>{
    if(region)return (await loadCrop()).detect(crop).faceLandmarks?.[0];
    detectorClock+=1000/fps;return lm.detectForVideo(v,detectorClock).faceLandmarks?.[0];
  };
  const draw=region=>{
    crop.width=Math.max(2,Math.round(v.videoWidth*region.w));crop.height=Math.max(2,Math.round(v.videoHeight*region.h));
    ctx.drawImage(v,v.videoWidth*region.x,v.videoHeight*region.y,v.videoWidth*region.w,v.videoHeight*region.h,0,0,crop.width,crop.height);
  };
  try{
  for (let i = 0; i < n; i++) {
    if (signal?.aborted) throw new Error("Đã huỷ quét.");
    await seek(v, Math.max(0,Math.min(v.duration - 0.01, i / fps)));
    const result=smallFaceSearch?await searchFace({detect,draw,previous,signal}):{points:await detect(null),region:null};
    const L=result.points;previous=result.region;if(L&&result.region)recovered++;
    if(segment){const data=await segment(v);maskSize+=data.runs.length;if(maskSize>4000000)throw new Error('Mặt nạ người quá lớn; chia nguồn ngắn hơn trước khi quét.');if(!skin)skin={w:data.w,h:data.h,f:[]};skin.f.push(data.runs);
      if(i%sampleEvery===0){exposureCanvas.width=data.w;exposureCanvas.height=data.h;exposureCtx.drawImage(v,0,0,data.w,data.h);exposureSamples.push(measurePersonExposure(exposureCtx.getImageData(0,0,data.w,data.h).data,data.w,data.h,data));}
    }
    if (L) f[i] = IDX.flatMap((k) => [Math.round(L[k].x * 10000), Math.round(L[k].y * 10000)]);
    if (i % 6 === 0) onProgress?.(i / n);
  }
  const w = v.videoWidth, h = v.videoHeight;
  return { v: 1, fps, w, h, src: sourceId||src.replace(/^\/p\//, ""), idx: IDX, f: smooth(f), search:{recovered,smallFaceSearch},...(skin?{skin,exposure:summarizePersonExposure(exposureSamples)}:{}) };
  }finally{v.pause();v.removeAttribute('src');v.load();}
}
