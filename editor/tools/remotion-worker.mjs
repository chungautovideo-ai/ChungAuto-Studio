import {renderRemotionScene} from '../../src/services/remotion-scenes.mjs';
const controller=new AbortController();let started=false;
process.on('disconnect',()=>controller.abort(new Error('Mất kết nối ứng dụng; dừng tạo cảnh.')));
const report=message=>{if(process.connected)process.send(message,error=>{if(error)controller.abort(error);});};
process.on('message',async message=>{
 if(message?.type==='cancel'){controller.abort(new Error('Đã hủy tạo cảnh.'));return;}
 if(message?.type!=='render'||started)return;started=true;
 try{const result=await renderRemotionScene({...message.options,signal:controller.signal,onProgress:progress=>report({type:'progress',progress})});report({type:'result',result});}
 catch(error){report({type:'error',error:error.message});}
 finally{if(process.connected)process.disconnect();}
});
