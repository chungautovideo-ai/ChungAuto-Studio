// Suggestions supplement manual prompts. Never discard a user's positive or
// negative point to make room, or add an automatic positive beside a negative.
export function mergePersonPromptPoints(existing,suggested) {
 const valid=(points,positiveOnly=false)=>Array.isArray(points)&&points.length<=16&&points.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=1&&p[1]>=0&&p[1]<=1&&(positiveOnly?p[2]===1:p[2]===0||p[2]===1));
 if(!valid(existing)||!valid(suggested,true)||!suggested.length)throw Error('Điểm gợi ý không hợp lệ; giữ các điểm đã chọn.');
 const points=existing.map(p=>[...p]);let added=0,skippedNear=0,omittedLimit=0;
 for(const point of suggested){
  if(points.some(p=>Math.hypot(p[0]-point[0],p[1]-point[1])<.012)){skippedNear++;continue;}
  if(points.length===16){omittedLimit++;continue;}
  points.push([...point]);added++;
 }
 return {points,kept:existing.length,added,skippedNear,omittedLimit};
}
