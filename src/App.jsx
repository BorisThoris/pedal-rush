import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoadScene } from "./game/scene";
import { createInitialGame, stepGame, steer } from "./game/simulation";
import "./App.css";

const BEST_KEY = "pedal-rush:coastline-best";
function readBest() { try { return Math.max(0, Number(window.localStorage.getItem(BEST_KEY)) || 0); } catch { return 0; } }
const snapshot = game => ({ phase: game.phase, speed: game.speed, score: game.score, distance: game.distance,
  boost: game.boost, boosting: game.boosting, lane: game.targetLane, passes: game.passes,
  nearMisses: game.nearMisses, combo: game.combo, message: game.message, messageTime: game.messageTime });

function createSound() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  const context = new Context(), gain = context.createGain(), filter = context.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 220;
  gain.gain.value = 0; filter.connect(gain); gain.connect(context.destination);
  const oscillators = [1, 1.5].map(ratio => { const oscillator = context.createOscillator();
    oscillator.type = "sawtooth"; oscillator.frequency.value = 45 * ratio; oscillator.connect(filter); oscillator.start(); return oscillator; });
  return { resume: () => context.resume().catch(() => {}), update(game, enabled) {
    const now=context.currentTime;
    oscillators.forEach((oscillator,index)=>oscillator.frequency.setTargetAtTime((35+game.speed*1.5)*(index?1.5:1),now,.12));
    filter.frequency.setTargetAtTime(game.boosting?420:240,now,.1);
    gain.gain.setTargetAtTime(enabled && game.phase === "running" ? .035 : 0,now,.1);
  }, dispose: () => { oscillators.forEach(o=>o.stop()); context.close().catch(()=>{}); } };
}

function Pedal({ name, label, hint, pressed, setPedal }) {
  const release = event => { setPedal(name, false); if(event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  return <button className={`pedal ${name} ${pressed ? "pressed" : ""}`} aria-label={label} aria-pressed={pressed}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); setPedal(name,true); }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={()=>setPedal(name,false)} onBlur={release}
    onKeyDown={event => { if([" ","Enter"].includes(event.key)){ event.preventDefault(); setPedal(name,true); } }}
    onKeyUp={event => { if([" ","Enter"].includes(event.key)) release(event); }}>
    <span className="pedal-face" aria-hidden="true"><i/><i/><i/></span><strong>{label}</strong><small>{hint}</small>
  </button>;
}

export default function App() {
  const game = useRef(createInitialGame());
  const [view, setView] = useState(()=>snapshot(game.current));
  const [best, setBest] = useState(readBest), bestRef=useRef(best);
  const [input, setInput] = useState({gas:false,brake:false}), controls=useRef(input);
  const [soundOn,setSoundOn]=useState(false), soundEnabled=useRef(false), audio=useRef(null);
  const [renderError,setRenderError]=useState("");
  const host=useRef(null), stage=useRef(null), runSeed=useRef(1701);
  const publish=useCallback(()=>setView(snapshot(game.current)),[]);
  const setPedal=useCallback((name,pressed)=>{
    controls.current={...controls.current,[name]:pressed && game.current.phase==="running"};
    setInput(controls.current);
  },[]);
  const release=useCallback(()=>{controls.current={gas:false,brake:false};setInput(controls.current);},[]);
  const start=useCallback(()=>{
    release(); game.current=createInitialGame(runSeed.current++); game.current.phase="running"; game.current.speed=22;
    game.current.message="LET'S DRIVE"; game.current.messageTime=2;
    audio.current?.resume(); publish(); stage.current?.focus();
  },[publish,release]);
  const pause=useCallback(()=>{
    if(!["running","paused"].includes(game.current.phase))return;
    game.current.phase=game.current.phase==="running"?"paused":"running";
    release(); publish(); stage.current?.focus();
  },[publish,release]);
  const lane=useCallback(direction=>{steer(game.current,direction);publish();},[publish]);
  const toggleSound=()=>{
    if(!audio.current) { try {audio.current=createSound();}catch {return;} }
    audio.current?.resume(); soundEnabled.current=!soundEnabled.current;setSoundOn(soundEnabled.current);
  };
  useEffect(()=>{
    const keydown=event=>{
      if(event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)))return;
      const key=event.key.toLowerCase();
      if(!["arrowleft","arrowright","a","d","arrowup","arrowdown","w","s"," ","escape","p","enter"].includes(key))return;
      if((key===" " || key==="enter") && event.target instanceof HTMLElement && event.target.tagName==="BUTTON")return;
      event.preventDefault();
      if(key==="enter" && ["ready","crashed"].includes(game.current.phase)){start();return;}
      if(!event.repeat && ["escape","p"].includes(key)){pause();return;}
      if(game.current.phase!=="running")return;
      if(!event.repeat && ["arrowleft","a"].includes(key))lane(-1);
      if(!event.repeat && ["arrowright","d"].includes(key))lane(1);
      if(["arrowup","w"," "].includes(key))setPedal("gas",true);
      if(["arrowdown","s"].includes(key))setPedal("brake",true);
    };
    const keyup=event=>{const key=event.key.toLowerCase();if(["arrowup","w"," "].includes(key))setPedal("gas",false);if(["arrowdown","s"].includes(key))setPedal("brake",false);};
    const blur=()=>{release();if(game.current.phase==="running"){game.current.phase="paused";publish();}};
    const visibility=()=>{if(document.hidden)blur();};
    window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);window.addEventListener("blur",blur);document.addEventListener("visibilitychange",visibility);
    return()=>{window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);window.removeEventListener("blur",blur);document.removeEventListener("visibilitychange",visibility);};
  },[lane,pause,publish,release,setPedal,start]);
  useEffect(()=>{
    let scene;
    try {scene=createRoadScene(host.current);} catch {setRenderError("The 3D renderer could not start. Enable hardware acceleration or try another WebGL-capable browser.");return;}
    let frame,previous=0,lastPublish=0;
    const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tick=now=>{
      const oldPhase=game.current.phase;
      stepGame(game.current,controls.current,previous ? (now-previous)/1000 : 0);
      previous=now; game.current.braking=controls.current.brake;
      if(oldPhase==="running" && game.current.phase==="crashed"){
        release();
        if(game.current.score>bestRef.current){bestRef.current=game.current.score;setBest(game.current.score);try{window.localStorage.setItem(BEST_KEY,String(game.current.score));}catch{/* The run remains playable when storage is unavailable. */}}
        publish();
      }
      audio.current?.update(game.current,soundEnabled.current);
      scene.render(game.current,now,reducedMotion);
      if(now-lastPublish>80){publish();lastPublish=now;}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    const lost=event=>{event.preventDefault();game.current.phase="paused";release();publish();setRenderError("Graphics connection lost. Reload to reconnect the renderer. Your saved best is safe.");};
    host.current.addEventListener("webglcontextlost",lost,true);
    const element=host.current;
    return()=>{cancelAnimationFrame(frame);element.removeEventListener("webglcontextlost",lost,true);scene.dispose();audio.current?.dispose();audio.current=null;};
  },[publish,release]);
  const active=["running","paused"].includes(view.phase);
  return <main className={`game-shell phase-${view.phase}`} ref={stage} tabIndex={-1} aria-label="Pedal Rush game" data-phase={view.phase}>
    <div className="scene" ref={host}/><div className="vignette"/>
    <header className="topbar"><a className="wordmark" href="#" onClick={e=>e.preventDefault()} aria-label="Pedal Rush"><span>Pedal Rush</span></a>
      <div className="run-stats"><div><small>SCORE</small><strong data-testid="score">{view.score.toLocaleString()}</strong></div><div><small>DISTANCE</small><strong>{(view.distance/1000).toFixed(2)}<em> km</em></strong></div><div className="best-stat"><small>PERSONAL BEST</small><strong>{best.toLocaleString()}</strong></div></div>
      <div className="top-actions"><button onClick={toggleSound} aria-label={soundOn?"Mute sound":"Enable sound"} title={soundOn?"Mute sound":"Enable sound"}>{soundOn?"SOUND ON":"SOUND OFF"}</button>{active && <button onClick={pause} aria-label={view.phase==="paused"?"Resume":"Pause"}>{view.phase==="paused"?"▶":"Ⅱ"}</button>}</div>
    </header>
    <div className="route-label"><span className="route-number">01</span><div>THE COASTLINE<small>GOLDEN HOUR / ENDLESS RUN</small></div></div>
    {view.phase==="ready" && !renderError && <section className="intro panel" aria-labelledby="start-title"><p className="eyebrow">TRAFFIC RUN</p><h1 id="start-title">Pedal Rush</h1><p className="lede">Four lanes. No finish line.<br/>Find your flow through the coastline traffic.</p><button className="primary" onClick={start}>START RUN <span>↗</span></button><p className="start-hint">PRESS ENTER TO START</p><div className="tutorial"><p><b>← → / A D</b> Change lane</p><p><b>↑ / SPACE</b> Hold gas for a burst</p><p><b>↓ / S</b> Brake for space</p><p><b>P / ESC</b> Take a breather</p></div><p className="mobile-hint">Use the on-screen steering and pedals.<br/>Your car cruises automatically. One impact ends the run.</p></section>}
    {view.phase==="paused" && !renderError && <div className="modal-backdrop"><section className="pause-panel panel" aria-labelledby="pause-title"><h2 id="pause-title">Run paused</h2><p>The road will wait. Your run is paused.</p><button className="primary" onClick={pause}>RESUME RUN <span>→</span></button><button className="text-button" onClick={start}>Start a new run</button></section></div>}
    {view.phase==="crashed" && !renderError && <section className="results panel" aria-labelledby="result-title"><p className="eyebrow">{view.score>=best && view.score>0?"NEW PERSONAL BEST":"END OF THE ROAD"}</p><h2 id="result-title">Run complete</h2><div className="result-score">{view.score.toLocaleString()}<small>POINTS</small></div><div className="result-stats"><p><b>{(view.distance/1000).toFixed(2)} km</b>Distance</p><p><b>{view.passes}</b>Overtakes</p><p><b>{view.nearMisses}</b>Close calls</p></div><p>Leave a gap. Brake early. Make the next one count.</p><button className="primary" onClick={start}>DRIVE AGAIN <span>↗</span></button><p className="start-hint">ENTER TO RETRY · BEST {best.toLocaleString()}</p></section>}
    {renderError && <div className="modal-backdrop"><section className="pause-panel panel" role="alert"><h2>LET'S GET<br/>YOU RUNNING.</h2><p>{renderError}</p><button className="primary" onClick={()=>location.reload()}>RELOAD GAME</button></section></div>}
    {view.phase==="running" && view.messageTime>0 && <div className="callout" role="status"><span>{view.message}</span>{view.combo>1 && <small>FLOW ×{view.combo}</small>}</div>}
    <footer className="drive-deck" aria-label="Driving controls">
      <div className="steering"><button aria-label="Move left" onClick={()=>lane(-1)} disabled={!active}>←</button><button aria-label="Move right" onClick={()=>lane(1)} disabled={!active}>→</button><small>CHANGE LANE</small></div>
      <div className="instrument"><div className="speed"><strong>{Math.round(view.speed*3.6)}</strong><span>KM/H</span></div><div className="energy-label"><span>{view.boosting?"FULL THROTTLE":"GAS RESERVE"}</span><span>{Math.round(view.boost)}%</span></div><div className="energy-track" role="meter" aria-label="Gas reserve" aria-valuenow={Math.round(view.boost)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${view.boost}%`}}/></div><small className="lane-status">LANE {view.lane+1} / 4 <span>·</span> {input.brake?"BRAKING":view.boosting?"BOOST":"AUTO CRUISE"}</small></div>
      <div className="pedals"><Pedal name="brake" label="Brake" hint="↓ / S" pressed={input.brake} setPedal={setPedal}/><Pedal name="gas" label="Gas" hint="↑ / SPACE" pressed={input.gas} setPedal={setPedal}/></div>
    </footer>
  </main>;
}
