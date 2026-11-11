let segmenter;
export function encodeMask(values) {
  const runs=[];
  for(let i=0;i<values.length;){const value=values[i];let end=i+1;while(end<values.length&&values[end]===value)end++;runs.push(end-i,value);i=end;}
  return runs;
}
export async function segmentPersonSkin(image) {
  if(!segmenter){
    const {FilesetResolver,ImageSegmenter}=await import('/vendor/mediapipe/vision_bundle.mjs');
    const files=await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
    const opt=delegate=>({baseOptions:{modelAssetPath:'/vendor/mediapipe/selfie_multiclass_256x256.tflite',delegate},runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true});
    try{segmenter=await ImageSegmenter.createFromOptions(files,opt('GPU'));}
    catch{segmenter=await ImageSegmenter.createFromOptions(files,opt('CPU'));}
  }
  const result=segmenter.segment(image);
  try{
    const masks=result.confidenceMasks;
    if(masks?.length!==6)throw new Error('Mô hình phân vùng người không đúng6nhãn.');
    const probabilities=masks.map(m=>m.getAsFloat32Array()),iw=masks[0].width,ih=masks[0].height;
    const ratio=Math.min(1,256/Math.max(iw,ih)),w=Math.max(2,Math.round(iw*ratio)),h=Math.max(2,Math.round(ih*ratio));
    const values=new Uint8Array(w*h);
    for(let i=0;i<values.length;i++){
      const at=Math.min(ih-1,Math.floor((Math.floor(i/w)+.5)*ih/h))*iw+Math.min(iw-1,Math.floor((i%w+.5)*iw/w));
      const skin=probabilities[2][at]+probabilities[3][at],person=1-probabilities[0][at];
      values[i]=skin>=.75?2:person>=.75?1:0;
    }
    return {w,h,runs:encodeMask(values)};
  }finally{result.close();}
}
