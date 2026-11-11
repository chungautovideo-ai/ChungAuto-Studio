import {brollEditorTiming,brollEditorPhraseSearch} from './contentos-broll-editor-timing.js';
export function brollTimingPanel({h,getProject,item,seek,play}){
 const root=h('details',{'data-broll-timing':'',class:'setup-options'}),summary=h('summary',{},'Lời và nhịp cảnh trám'),info=h('p',{class:'help'}),speech=h('p',{}),next=h('p',{class:'help'}),warning=h('p',{class:'help'});
 let current;
 const query=h('input',{type:'search',maxlength:120,placeholder:'Ví dụ: màn, đèn, ghế','aria-label':'Tìm cụm từ trong lời',style:'width:100%;min-width:0'});
 const results=h('div',{'aria-live':'polite'}),status=h('p',{class:'help'});let searched=false;
 function search(){
  searched=true;results.replaceChildren();
  try{
   const found=brollEditorPhraseSearch(getProject(),query.value);
   status.textContent=found.captionDisabled?'Phụ đề đang tắt; chưa tìm được lời.':found.total?`${found.total} đoạn khớp${found.truncated?' · hiện 20 đoạn đầu':''}.`:'Không thấy cụm từ này trong phụ đề; lời nhận dạng có thể khác.';
   for(const match of found.matches){
    const watchMatch=h('button',{class:'outline small',type:'button',onclick:()=>{
     const fresh=brollEditorPhraseSearch(getProject(),query.value).matches.find(m=>m.words[0]?.captionId===match.words[0]?.captionId&&m.words[0]?.projectStart===match.words[0]?.projectStart&&m.words.at(-1)?.projectEnd===match.words.at(-1)?.projectEnd);
     if(!fresh){search();return;}seek(fresh.outputStart);play?.();
    }},`Xem từ ${match.outputStart.toFixed(2)}s`);
    results.append(h('div',{style:'padding:8px 0;overflow-wrap:anywhere'},h('p',{class:'help'},match.context),watchMatch));
   }
  }catch(error){status.textContent=error.message;}
 }
 query.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();search();}};
 query.oninput=()=>{searched=false;results.replaceChildren();status.textContent='Bấm Tìm hoặc Enter để tra lời.';};
 const searchButton=h('button',{class:'outline small',type:'button',onclick:search},'Tìm');
 const watch=h('button',{class:'outline small',type:'button',onclick:()=>{root.refresh();if(!current?.available)return;seek(current.start);play?.();}},'Xem từ đầu cảnh');
 root.refresh=()=>{
  current=brollEditorTiming(getProject(),item);watch.disabled=!current.available;
  if(searched)search();
  if(!current.available){info.textContent=current.reason;speech.textContent='';next.textContent='';warning.textContent='';return;}
  info.textContent=`Sau cắt: ${current.start.toFixed(2)}–${current.end.toFixed(2)}s · Sau hiệu ứng: ${current.entrance.settledDuration.toFixed(2)}s.`+(current.anchorMoved?` Mốc gốc ${current.projectAt.toFixed(2)}s nằm trong đoạn đã bỏ; cảnh được dời tới đoạn giữ kế tiếp. Kiểm lại lời trước khi đổi mốc.`:'');
  speech.textContent=current.words.length?current.words.map(w=>w.text).join(' ')+(current.truncated?' … (còn lời)':''):current.captionDisabled?'Phụ đề đang tắt; chưa có lời để đối chiếu.':'Chưa có từ phụ đề giao với cảnh này.';
  next.textContent=current.nextWord?`Từ tiếp theo: “${current.nextWord.text}” (${current.nextWord.outputStart.toFixed(2)}s).`:'';
  const notices=[];if(current.duration<.6)notices.push('Insert dưới 0,6s');if(current.entrance.animationDuration>=current.duration&&current.entrance.animationDuration>0)notices.push('Hiệu ứng chiếm hết cảnh');else if(current.entrance.entranceWithinShot>current.duration*.5)notices.push('Hiệu ứng chiếm hơn nửa cảnh');if(current.startsInsideWord||current.endsInsideWord)notices.push('Điểm cắt nằm giữa từ');
  warning.textContent=notices.length?notices.join(' · ')+'. Xem lại theo ý dựng; không bắt buộc kéo dài.':'';
 };
 root.append(summary,info,speech,next,warning,watch,h('p',{class:'help'},'Lời lấy từ phụ đề đã lưu, có thể thiếu hoặc sai. Thời gian sau hiệu ứng không chứng minh hình đúng sản phẩm hay đủ dễ đọc. Nút xem tiếp tục phát timeline để kiểm cả điểm chuyển ý.'),h('label',{},'Tìm trong lời',query),searchButton,status,results,h('p',{class:'help'},'Tìm chỉ tra phụ đề, không dời cảnh trám. Bấm Xem để phát từ đoạn lời; kiểm hình trước khi đổi mốc.'));
 root.refresh();return root;
}
