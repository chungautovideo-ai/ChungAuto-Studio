// Codex currently reports successful `login status` to stderr.
// Exit success alone is insufficient: unknown output is not an authentication claim.
export function parseAgentLoginStatus(agent,{stdout='',stderr='',status=0,timedOut=false}={}){
 if(timedOut)return null;
 if(status===null)return null;
 if(status!==0)return false;
 const output=String(stdout)+'\n'+String(stderr);
 if(agent==='codex'){
  if(/(?:\bnot logged in\b|\blogged out\b)/i.test(output))return false;
  return /\blogged in\b/i.test(output)?true:null;
 }
 if(agent==='claude'){
  const index=output.indexOf('{');if(index<0)return null;
  try{const value=JSON.parse(output.slice(index).trim());return typeof value.loggedIn==='boolean'?value.loggedIn:null;}catch{return null;}
 }
 return null;
}
