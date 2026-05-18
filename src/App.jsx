import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import carBody from "./myHookComponents/myCarHookComponent/images/image2vector.svg";
import wheel from "./myHookComponents/myCarHookComponent/images/wheel2vector.svg";
import flame from "./myHookComponents/myCarHookComponent/images/flameSvg.svg";
import smoke from "./myHookComponents/myCarHookComponent/images/smoke.png";
import gasPedal from "./myHookComponents/myCarHookComponent/images/gasPedal.png";
import brakePedal from "./myHookComponents/myCarHookComponent/images/breakPedal.png";
import sky from "./images/skyBackground.jpg";
import mountains from "./images/mountainsBackground.png";
import road from "./images/background2.png";

export const MAX_SPEED = 150;
export const LANES = [-22, 0, 22];
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ACCELERATION = 68;
const BRAKE_POWER = 126;
const ROLLING_DRAG = 15;
const PLAYER_Y = 70;
const COLLISION_Y = 8;
const PASS_Y = 86;
const SPAWN_Y = -42;
const RECOVERY_MS = 1050;

const trafficColors = [
  "hue-rotate(105deg) saturate(1.45) brightness(0.94)",
  "hue-rotate(185deg) saturate(1.2) brightness(1.04)",
  "hue-rotate(285deg) saturate(1.35) brightness(0.98)",
  "sepia(0.45) saturate(1.6) hue-rotate(330deg) brightness(1.02)"
];

export function nextLane(currentLane, direction) {
  return clamp(currentLane + direction, 0, LANES.length - 1);
}

export function createTraffic(id, y = SPAWN_Y) {
  return {
    id,
    lane: (id * 2 + Math.floor(id / 2)) % LANES.length,
    y,
    speed: 34 + (id % 4) * 9,
    scale: 0.72 + (id % 3) * 0.06,
    filter: trafficColors[id % trafficColors.length],
    passed: false
  };
}

export function hasCollision(car, lane, recovering) {
  return !recovering && car.lane === lane && car.y >= PLAYER_Y - COLLISION_Y && car.y <= PLAYER_Y + COLLISION_Y;
}

export function createInitialGame() {
  return {
    speed: 0,
    distance: 0,
    score: 0,
    combo: 1,
    health: 100,
    lane: 1,
    targetLane: 1,
    roadOffset: 0,
    mountainOffset: 0,
    skyOffset: 0,
    shake: 0,
    traffic: [createTraffic(0, 28), createTraffic(1, -18), createTraffic(2, -62)],
    nextTrafficId: 3,
    crashedUntil: 0,
    impactPulse: 0,
    message: "Dodge traffic and keep speed",
    lastFrame: 0
  };
}

function useControls() {
  const inputRef = useRef({ gas: false, brake: false });
  const [, forceRender] = useState(0);

  const setPedal = useCallback((name, isPressed) => {
    if (inputRef.current[name] === isPressed) return;
    inputRef.current = { ...inputRef.current, [name]: isPressed };
    forceRender(value => value + 1);
  }, []);

  return [inputRef, inputRef.current, setPedal];
}

function Meter({ label, value, max, tone = "default" }) {
  const percent = `${clamp((value / max) * 100, 0, 100)}%`;

  return (
    <div className="meter">
      <div className="meter__top">
        <span>{label}</span>
        <strong>{Math.round(value)}</strong>
      </div>
      <div className={`meter__track meter__track--${tone}`}>
        <div className="meter__fill" style={{ width: percent }} />
      </div>
    </div>
  );
}

function PedalButton({ label, type, image, pressed, onPress }) {
  const hold = isPressed => event => {
    event.preventDefault();
    onPress(type, isPressed);
  };

  return (
    <button
      className={`pedalButton ${pressed ? "pedalButton--pressed" : ""}`}
      type="button"
      aria-pressed={pressed}
      onMouseDown={hold(true)}
      onMouseUp={hold(false)}
      onMouseLeave={hold(false)}
      onTouchStart={hold(true)}
      onTouchEnd={hold(false)}
      onTouchCancel={hold(false)}
    >
      <img src={image} alt="" draggable="false" />
      <span>{label}</span>
    </button>
  );
}

function LaneButton({ label, direction, onLaneChange }) {
  return (
    <button className="laneButton" type="button" onClick={() => onLaneChange(direction)} aria-label={label}>
      {direction < 0 ? "‹" : "›"}
    </button>
  );
}

function TrafficCar({ car }) {
  const laneX = LANES[car.lane];
  const depth = clamp((car.y + 20) / 120, 0.4, 1.12);

  return (
    <div
      className={`trafficCar trafficCar--lane${car.lane}`}
      style={{
        left: `${50 + laneX}%`,
        top: `${car.y}%`,
        transform: `translateX(-50%) scale(${car.scale * depth})`,
        filter: car.filter,
        opacity: clamp(depth, 0.45, 1)
      }}
      aria-hidden="true"
    >
      <img src={carBody} alt="" />
    </div>
  );
}

function App() {
  const [inputRef, input, setPedal] = useControls();
  const [game, setGame] = useState(createInitialGame);
  const gameRef = useRef(game);

  const changeLane = useCallback(direction => {
    const current = gameRef.current;
    if (current.crashedUntil > performance.now()) return;
    const targetLane = nextLane(current.targetLane, direction);
    gameRef.current = { ...current, targetLane, message: targetLane === current.targetLane ? "Edge of road" : "Lane change" };
    setGame(gameRef.current);
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.repeat) return;
      if (event.key === "ArrowUp" || event.key === " ") setPedal("gas", true);
      if (event.key === "ArrowDown") setPedal("brake", true);
      if (event.key === "ArrowLeft") changeLane(-1);
      if (event.key === "ArrowRight") changeLane(1);
    };
    const onKeyUp = event => {
      if (event.key === "ArrowUp" || event.key === " ") setPedal("gas", false);
      if (event.key === "ArrowDown") setPedal("brake", false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [changeLane, setPedal]);

  useEffect(() => {
    let frameId;

    const tick = timestamp => {
      const previous = gameRef.current.lastFrame || timestamp;
      const delta = Math.min((timestamp - previous) / 1000, 0.05);
      const controls = inputRef.current;
      const current = gameRef.current;
      const recovering = timestamp < current.crashedUntil;

      let acceleration = -ROLLING_DRAG - current.speed * 0.035;
      if (!recovering && controls.gas) acceleration += ACCELERATION;
      if (controls.brake || recovering) acceleration -= BRAKE_POWER;
      if (controls.gas && controls.brake) acceleration -= ACCELERATION * 0.7;

      const speed = clamp(current.speed + acceleration * delta, 0, MAX_SPEED);
      const worldDelta = speed * delta * 0.16;
      const lane = current.lane + (current.targetLane - current.lane) * Math.min(1, delta * 8.5);
      const settledLane = Math.abs(lane - current.targetLane) < 0.01 ? current.targetLane : lane;

      let score = current.score + (recovering ? 0 : speed * delta * 0.7 * current.combo);
      let combo = current.combo;
      let health = current.health;
      let message = current.message;
      let nextTrafficId = current.nextTrafficId;
      let crashedUntil = current.crashedUntil;
      let impactPulse = Math.max(0, current.impactPulse - delta * 2.8);
      const playerLane = Math.round(settledLane);

      let traffic = current.traffic.map(car => ({
        ...car,
        y: car.y + Math.max(0.18, speed - car.speed) * delta * 0.18
      }));

      traffic = traffic.map(car => {
        if (hasCollision(car, playerLane, recovering)) {
          health = Math.max(0, health - 26);
          combo = 1;
          score = Math.max(0, score - 80);
          crashedUntil = timestamp + RECOVERY_MS;
          impactPulse = 1;
          message = health <= 26 ? "Spinout recovered" : "Impact - recover";
          return { ...car, y: PASS_Y + 12, passed: true };
        }

        if (!car.passed && car.y > PASS_Y) {
          combo = Math.min(combo + 1, 9);
          score += 90 * combo;
          message = combo > 2 ? `Clean pass x${combo}` : "Clean pass";
          return { ...car, passed: true };
        }

        return car;
      });

      traffic = traffic.filter(car => car.y < 124);
      while (traffic.length < 5) {
        const highest = traffic.reduce((min, car) => Math.min(min, car.y), 20);
        traffic.push(createTraffic(nextTrafficId, Math.min(SPAWN_Y, highest - 34 - (nextTrafficId % 3) * 12)));
        nextTrafficId += 1;
      }

      if (health <= 0) {
        health = 100;
        score = Math.max(0, score - 300);
        combo = 1;
        crashedUntil = timestamp + RECOVERY_MS;
        impactPulse = 1;
        message = "Spinout recovered";
        traffic = traffic.map((car, index) => ({ ...car, y: SPAWN_Y - index * 42, passed: false }));
      }

      const speedRatio = speed / MAX_SPEED;
      const nextState = {
        speed,
        distance: current.distance + speed * delta * 0.016,
        score,
        combo,
        health,
        lane: settledLane,
        targetLane: current.targetLane,
        roadOffset: (current.roadOffset + worldDelta * 20) % 1600,
        mountainOffset: (current.mountainOffset + worldDelta * 5) % 1600,
        skyOffset: (current.skyOffset + worldDelta * 1.4) % 1600,
        shake: recovering ? 0.5 : clamp((speedRatio - 0.52) * 1.25, 0, 0.38),
        traffic,
        nextTrafficId,
        crashedUntil,
        impactPulse,
        message,
        lastFrame: timestamp
      };

      gameRef.current = nextState;
      setGame(nextState);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inputRef]);

  const motion = useMemo(() => {
    const speedRatio = game.speed / MAX_SPEED;
    const recovering = game.crashedUntil > performance.now();
    const laneX = LANES[Math.round(game.lane)] + (game.lane - Math.round(game.lane)) * 22;
    const wheelDuration = `${Math.max(0.15, 1.2 - speedRatio * 1.02)}s`;
    const carTilt = recovering ? -5 : input.brake ? -1.4 : input.gas ? 1.1 : 0;
    const carLift = -2 - speedRatio * 7;

    return {
      wheelDuration,
      playerTransform: `translateX(calc(-50% + ${laneX}%)) translateY(${carLift}px) rotate(${carTilt}deg)`,
      worldTransform: `translate3d(${Math.sin(game.distance * 8) * game.shake * 9}px, ${
        Math.cos(game.distance * 6) * game.shake * 5
      }px, 0)`
    };
  }, [game, input.brake, input.gas]);

  const recovering = game.crashedUntil > performance.now();
  const isBoosting = input.gas && game.speed > 42 && !recovering;

  return (
    <main className="gameShell">
      <section className={`gameStage ${game.impactPulse > 0 ? "gameStage--impact" : ""}`} aria-label="Pedal Rush game">
        <div className="world" style={{ transform: motion.worldTransform }}>
          <div className="layer layer--sky" style={{ backgroundImage: `url(${sky})`, backgroundPositionX: `${-game.skyOffset}px` }} />
          <div
            className="layer layer--mountains"
            style={{ backgroundImage: `url(${mountains})`, backgroundPositionX: `${-game.mountainOffset}px` }}
          />
          <div className="layer layer--road" style={{ backgroundImage: `url(${road})`, backgroundPositionX: `${-game.roadOffset}px` }} />

          <div className="laneGuide laneGuide--left" />
          <div className="laneGuide laneGuide--right" />

          <div className="trafficLayer">
            {game.traffic.map(car => (
              <TrafficCar key={car.id} car={car} />
            ))}
          </div>

          <div
            className={`carRig ${isBoosting ? "carRig--boosting" : ""} ${recovering ? "carRig--recovering" : ""}`}
            style={{ transform: motion.playerTransform }}
          >
            <img className="smokePuff" src={smoke} alt="" aria-hidden="true" />
            <img className="flameJet" src={flame} alt="" aria-hidden="true" />
            <img className="carBody" src={carBody} alt="Blue roadster" draggable="false" />
            <img className="wheel wheel--front" src={wheel} alt="" style={{ animationDuration: motion.wheelDuration }} />
            <img className="wheel wheel--rear" src={wheel} alt="" style={{ animationDuration: motion.wheelDuration }} />
            <span className="speedLines speedLines--top" />
            <span className="speedLines speedLines--bottom" />
          </div>
        </div>

        <div className="hud">
          <div>
            <p className="eyebrow">Pedal Rush</p>
            <h1>{Math.round(game.speed)} mph</h1>
          </div>
          <div className="stats">
            <Meter label="Score" value={game.score} max={2500} />
            <Meter label="Health" value={game.health} max={100} tone="health" />
          </div>
        </div>

        <div className="targetPanel">
          <span>Traffic run</span>
          <strong>Lane {Math.round(game.targetLane) + 1}</strong>
          <small>Combo x{game.combo}</small>
        </div>

        <div className="laneControls" aria-label="Lane controls">
          <LaneButton label="Move left" direction={-1} onLaneChange={changeLane} />
          <LaneButton label="Move right" direction={1} onLaneChange={changeLane} />
        </div>

        <div className="controlDeck">
          <PedalButton label="Brake" type="brake" image={brakePedal} pressed={input.brake} onPress={setPedal} />
          <PedalButton label="Gas" type="gas" image={gasPedal} pressed={input.gas} onPress={setPedal} />
        </div>

        <div className="statusRail">
          <span>{recovering ? "Recovering" : input.gas ? "Accelerating" : input.brake ? "Braking" : "Coasting"}</span>
          <span>{game.message}</span>
        </div>
      </section>
    </main>
  );
}

export default App;
