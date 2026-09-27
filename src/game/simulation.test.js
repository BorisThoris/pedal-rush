import { describe, it, expect } from "vitest";
import { createInitialGame, addWave, stepGame, steer, sweptCollision, LANES, MAX_SPEED } from "./simulation";
const running = () => {const game=createInitialGame();game.phase="running";game.speed=32;return game;};
describe("endless coastline driving",()=>{
  it("never blocks all four lanes and leaves an adjacent safe exit across 10000 waves",()=>{
    const game=createInitialGame(19);game.traffic=[];game.distance=10000;
    for(let i=0;i<10000;i++){const row=addWave(game,100);const cars=game.traffic.filter(car=>car.wave===row.wave);expect(cars.length).toBeLessThan(4);expect(cars.some(car=>car.lane===row.safeLane)).toBe(false);expect(Math.abs(row.safeLane-row.previousSafe)).toBeLessThanOrEqual(1);game.traffic=[];}
  });
  it("replays traffic patterns independently from rendering",()=>{expect(createInitialGame(55)).toEqual(createInitialGame(55));expect(createInitialGame(55).traffic).not.toEqual(createInitialGame(56).traffic);});
  it("does not advance any state while ready, paused or crashed",()=>{for(const phase of ["ready","paused","crashed"]){const game=createInitialGame();game.phase=phase;const before=structuredClone(game);stepGame(game,{gas:true},100);expect(game).toEqual(before);}});
  it("limits lane travel and allows smooth consecutive changes",()=>{const game=running();steer(game,-1);steer(game,-1);expect(game.targetLane).toBe(0);stepGame(game,{},.05);expect(game.x).toBeGreaterThan(LANES[0]);for(let i=0;i<30;i++)stepGame(game,{},.016);expect(game.x).toBe(LANES[0]);});
  it("detects swept longitudinal and diagonal contact without rounding lanes",()=>{expect(sweptCollision(LANES[1],LANES[1],20,-20,1)).toBe(true);expect(sweptCollision(LANES[0],LANES[0],20,-20,1)).toBe(false);expect(sweptCollision(LANES[0],LANES[1],3,-3,1)).toBe(true);expect(sweptCollision(LANES[1],LANES[1],30,20,1)).toBe(false);});
  it("ends the run on actual contact and preserves final score",()=>{const game=running();game.traffic=[{id:0,lane:1,z:4.3,type:0}];stepGame(game,{},.05);expect(game.phase).toBe("crashed");const score=game.score;stepGame(game,{gas:true},1);expect(game.score).toBe(score);});
  it("awards a close pass once and brakes below cruise speed",()=>{const game=running();game.x=LANES[0];game.targetLane=0;game.traffic=[{id:0,lane:1,z:-4.9,type:0,passed:false}];stepGame(game,{},.05);expect(game.nearMisses).toBe(1);expect(game.bonus).toBe(200);for(let i=0;i<30;i++)stepGame(game,{brake:true},.05);expect(game.bonus).toBe(200);expect(game.speed).toBeLessThan(20);});
  it("drains and recharges gas without stuttering on empty or lowering score",()=>{const game=running();game.traffic=[];game.nextWaveAt=100000;let score=0;for(let i=0;i<120;i++){stepGame(game,{gas:true},.05);expect(game.score).toBeGreaterThanOrEqual(score);score=game.score;}expect(game.boostLocked).toBe(true);expect(game.speed).toBeLessThanOrEqual(MAX_SPEED);stepGame(game,{},.05);expect(game.boostLocked).toBe(false);expect(game.score).toBeGreaterThanOrEqual(score);});
  it("keeps traffic bounded and reachable through 20 minutes at full difficulty",()=>{
    const game=running();game.distance=4000;game.traffic=[];game.trafficProgress=0;game.nextWaveAt=90;game.safeLane=1;
    let peak=0;
    for(let i=0;i<24000;i++){
      const next=game.traffic.filter(car=>car.z>5).sort((a,b)=>a.z-b.z)[0];
      if(next && next.z<60){const blocked=new Set(game.traffic.filter(car=>car.wave===next.wave).map(car=>car.lane));if(blocked.has(game.targetLane)){const open=[0,1,2,3].filter(lane=>!blocked.has(lane)).sort((a,b)=>Math.abs(a-game.targetLane)-Math.abs(b-game.targetLane));steer(game,Math.sign(open[0]-game.targetLane));}}
      stepGame(game,{gas:i%200<80},.05);peak=Math.max(peak,game.traffic.length);
      expect(game.phase,`frame ${i}, distance ${game.distance}`).toBe("running");
    }
    expect(game.distance).toBeGreaterThan(50000);expect(game.passes).toBeGreaterThan(500);expect(peak).toBeLessThan(25);
  });
});
