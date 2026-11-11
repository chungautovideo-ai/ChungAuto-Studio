// srcToOut deliberately moves removed source anchors to the next kept segment.
// Surface that decision; never reinterpret output duration or mutate a clip.
export function brollAnchorStatus(timemap,item){
 const projectAt=Number(item.at)||0;
 const kept=timemap.isKept(projectAt),start=timemap.srcToOut(projectAt);
 return {projectAt,anchorMoved:!kept&&start<timemap.contentTotal,anchorOutsideContent:!kept&&start>=timemap.contentTotal};
}
