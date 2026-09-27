export const LANES = [0, 1, 2];
export const MAX_SPEED = 150;
export const TRAFFIC_SPEED = 35;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const nextLane = (lane, direction) => clamp(lane + direction, 0, LANES.length - 1);
function random(game) { game.seed = (Math.imul(game.seed,1664525)+1013904223)>>>0; return game.seed/4294967296; }
export function addWave(game,z) {
  const previousSafe=game.safeLane;
  game.safeLane=nextLane(previousSafe,Math.floor(random(game)*3)-1);
  const open=new Set([game.safeLane]);
  if(game.distance<500 || random(game)<.25)open.add(nextLane(game.safeLane,game.safeLane===2?-1:1));
  const wave=game.wave++;
  for(const lane of LANES)if(!open.has(lane))game.traffic.push({id:game.nextId++,wave,lane,z,color:Math.floor(random(game)*5),passed:false,hit:false});
  return {safeLane:game.safeLane,previousSafe,wave};
}
export function createInitialGame(seed=1701) {
  const game={phase:'ready',seed:seed>>>0,speed:0,distance:0,score:0,bonus:0,passes:0,combo:1,health:100,
    lane:1,targetLane:1,scroll:0,wheelAngle:0,trafficWheelAngle:0,time:0,recovery:0,impact:0,
    traffic:[],nextId:0,wave:0,safeLane:1,nextWaveAt:24,trafficProgress:0,message:'Hold Gas or Space to drive',messageTime:0};
  while(game.nextWaveAt<70){addWave(game,game.nextWaveAt);game.nextWaveAt+=20;}
  return game;
}
export function steer(game,direction){if(game.phase==='running'||game.phase==='ready')game.targetLane=nextLane(game.targetLane,direction);}
export function sweptCollision(previousLane,lane,previousZ,z,trafficLane) {
  let enter=0,exit=1;
  // Same side-profile footprint used by the responsive renderer: wheels fit
  // inside a 5.2-unit car; bumpers collide over the central 4.4-unit span.
  for(const [start,delta,low,high] of [[previousLane,lane-previousLane,trafficLane-.42,trafficLane+.42],[previousZ,z-previousZ,-4.4,4.4]]){
    if(Math.abs(delta)<1e-9){if(start<low||start>high)return false;}
    else {const a=(low-start)/delta,b=(high-start)/delta;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));if(enter>exit)return false;}
  }
  return true;
}
export function stepGame(game,controls,elapsed){
  if(game.phase==='ready'&&controls.gas&&!controls.brake)game.phase='running';
  if(game.phase!=='running')return game;
  const dt=clamp(elapsed,0,.05);
  game.time+=dt;game.recovery=Math.max(0,game.recovery-dt);game.impact=Math.max(0,game.impact-dt*3);game.messageTime=Math.max(0,game.messageTime-dt);
  game.speed=clamp(game.speed+(controls.brake?-95:controls.gas?38:-16)*dt,0,MAX_SPEED);
  const previousLane=game.lane;
  game.lane+=clamp(game.targetLane-game.lane,-3.4*dt,3.4*dt);
  game.distance+=game.speed*.44704*dt;
  const travel=game.speed*.04*dt;
  game.scroll+=travel;game.wheelAngle=(game.wheelAngle+travel*160)%360;
  // Traffic is stationary with the player at rest. It begins moving with the
  // run, and never reverses or spawns behind an idle player.
  const trafficSpeed=Math.min(TRAFFIC_SPEED,game.speed);
  game.trafficWheelAngle=(game.trafficWheelAngle+trafficSpeed*.04*dt*160)%360;
  const closing=(game.speed-trafficSpeed)*.04*dt;
  game.trafficProgress+=closing;
  for(const car of game.traffic){
    const previousZ=car.z;car.z-=closing;
    if(!car.hit&&game.recovery===0&&sweptCollision(previousLane,game.lane,previousZ,car.z,car.lane)){
      car.hit=true;game.health=Math.max(0,game.health-34);game.speed*=.45;game.combo=1;game.recovery=1.8;game.impact=1;
      game.message=game.health===0?'Run complete':'Bump! Find a clear lane';game.messageTime=2;
      if(game.health===0){game.phase='crashed';game.speed=0;break;}
    }
    if(!car.passed&&car.z<-5.2&&previousZ>=-5.2){car.passed=true;if(!car.hit){game.passes++;game.combo=Math.min(5,game.combo+1);game.bonus+=25*game.combo;game.message=`Clean pass +${25*game.combo}`;game.messageTime=1.3;}}
  }
  game.traffic=game.traffic.filter(car=>car.z>-12);
  while(game.nextWaveAt-game.trafficProgress<70){addWave(game,game.nextWaveAt-game.trafficProgress);game.nextWaveAt+=20-Math.min(2,game.distance/2000);}
  game.score=Math.floor(game.distance+game.bonus);
  return game;
}
