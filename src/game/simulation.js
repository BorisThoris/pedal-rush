export const LANE_WIDTH = 3.4;
export const LANES = [-5.1, -1.7, 1.7, 5.1];
export const MAX_SPEED = 62;
export const TRAFFIC_SPEED = 18;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const nextLane = (lane, direction) => clamp(lane + direction, 0, 3);

// A seeded run is replayable. Visual decoration never consumes this stream.
function random(game) {
  game.seed = (Math.imul(game.seed, 1664525) + 1013904223) >>> 0;
  return game.seed / 4294967296;
}

export function addWave(game, z) {
  const difficulty = Math.min(1, game.distance / 3500);
  const previousSafe = game.safeLane;
  game.safeLane = nextLane(previousSafe, Math.floor(random(game) * 3) - 1);
  const open = new Set([game.safeLane]);
  // Early waves have two exits. Even at peak density the guaranteed exit
  // moves at most one lane across a minimum 64m longitudinal gap.
  if (difficulty < 0.45 || random(game) < 0.25) open.add(nextLane(game.safeLane, game.safeLane < 2 ? 1 : -1));
  const wave = game.wave++;
  for (let lane = 0; lane < 4; lane++) {
    if (open.has(lane)) continue;
    const type = Math.floor(random(game) * 3);
    game.traffic.push({ id: game.nextId++, wave, lane, z, type,
      color: Math.floor(random(game) * 6), passed: false });
  }
  return { safeLane: game.safeLane, previousSafe, wave };
}

export function createInitialGame(seed = 1701) {
  const game = { phase: "ready", seed: seed >>> 0, speed: 0, distance: 0,
    time: 0, score: 0, distanceScore: 0, bonus: 0, passes: 0, nearMisses: 0, combo: 1,
    x: LANES[1], targetLane: 1, boost: 100, boosting: false, boostLocked: false,
    traffic: [], nextId: 0, wave: 0, safeLane: 1, message: "COASTLINE / ROUTE 01", messageTime: 0,
    impact: 0, trafficProgress: 0, nextWaveAt: 90 };
  // Fixed wide opening gives new players time to find their controls.
  while (game.nextWaveAt < 310) {
    addWave(game, game.nextWaveAt);
    game.nextWaveAt += 80;
  }
  return game;
}

export function steer(game, direction) {
  if (game.phase !== "running") return;
  game.targetLane = nextLane(game.targetLane, direction);
}

export function sweptCollision(previousX, x, previousZ, z, lane, length = 4.2) {
  // Swept slab intersection avoids tunnelling through a car at low FPS,
  // including diagonal contact while changing lanes.
  const minZ = -length, maxZ = length;
  const minX = LANES[lane] - 1.62, maxX = LANES[lane] + 1.62;
  let enter = 0, exit = 1;
  for (const [start, delta, low, high] of [[previousX, x - previousX, minX, maxX], [previousZ, z - previousZ, minZ, maxZ]]) {
    if (Math.abs(delta) < 1e-9) { if (start < low || start > high) return false; }
    else {
      const a = (low - start) / delta, b = (high - start) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return false;
    }
  }
  return true;
}

export function stepGame(game, controls, elapsed) {
  if (game.phase !== "running") return game;
  const dt = clamp(elapsed, 0, 0.05);
  game.time += dt;
  game.messageTime = Math.max(0, game.messageTime - dt);
  const difficulty = Math.min(1, game.distance / 3500);
  if (!controls.gas) game.boostLocked = false;
  game.boosting = controls.gas && !controls.brake && game.boost > 0 && !game.boostLocked;
  game.boost = clamp(game.boost + (game.boosting ? -25 : 13) * dt, 0, 100);
  if (game.boost === 0) game.boostLocked = true;
  const targetSpeed = controls.brake ? 14 : game.boosting ? MAX_SPEED : 32 + difficulty * 12;
  game.speed += clamp(targetSpeed - game.speed, -(controls.brake ? 28 : 12) * dt, 13 * dt);
  const previousX = game.x;
  game.x += clamp(LANES[game.targetLane] - game.x, -12.5 * dt, 12.5 * dt);
  game.distance += game.speed * dt;
  const closing = (game.speed - TRAFFIC_SPEED) * dt;
  game.trafficProgress += closing;
  for (const car of game.traffic) {
    const oldZ = car.z;
    car.z -= closing;
    if (sweptCollision(previousX, game.x, oldZ, car.z, car.lane, car.type === 2 ? 4.7 : 4.2)) {
      game.phase = "crashed";
      game.impact = 1;
      game.boosting = false;
      game.message = "A little more space next time.";
      break;
    }
    if (!car.passed && car.z < -5 && oldZ >= -5) {
      car.passed = true;
      game.passes++;
      const close = Math.abs(game.x - LANES[car.lane]) < 3.7;
      if (close && game.speed > 30) {
        game.nearMisses++;
        game.combo = Math.min(5, game.combo + 1);
        game.bonus += 100 * game.combo;
        game.message = `CLOSE CALL  +${100 * game.combo}`;
        game.messageTime = 1.6;
      } else game.bonus += 40;
    }
  }
  game.traffic = game.traffic.filter(car => car.z > -35);
  while (game.nextWaveAt - game.trafficProgress < 310) {
    addWave(game, game.nextWaveAt - game.trafficProgress);
    game.nextWaveAt += 80 - Math.min(16, difficulty * 16);
  }
  game.distanceScore += game.speed * dt * (game.boosting ? 1.25 : 1);
  game.score = Math.floor(game.distanceScore + game.bonus);
  // Distance points must not decrease when the gas is released.
  game.score = Math.max(game.highestScore || 0, game.score);
  game.highestScore = game.score;
  return game;
}
