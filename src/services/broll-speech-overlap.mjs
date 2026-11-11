// Resolved output-clock speech only; this does not identify products in footage.
export function brollSpeechOverlap(words,start,end){
 const matching=words.filter(w=>w.outputStart<end&&w.outputEnd>start);
 const next=words.find(w=>w.outputStart>=end);
 return {words:matching.slice(0,32).map(w=>({...w})),truncated:matching.length>32,totalWords:matching.length,
  ...(next?{nextWord:{...next}}:{}),
  startsInsideWord:matching.some(w=>w.outputStart<start&&w.outputEnd>start),
  endsInsideWord:matching.some(w=>w.outputStart<end&&w.outputEnd>end)};
}
