import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { LANES, MAX_SPEED } from "./simulation";

const paintColors = [0x36b9b0, 0xeaa94c, 0xdb756a, 0xc7d2d1, 0x6c90bf, 0x51566f];
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const rubber = material(0x171a21), chrome = material(0xabb7ba, { metalness: 0.72, roughness: 0.28 });
const dark = material(0x202b35), glass = material(0x173c4b, { metalness: 0.45, roughness: 0.16 });
const white = material(0xffecd1, { emissive: 0xffd69b, emissiveIntensity: 0.65 });
const red = material(0xef443e, { emissive: 0xff2020, emissiveIntensity: 2.5 });
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const wheelSets = new WeakMap();
function box(group, mat, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(boxGeometry, mat);
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

// Authored cross-sections form the sculpted bodywork, tapered glasshouse and
// wheel shoulders. Each profile is [longitudinal z, half-width, lower y, upper y].
function coachwork(profiles, mat) {
  const vertices = [], indices = [];
  for (const [z, w, bottom, top] of profiles) {
    for (const [x, y] of [[-w * .83,bottom],[-w,bottom+.1],[-w,top-.09],[-w*.82,top],
      [w*.82,top],[w,top-.09],[w,bottom+.1],[w*.83,bottom]]) vertices.push(x,y,z);
  }
  for (let r=0;r<profiles.length-1;r++) for(let j=0;j<8;j++) {
    const a=r*8+j,b=r*8+(j+1)%8,c=b+8,d=a+8;
    indices.push(a,d,b,b,d,c);
  }
  for(let j=1;j<7;j++) { indices.push(0,j,j+1); const n=(profiles.length-1)*8; indices.push(n,n+j+1,n+j); }
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,mat); mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
}

export function createVehicle(color = 0xf36c4e, type = 0, player = false) {
  const car = new THREE.Group();
  const paint = material(color, { metalness: .42, roughness: .32 });
  const long = type === 2 ? 1.14 : 1;
  car.add(coachwork([[-2.12,.72,.4,.66],[-1.86,.87,.38,.79],[-1.65,.92,.47,.86],[-1.34,.94,.73,.94],
    [-1.02,.91,.43,.9],[-.5,.87,.34,.86],[.65,.87,.34,.89],[1.03,.93,.46,.94],
    [1.34,.96,.73,.97],[1.67,.92,.46,.91],[2.04,.83,.4,.8],[2.15,.76,.47,.75]],paint));
  if(type===2) {
    car.add(coachwork([[-1.12,.76,.82,1.02],[-.65,.78,.82,1.8],[1.8,.78,.82,1.86],[1.98,.73,.8,1.67]],paint));
    car.add(coachwork([[-1.135,.68,.94,1.05],[-.67,.68,1.1,1.69]],glass));
    box(car,glass,0,1.35,2,.95,.46,.022);
    for(const x of [-.785,.785]) box(car,glass,x,1.39,-.38,.012,.5,.5);
    box(car,chrome,0,1.72,-.1,1.63,.06,2.7);
  } else {
    const roofHeight=type===1?1.55:1.39;
    car.add(coachwork([[-1.08,.72,.84,.87],[-.48,.65,.87,roofHeight],[.5,.65,.87,roofHeight+.03],[1.32,.75,.87,.95]],glass));
    car.add(coachwork([[-.5,.67,roofHeight-.01,roofHeight+.05],[.47,.67,roofHeight+.03,roofHeight+.08],[.6,.65,roofHeight-.02,roofHeight+.04]],paint));
    for(const x of [-.7,.7]) {
      const pillar=box(car,paint,x,1.12,.6,.06,.61,.07); pillar.rotation.x=-.7;
      box(car,paint,x,.9,-.05,.08,.1,1.5);
      box(car,dark,x,1.02,.13,.025,.43,.045);
      box(car,chrome,x*1.25,.84,.24,.025,.035,.2);
    }
    if(player) { // Rear wing, diffuser, bonnet stripes and exhausts.
      box(car,dark,0,.41,2.07,1.46,.18,.19);
      for(const x of [-.44,0,.44]) box(car,dark,x,.33,2.13,.04,.18,.26);
      for(const x of [-.6,.6]) box(car,dark,x,1.01,1.63,.065,.35,.065);
      box(car,paint,0,1.21,1.66,1.96,.09,.4);
      for(const x of [-.19,.19]) {
        const stripe=box(car,material(0xffe4c0),x,.843,-1.58,.16,.012,.84); stripe.rotation.x=.14;
        const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.2,12),chrome);exhaust.rotation.x=Math.PI/2;exhaust.position.set(x*2.9,.37,2.17);car.add(exhaust);
      }
    }
  }
  for (const x of [-.63,.63]) {
    box(car,white,x,.64,-2.083,.35,.11,.06);
    box(car,dark,x,.65,2.14,.4,.16,.05);
    box(car,red,x,.67,2.18,.35,.055,.025);
    box(car,red,x,.6,2.18,.35,.026,.025);
    box(car,paint,x*1.54,1,-.47,.23,.13,.24);
  }
  box(car,dark,0,.44,-2.13,1.17,.13,.05);
  box(car,material(0xe3dcc6),0,.59,2.17,.36,.12,.025);
  box(car,dark,0,.59,2.186,.2,.025,.003);
  box(car,dark,0,.25,0,1.52,.11,3.55);
  const wheels=[];
  const tireGeo=new THREE.CylinderGeometry(.385,.385,.29,20);
  const rimGeo=new THREE.CylinderGeometry(.245,.245,.302,16);
  for(const x of [-.98,.98]) for(const z of [-1.34,1.34]) {
    const wheel=new THREE.Group(); wheel.name="wheel"; wheel.position.set(x,.395,z);
    for(const [geo,mat] of [[tireGeo,rubber],[rimGeo,chrome]]) {
      const mesh=new THREE.Mesh(geo,mat); mesh.rotation.z=Math.PI/2; mesh.castShadow=true; wheel.add(mesh);
    }
    for(let k=0;k<5;k++) { const spoke=box(wheel,dark,Math.sign(x)*.157,0,0,.015,.035,.43); spoke.rotation.x=k*Math.PI/5; }
    car.add(wheel); wheels.push(wheel);
  }
  // Soft contact shadow still anchors the car on devices without high-res shadows.
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:0x111b25,transparent:true,opacity:.23,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.016; shadow.scale.set(1.2,2.35,1); car.add(shadow);
  car.scale.z=long; wheelSets.set(car,wheels);
  return car;
}

function palm() {
  const group=new THREE.Group();
  const trunkPath=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.1,2,0),new THREE.Vector3(-.1,4.1,0),new THREE.Vector3(-.4,6.2,0)]);
  const trunk=new THREE.Mesh(new THREE.TubeGeometry(trunkPath,6,.17,6,false),material(0x866955));
  trunk.castShadow=true; group.add(trunk);
  for(let i=0;i<7;i++) {
    const a=i*Math.PI*2/7, positions=[],indices=[];
    for(let j=0;j<=8;j++){
      const t=j/8,r=t*3.6,w=Math.sin(t*Math.PI)*.43,y=6.2+Math.sin(t*Math.PI)*.9-t*t*1.7;
      for(const side of [-1,1])positions.push(-.4+Math.cos(a)*r+Math.sin(a)*w*side,y,Math.sin(a)*r-Math.cos(a)*w*side);
      if(j<8){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const leafGeometry=new THREE.BufferGeometry();leafGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));leafGeometry.setIndex(indices);leafGeometry.computeVertexNormals();
    const leaf=new THREE.Mesh(leafGeometry,material(i%2?0x365f51:0x497658,{side:THREE.DoubleSide}));leaf.castShadow=true;group.add(leaf);
  }
  return group;
}

export function createRoadScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.domElement.setAttribute("aria-label","3D coastal highway and traffic");
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xe1bca6);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
  scene.fog=new THREE.Fog(0xe1bca6,100,310);
  const camera=new THREE.PerspectiveCamera(58,1,.1,600);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(480,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{top:{value:new THREE.Color(0x718cac)},bottom:{value:new THREE.Color(0xffc297)}},
    vertexShader:"varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-.02,.65,normalize(v).y)),1.);}"}));
  scene.add(sky);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(17,32,24),new THREE.MeshBasicMaterial({color:0xffe3b0,fog:false})); sun.position.set(-105,63,-330); scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xc8e7ff,0x9e7252,1.35));
  const fill=new THREE.DirectionalLight(0xcde8ff,.9);fill.position.set(15,20,35);scene.add(fill);
  const light=new THREE.DirectionalLight(0xffd1a0,2); light.position.set(-35,65,-50); light.castShadow=true;
  light.shadow.mapSize.set(2048,2048); Object.assign(light.shadow.camera,{left:-35,right:35,top:65,bottom:-25,far:170});
  light.shadow.bias=-.0004; light.shadow.normalBias=.03; scene.add(light);
  const ground=new THREE.Group(); scene.add(ground);
  box(ground,material(0xc7ac85),0,-.23,-135,500,.4,600);
  const ocean=box(ground,material(0x428c96,{metalness:.3,roughness:.24}),92,.004,-150,155,.1,600);
  for(let i=0;i<18;i++) box(ground,material(0x81b5b5,{transparent:true,opacity:.34}),36+i*4,.065,-140+i*11,22,.012,1.4);
  box(ground,material(0x464951),0,0,-130,15.5,.12,360);
  box(ground,material(0x777774),-7.7,.012,-130,.5,.15,360);
  box(ground,material(0x777774),7.7,.012,-130,.5,.15,360);
  for(const x of [-7.15,7.15]) box(ground,material(0xf3d68f),x,.07,-130,.1,.015,360);
  const dashes=new THREE.InstancedMesh(boxGeometry,material(0xe9ddd0),3*46);
  const matrix=new THREE.Matrix4(); let n=0;
  for(const x of [-3.4,0,3.4]) for(let i=0;i<46;i++) {
    matrix.compose(new THREE.Vector3(x,.071,20-i*8),new THREE.Quaternion(),new THREE.Vector3(.12,.016,3.5)); dashes.setMatrixAt(n++,matrix);
  } scene.add(dashes);
  const rails=new THREE.Group();
  for(const x of [-8.4,8.4]) { box(rails,material(0xbfc4bd,{metalness:.6}),x,.85,-130,.15,.24,360);
    for(let i=0;i<44;i++) box(rails,material(0x8f9995),x,.45,20-i*8,.11,.9,.14);
  } scene.add(rails);
  const scenery=[];
  for(let i=0;i<26;i++) {
    const tree=palm(); const side=i%2?1:-1;
    tree.position.set(side*(11+(i%3)*2),0,-i*13); tree.rotation.y=i*1.3;
    const s=.8+(i%4)*.15; tree.scale.setScalar(s); scene.add(tree); scenery.push({object:tree,base:i*13,period:338});
  }
  for(let i=0;i<14;i++) {
    const geometry=new THREE.IcosahedronGeometry(1,1);
    const vertices=geometry.attributes.position;
    for(let v=0;v<vertices.count;v++){const x=vertices.getX(v),y=vertices.getY(v),z=vertices.getZ(v);vertices.setXYZ(v,x*(1+.17*Math.sin(z*8+i)),y*(1+.2*Math.sin(x*7+i)),z);}
    geometry.computeVertexNormals();
    const hill=new THREE.Mesh(geometry,material([0xb68e77,0x9e887d,0xc3a08a][i%3],{flatShading:true}));
    hill.scale.set(24+i%4*8,13+i%3*6,23+i%4*8);
    hill.position.set(-70-i%3*19,0,-40-i*24); hill.rotation.y=i; scene.add(hill);
  }
  // Roadside marker and gantry remain part of the traversed world.
  const sign=new THREE.Group();
  box(sign,material(0x80989b),-8,3,0,.18,6,.18); box(sign,material(0x80989b),8,3,0,.18,6,.18);
  box(sign,material(0x80989b),0,6,0,16.3,.16,.2);
  const signCanvas=document.createElement("canvas"); signCanvas.width=1024; signCanvas.height=256;
  const context=signCanvas.getContext("2d"); context.fillStyle="#204e55"; context.fillRect(0,0,1024,256);
  context.strokeStyle="#e4e5cb"; context.lineWidth=10; context.strokeRect(15,15,994,226);
  context.fillStyle="#fff1d4"; context.textAlign="center"; context.font="bold 74px sans-serif"; context.fillText("COASTLINE",512,110);
  context.font="38px sans-serif"; context.fillText("01   /   KEEP IT MOVING   ↑",512,183);
  const signFace=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas),transparent:true}));
  signFace.position.set(0,5.4,.15); sign.add(signFace); scene.add(sign); scenery.push({object:sign,base:140,period:420});
  const player=createVehicle(0x398cd1,0,true); scene.add(player);
  const traffic=new Map();
  const templates=paintColors.flatMap(color=>[0,1,2].map(type=>createVehicle(color,type)));
  const resize=()=>{ const w=host.clientWidth,h=host.clientHeight; renderer.setSize(w,h); camera.aspect=w/Math.max(1,h); camera.updateProjectionMatrix(); };
  const observer=new ResizeObserver(resize); observer.observe(host); resize();
  let introTravel=0, lastTime=0;
  function render(game, timestamp, reducedMotion=false) {
    const dt=Math.min(.05,(timestamp-lastTime)/1000 || .016); lastTime=timestamp;
    if(game.phase==="ready") introTravel+=dt*10;
    const distance=game.phase==="ready"?introTravel:game.distance;
    dashes.position.z=distance%8; rails.position.z=distance%8;
    for(const {object,base,period} of scenery) object.position.z=30-((base-distance)%period+period)%period;
    signFace.material.opacity=THREE.MathUtils.clamp((-sign.position.z-12)/25,0,1);
    player.position.set(game.x,.03,0);
    player.rotation.z=THREE.MathUtils.damp(player.rotation.z,(LANES[game.targetLane]-game.x)*-.022,10,dt);
    player.rotation.y=THREE.MathUtils.damp(player.rotation.y,(LANES[game.targetLane]-game.x)*-.048,12,dt);
    if(game.phase==="crashed") player.rotation.y+=.003;
    wheelSets.get(player).forEach(w=>{ if(game.phase==="running") w.rotation.x-=game.speed*dt/.36; });
    red.emissiveIntensity=game.braking?5:2.5;
    const ids=new Set();
    for(const car of game.traffic) {
      ids.add(car.id);
      if(!traffic.has(car.id)){const mesh=templates[car.color*3+car.type].clone(true); wheelSets.set(mesh,mesh.children.filter(child=>child.name==="wheel")); scene.add(mesh); traffic.set(car.id,mesh);}
      const mesh=traffic.get(car.id); mesh.position.set(LANES[car.lane],.03,-car.z);
      if(game.phase==="running")wheelSets.get(mesh).forEach(w=>w.rotation.x-=18*dt/.385);
    }
    for(const [id,mesh] of traffic) if(!ids.has(id)){scene.remove(mesh);traffic.delete(id);}
    const speedRatio=game.speed/MAX_SPEED;
    const portrait=camera.aspect<.8;
    const aimX=game.phase==="ready"?-1.6:game.x*.32;
    camera.position.x=THREE.MathUtils.damp(camera.position.x,aimX,4,dt);
    camera.position.y=portrait?8:6.2;
    camera.position.z=portrait?13:11;
    camera.lookAt(game.x*.25,1,-25);
    camera.fov=THREE.MathUtils.damp(camera.fov,(portrait?69:58)+(reducedMotion?0:speedRatio*6),3,dt); camera.updateProjectionMatrix();
    renderer.render(scene,camera);
  }
  const allRoots=[scene,...templates];
  return {render, dispose(){observer.disconnect();const geometries=new Set(),materials=new Set();for(const root of allRoots)root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});environment.dispose();renderer.dispose();renderer.domElement.remove();}, info:()=>renderer.info.render};
}

