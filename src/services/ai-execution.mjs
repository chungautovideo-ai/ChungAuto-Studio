export function normalizeExecution(value,{allowApi=false}={}){
  if(value==null)return {mode:'session',agent:'auto'};
  if(allowApi&&value.mode==='api'&&value.agent==='gateway'){
    const model=String(value.model??'').trim();if(model&&!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model))throw Object.assign(new Error('Model API không hợp lệ.'),{status:400});
    return {mode:'api',agent:'gateway',...(model?{model}:{})};
  }
  const mode=value.mode,agent=value.agent;
  const sessionAgents=['auto','codex','claude','antigravity'],cliAgents=['codex','claude'];
  if(!['session','cli'].includes(mode)||(mode==='session'?!sessionAgents.includes(agent):!cliAgents.includes(agent))){
    throw Object.assign(new Error('Chọn phiên Codex/Claude/Antigravity hoặc CLI cụ thể. Kết nối API chưa được hỗ trợ ở luồng này.'),{status:400});
  }
  const model=String(value.model??'').trim();
  if(model&&(mode!=='cli'||!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model)))throw Object.assign(new Error('Model ID không hợp lệ hoặc chế độ phiên đang mở không cho ghi đè model.'),{status:400});
  return {mode,agent,...(model?{model}:{})};
}
export function cliModelArgs(execution,helpText){
  const normalized=normalizeExecution(execution);
  if(!normalized.model)return [];
  if(!/(?:^|[\s,])--model(?:\s|=|$)/m.test(helpText))throw new Error('CLI đang cài không xác nhận hỗ trợ --model. Cập nhật CLI hoặc để model mặc định.');
  return ['--model',normalized.model];
}
export function acceptsJob(job,agent,{explicit=false}={}){
  if(job.execution?.mode==='api')return false;
  if(job.status!=='waiting'||(!explicit&&job.background))return false;
  const requested=job.execution?.agent;
  return !requested||requested==='auto'||requested===agent;
}
