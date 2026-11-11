// Literal transcript lookup, not semantic scene recognition or editorial approval.
const tokens=text=>String(text??'').normalize('NFC').toLocaleLowerCase('vi').match(/[\p{L}\p{N}]+/gu)||[];
export function validateCaptionPhrase(phrase){
 if(typeof phrase!=='string'||phrase.length>120||!tokens(phrase).length||tokens(phrase).length>12)throw Error('Cụm tìm lời cần 1–12 từ, tối đa120 ký tự.');
 return tokens(phrase);
}
export function captionPhraseSearch(words,brolls,phrase){
 const query=validateCaptionPhrase(phrase),flat=words.flatMap((word,index)=>tokens(word.text).map(text=>({text,index}))),matches=[];let total=0,lastRange;
 for(let i=0;i<=flat.length-query.length;i++){
  if(!query.every((text,j)=>flat[i+j].text===text))continue;
  const first=flat[i].index,last=flat[i+query.length-1].index,selected=words.slice(first,last+1),start=selected[0].outputStart,end=selected.at(-1).outputEnd;
  // Punctuation attached to an ASR token may produce multiple lexical tokens;
  // return each matched word range once, even when a token repeats internally.
  const range=first+':'+last;if(lastRange===range)continue;lastRange=range;
  total++;if(matches.length>=20)continue;
  matches.push({_first:first,_last:last,outputStart:start,outputEnd:end,outputDuration:Math.round((end-start)*1000)/1000,words:selected,
   context:words.slice(Math.max(0,first-3),last+4).map(w=>w.text).join(' '),
   brolls:brolls.filter(b=>b.start<end&&b.start+b.dur>start).slice(0,20).map(b=>({id:b.id,src:b.src,projectAt:b.at||0,outputStart:b.start,outputEnd:Math.round((b.start+b.dur)*1000)/1000}))});
 }
 return {query:phrase,matching:'literal-tokens-case-insensitive-nfc',matches:matches.map(({_first,_last,...match})=>match),total,truncated:total>20,advisoryOnly:true,applied:false,notes:'Chỉ tìm cụm từ trong caption đang bật; không nhận diện hình hoặc xác nhận cảnh khớp ý. Không tìm gần nghĩa hoặc bỏ dấu tiếng Việt. words.projectStart là mốc trước cắt để đặt at; outputDuration là giây sau cắt, không lấy outputStart làm at. Cụm có thể vắt qua điểm cắt; xem từng word và kiểm đoạn thực tế. Không có kết quả không chứng minh video không nói ý đó.'};
}
