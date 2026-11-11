// Optional output-time override. Missing values retain the legacy animation.
export function validateBrollEntrance(item) {
  const value=item?.tInDuration;
  if(value===undefined)return;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>2){
    const error=new Error('Thời lượng hiệu ứng cảnh trám phải là số từ 0 đến 2 giây.');error.status=400;throw error;
  }
}
export function brollEntranceDuration(item,outputDuration=item.dur) {
  validateBrollEntrance(item);
  if(item.tInDuration===undefined)return undefined;
  if((item.tIn||'none')==='none')return 0;
  return Math.min(item.tInDuration,Math.max(0,Number(outputDuration)||0));
}

// Resolved timing, not a claim that text/products are readable or understood.
export function brollEntranceTiming(item) {
  validateBrollEntrance(item);
  const type=item.tIn||'none',duration=Number(item.dur)||0;
  const legacy={slide:.45,zoom:.4,drop:.42,wipe:.45};
  const animationDuration=type==='none'?0:item.tInDuration===undefined?(Object.hasOwn(legacy,type)?legacy[type]:.3):brollEntranceDuration(item,duration);
  const entranceWithinShot=Math.min(duration,animationDuration),settledDuration=Math.max(0,duration-animationDuration);
  const round=n=>Math.round(n*1000)/1000;
  return {type,custom:item.tInDuration!==undefined,animationDuration:round(animationDuration),entranceWithinShot:round(entranceWithinShot),settledDuration:round(settledDuration),settledStart:round(item.start+entranceWithinShot),settledEnd:round(item.start+duration)};
}
