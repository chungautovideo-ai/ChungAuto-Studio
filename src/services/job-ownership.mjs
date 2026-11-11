// Compare an execution's immutable submission identity before late callbacks write.
export function sameSubmittedJob(current,expected){
 if(!current||!expected)return false;
 if(JSON.stringify(current.execution||null)!==JSON.stringify(expected.execution||null))return false;
 return ['createdAt','completionToken','baseRevision','project','kind','candidate'].every(key=>current[key]===expected[key]);
}
export function ownsWorkingJob(current,expected){
 return sameSubmittedJob(current,expected)&&current.status==='working'&&!!expected.claimedBy?.id&&current.claimedBy?.id===expected.claimedBy.id;
}
