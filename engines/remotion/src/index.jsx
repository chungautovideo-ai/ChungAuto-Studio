import React from 'react';
import {registerRoot,Composition,AbsoluteFill,useCurrentFrame,interpolate} from 'remotion';

function TitleCard({title,subtitle,background,color,accent}){
 const frame=useCurrentFrame();
 const opacity=interpolate(frame,[0,10],[0,1],{extrapolateRight:'clamp'});
 const shift=interpolate(frame,[0,16],[55,0],{extrapolateRight:'clamp'});
 return <AbsoluteFill style={{backgroundColor:background,color,fontFamily:'Arial, sans-serif',justifyContent:'center',padding:'8%',overflow:'hidden'}}>
  <div style={{opacity,transform:`translateY(${shift}px)`}}>
   <div style={{width:100,height:12,backgroundColor:accent,marginBottom:36}} />
   <div style={{fontSize:90,fontWeight:900,lineHeight:1.1,overflowWrap:'anywhere',whiteSpace:'pre-wrap'}}>{title}</div>
   <div style={{fontSize:42,lineHeight:1.35,marginTop:32,whiteSpace:'pre-wrap'}}>{subtitle}</div>
  </div>
 </AbsoluteFill>;
}
const defaults={title:'ContentOS',subtitle:'',background:'#101014',color:'#ffffff',accent:'#d3f53c',width:1080,height:1920,fps:30,durationInFrames:90};
function Root(){return <Composition id="ContentOSTitleCard" component={TitleCard} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={defaults} calculateMetadata={({props})=>({width:props.width,height:props.height,fps:props.fps,durationInFrames:props.durationInFrames})} />;}
registerRoot(Root);
