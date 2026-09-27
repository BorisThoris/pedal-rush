import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createInitialGame,stepGame,steer} from './game/simulation';
import body from './myHookComponents/myCarHookComponent/images/image2vector.svg';
import wheel from './myHookComponents/myCarHookComponent/images/wheel2vector.svg';
import smoke from './myHookComponents/myCarHookComponent/images/smoke.png';
import gas from './myHookComponents/myCarHookComponent/images/gasPedal.png';
import brake from './myHookComponents/myCarHookComponent/images/breakPedal.png';
import './App.css';
const BEST_KEY='pedal-rush:best-score';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(BEST_KEY))||0,Number(localStorage.getItem('pedal-rush:coastline-best'))||0);}catch{return 0;}}
const colors=['hue-rotate(95deg)','hue-rotate(160deg)','hue-rotate(240deg)','hue-rotate(305deg)','grayscale(.9)'];
function Car({player=false,color=0,angle=0,recovering=false,braking=false}){
  return <div className={`car-model ${player?'car-model--player':''} ${recovering?'car-model--recovering':''}`}>
    <div className="car-shadow"/>
    <img className="car-body" src={body} alt={player?'Blue MX-5':''} draggable="false" style={{filter:player?undefined:colors[color]}}/>
    <img className="car-wheel car-wheel--rear" src={wheel} alt="" draggable="false" style={{transform:`rotate(${angle}deg)`}}/>
    <img className="car-wheel car-wheel--front" src={wheel} alt="" draggable="false" style={{transform:`rotate(${angle}deg)`}}/>
    {recovering&&<img className="car-smoke" src={smoke} alt=""/>}
    {braking&&<i className="brake-light"/>}
  </div>;
}
function Pedal({name,image,pressed,setPedal}){
 const key=name.toLowerCase();
 return <button className={`pedal ${pressed?'pedal--down':''}`} type="button" aria-label={name} aria-pressed={pressed}
   onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);setPedal(key,true);}}
   onPointerUp={()=>setPedal(key,false)} onPointerCancel={()=>setPedal(key,false)} onLostPointerCapture={()=>setPedal(key,false)} onBlur={()=>setPedal(key,false)}
   onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();setPedal(key,true);}}}
   onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();setPedal(key,false);}}}>
   <img src={image} alt="" draggable="false"/><span>{name}</span>
 </button>;
}
export default function App(){
 const game=useRef(createInitialGame()),controls=useRef({gas:false,brake:false}),seed=useRef(1701),stage=useRef(null);
 const [view,setView]=useState(()=>({...game.current})),[input,setInput]=useState(controls.current),[best,setBest]=useState(readBest);
 const bestRef=useRef(best);
 const publish=useCallback(()=>setView({...game.current,traffic:game.current.traffic.map(car=>({...car}))}),[]);
 const release=useCallback(()=>{controls.current={gas:false,brake:false};setInput(controls.current);},[]);
 const setPedal=useCallback((name,value)=>{if(['paused','crashed'].includes(game.current.phase))return;controls.current={...controls.current,[name]:value};setInput(controls.current);},[]);
 const newRun=useCallback(()=>{release();game.current=createInitialGame(++seed.current);publish();stage.current?.focus();},[publish,release]);
 const pause=useCallback(()=>{if(!['running','paused'].includes(game.current.phase))return;game.current.phase=game.current.phase==='paused'?'running':'paused';release();publish();},[publish,release]);
 const lane=useCallback(direction=>{steer(game.current,direction);publish();},[publish]);
 useEffect(()=>{
  const down=event=>{if(event.target instanceof HTMLElement&&(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)||event.target.isContentEditable))return;
   const key=event.key.toLowerCase();if([' ','enter'].includes(key)&&event.target instanceof HTMLElement&&event.target.tagName==='BUTTON')return;
   if(![' ','w','s','a','d','arrowup','arrowdown','arrowleft','arrowright','escape','p','enter'].includes(key))return;event.preventDefault();
   if(!event.repeat&&['p','escape'].includes(key))pause();
   if(!event.repeat&&key==='enter'&&game.current.phase==='crashed')newRun();
   if([' ','w'].includes(key))setPedal('gas',true);if(key==='s')setPedal('brake',true);
   if(!event.repeat&&['arrowup','arrowleft','a'].includes(key))lane(-1);if(!event.repeat&&['arrowdown','arrowright','d'].includes(key))lane(1);
  };
  const up=event=>{const key=event.key.toLowerCase();if([' ','w'].includes(key))setPedal('gas',false);if(key==='s')setPedal('brake',false);};
  const blur=()=>{release();if(game.current.phase==='running'){game.current.phase='paused';publish();}};
  const visibility=()=>{if(document.hidden)blur();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[lane,newRun,pause,publish,release,setPedal]);
 useEffect(()=>{
  let frame,previous=0;
  const tick=now=>{const before=game.current.phase;stepGame(game.current,controls.current,previous?(now-previous)/1000:0);previous=now;
   if(before!=='crashed'&&game.current.phase==='crashed')release();
   if(game.current.score>bestRef.current){bestRef.current=game.current.score;setBest(bestRef.current);}
   publish();frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  const save=()=>{try{localStorage.setItem(BEST_KEY,String(bestRef.current));}catch{/* Storage can be unavailable; driving still works. */}};
  const timer=setInterval(save,2000);window.addEventListener('pagehide',save);
  return()=>{cancelAnimationFrame(frame);clearInterval(timer);save();window.removeEventListener('pagehide',save);};
 },[publish,release]);
 const frozen=view.phase!=='running';
 return <main ref={stage} tabIndex={-1} className={`game ${view.impact>0?'game--impact':''}`} aria-label="Pedal Rush game" data-phase={view.phase} data-speed={view.speed.toFixed(2)} data-distance={view.distance.toFixed(2)} data-lane={view.targetLane+1} data-health={view.health}>
  <div className="world" aria-hidden="true" style={{'--road-offset':`${-view.scroll*55}px`,'--hill-offset':`${-view.scroll*9}px`,'--sky-offset':`${-view.scroll*2}px`}}>
   <div className="sky"/><div className="hills"/>
   <div className="road"><div className="road-texture"/>{[0,1,2].map(n=><div className={`road-lane road-lane--${n}`} key={n}><span>{n+1}</span></div>)}
    {view.traffic.map(car=><div key={car.id} className="vehicle traffic" style={{'--ahead':car.z,top:`${(car.lane+.5)*100/3}%`,zIndex:10+car.lane*2}}><Car color={car.color} angle={view.trafficWheelAngle}/></div>)}
    <div className="vehicle player" data-testid="player-car" style={{top:`${(view.lane+.5)*100/3}%`,zIndex:11+Math.round(view.lane)*2}}><Car player angle={view.wheelAngle} recovering={view.recovery>0} braking={!frozen&&input.brake}/></div>
   </div>
  </div>
  <header className="hud">
   <div className="speed"><h1>Pedal Rush</h1><strong data-testid="speed">{Math.round(view.speed)}<small>mph</small></strong></div>
   <div className="stats"><div><span>Score</span><strong data-testid="score">{view.score.toLocaleString()}</strong></div><div><span>Best</span><strong data-testid="best">{best.toLocaleString()}</strong></div><label>Health <strong>{view.health}%</strong><meter min="0" max="100" low="35" optimum="100" value={view.health}/></label></div>
   <button className="pause-button" onClick={pause} disabled={view.phase==='ready'||view.phase==='crashed'} aria-label="Pause run">Ⅱ</button>
  </header>
  <div className="run-info"><span>Lane {view.targetLane+1} / 3</span><span>{(view.distance/1000).toFixed(2)} km</span><span>{view.passes} passed · ×{view.combo}</span></div>
  <div className="message" role="status">{view.phase==='ready'?'Hold Gas or Space to drive':view.messageTime>0?view.message:view.speed<1?'Ready when you are — hold Gas':'Keep a clear lane'}</div>
  <footer className="controls">
   <div className="lane-controls"><span>Change lane</span><div><button aria-label="Move up a lane" disabled={view.targetLane===0||['paused','crashed'].includes(view.phase)} onPointerDown={event=>{event.preventDefault();lane(-1);}} onClick={event=>{if(event.detail===0)lane(-1);}}>↑</button><button aria-label="Move down a lane" disabled={view.targetLane===2||['paused','crashed'].includes(view.phase)} onPointerDown={event=>{event.preventDefault();lane(1);}} onClick={event=>{if(event.detail===0)lane(1);}}>↓</button></div></div>
   <p className="keyboard-help"><kbd>↑</kbd><kbd>↓</kbd> lanes<br/><kbd>Space</kbd> gas <kbd>S</kbd> brake<br/><kbd>Esc</kbd> pause</p>
   <div className="pedals"><Pedal name="Brake" image={brake} pressed={input.brake} setPedal={setPedal}/><Pedal name="Gas" image={gas} pressed={input.gas} setPedal={setPedal}/></div>
  </footer>
  {['paused','crashed'].includes(view.phase)&&<div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{view.phase==='paused'?'Run paused':'Run complete'}</h2><p>{view.score.toLocaleString()} points · {(view.distance/1000).toFixed(2)} km · {view.passes} clean passes</p>{view.phase==='paused'&&<button className="primary" onClick={pause}>Resume run</button>}<button className={view.phase==='crashed'?'primary':''} onClick={newRun}>{view.phase==='crashed'?'Try again':'Start a new run'}</button><small>Hold Gas to accelerate. Release to coast.</small></section></div>}
 </main>;
}
