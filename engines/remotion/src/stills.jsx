import React from 'react';
import {registerRoot,Still} from 'remotion';
import {Poster} from './aiev/Poster';
import {Thumbnail} from './aiev/Thumbnail';
const dimensions={'9:16':[1080,1920],'16:9':[1920,1080],'1:1':[1080,1080],'4:5':[1080,1350]};
const design={colors:{primary:'#d3f53c',secondary:'#ffffff',background:'#101014',text:'#ffffff',accent:'#d3f53c'},fonts:{heading:'Arial',body:'Arial'},fontFiles:{heading:null,body:null},effects:{gradient:true,liquidGlass:true},logoFile:null,brandName:''};
const defaults={aspect:'1:1',background:null,frame:null,title:'ContentOS',overlay:{title:'ContentOS',subtitle:'',cta:'',stats:[],position:'auto',showLogo:true},design};
const calculateMetadata=({props})=>({width:dimensions[props.aspect][0],height:dimensions[props.aspect][1]});
function Root(){return <><Still id="ContentOSPoster" component={Poster} width={1080} height={1080} defaultProps={defaults} calculateMetadata={calculateMetadata}/><Still id="ContentOSThumbnail" component={Thumbnail} width={1080} height={1080} defaultProps={defaults} calculateMetadata={calculateMetadata}/></>;}
registerRoot(Root);
