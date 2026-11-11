export function sourceRangePreview({src,url,range,onChange,validate=()=>{}}){
 const root=document.createElement('div'),video=document.createElement('video'),status=document.createElement('p');
 root.setAttribute('aria-label','Xem đoạn nguồn '+src);status.setAttribute('role','status');
 video.controls=true;video.preload='none';video.playsInline=true;video.style.cssText='display:none;width:100%;max-height:260px;background:#000';video.setAttribute('aria-label','Video nguồn '+src);
 let disposed=false,stopAt=null;
 const report=error=>{status.textContent=error.message;};
 const load=async()=>{
  validate();if(disposed)throw new Error('Hộp chọn nguồn đã đóng.');
  if(video.readyState>=1)return;
  await new Promise((resolve,reject)=>{const done=error=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',bad);error?reject(error):resolve();},ok=()=>done(),bad=()=>done(new Error('Không mở được video nguồn. Kiểm tra file hoặc codec.')),timer=setTimeout(()=>done(new Error('Mở xem trước quá thời gian. Thử lại.')),15000);video.addEventListener('loadedmetadata',ok);video.addEventListener('error',bad);video.src=url;video.style.display='block';video.load();});
  validate();if(disposed)throw new Error('Hộp chọn nguồn đã đóng.');
 };
 const button=(label,action)=>{const el=document.createElement('button');el.textContent=label;el.onclick=async()=>{el.disabled=true;try{await action();}catch(error){report(error);}finally{el.disabled=false;}};return el;};
 const open=button('Mở xem trước',async()=>{await load();status.textContent=`Nguồn ${video.duration.toFixed(2)}s. Kéo thanh phát để chọn cảnh.`;});
 const play=button('Phát đoạn đã chọn',async()=>{await load();const from=range.from??0,to=range.to??video.duration,speed=range.speed??1;if(![from,to,speed].every(Number.isFinite)||from<0||to>video.duration+.05||to<=from||speed<.25||speed>4)throw new Error('Điểm vào/ra hoặc tốc độ không hợp lệ.');video.currentTime=from;video.playbackRate=speed;stopAt=to;await video.play();});
 const mark=key=>button(key==='from'?'Lấy mốc này làm Vào':'Lấy mốc này làm Ra',async()=>{await load();validate();const value=Math.round(video.currentTime*1000)/1000;onChange(key,value);status.textContent=`Đã đặt ${key==='from'?'Vào':'Ra'}: ${value}s. Kiểm tra nguồn lại trước khi thêm.`;});
 video.ontimeupdate=()=>{if(stopAt!==null&&video.currentTime>=stopAt){video.pause();stopAt=null;}status.textContent=`Mốc nguồn: ${video.currentTime.toFixed(3)} / ${video.duration.toFixed(3)}s`;};
 root.append(open,play,mark('from'),mark('to'),video,status);
 return {element:root,dispose(){disposed=true;video.pause();video.removeAttribute('src');video.load();root.remove();}};
}
