import * as React from 'react';
import { Subject, Observable, OperatorFunction, pipe } from 'rxjs';
import { map, flatMap, scan, withLatestFrom, startWith } from 'rxjs/operators';
import * as delay from 'delay';
const { Layer, Shape, Stage, Circle, Rect } = require('react-konva');

import { including, excluding, mod } from '../../helpers';

import './index.css';

export type KeyEvent = { key: string, type: string };
export type Vector = [number, number];

export type Asteroid = {
  position: Vector,
  velocity: Vector,
  size: number
};

export type Bullet = {
  position: Vector,
  velocity: Vector,
  spawnTime: number
};

export type State = {
  time: number,
  alive: boolean,
  position: Vector,
  velocity: Vector,
  direction: number,
  bullets: Array<Bullet>,
  lastBulletTime: number,
  bulletInterval: number,
  bulletTimeToLive: number,
  asteroids: Array<Asteroid>,
  maxAsteroids: number,
  asteroidInterval: number,
  lastAsteroidTime: number,
  width: number,
  height: number,
  keys: Set<string>
};

export const WIDTH = 20;
export const HEIGHT = 20;
export const BULLET_INTERVAL = 5;
export const BULLET_TIME_TO_LIVE = 250;
export const MAX_ASTEROIDS = 4;
export const ASTEROID_INTERVAL = 250;
export const DEFAULT_STATE: State = {
  time: 1,
  alive: true,
  position: [WIDTH / 2, HEIGHT / 2],
  velocity: [0, 0],
  direction: 0,
  bullets: [],
  lastBulletTime: -Infinity,
  bulletInterval: BULLET_INTERVAL,
  bulletTimeToLive: BULLET_TIME_TO_LIVE,
  asteroids: [],
  maxAsteroids: MAX_ASTEROIDS,
  asteroidInterval: ASTEROID_INTERVAL,
  lastAsteroidTime: -Infinity,
  width: WIDTH,
  height: HEIGHT,
  keys: new Set()
};

export const hitAsteroid = map((state: State): State => {
  const { bullets, asteroids } = state;
  const newBullets = new Set(bullets);
  const newAsteroids = new Set(asteroids);

  for (let bullet of bullets) {
    const { position: [bulletX, bulletY] } = bullet;
    for (let asteroid of asteroids) {
      const { position: [asteroidX, asteroidY], size } = asteroid;
      if ((bulletX > (asteroidX - size / 2)) && (bulletX < (asteroidX + size / 2)) &&
          (bulletY > (asteroidY - size / 2)) && (bulletY < (asteroidY + size / 2))) {
        newBullets.delete(bullet);
        newAsteroids.delete(asteroid);
      }
    }
  }

  return {
    ...state,
    bullets: Array.from(newBullets.values()),
    asteroids: Array.from(newAsteroids.values())
  };
});

export const hitSelf = map((state: State): State => {
  const { bullets, position: [x, y] } = state;

  for (let { position: [bulletX, bulletY] } of bullets) {
    if (Math.sqrt((x - bulletX) ** 2 + (y - bulletY) ** 2) < .5) return { ...state, alive: false };
  }

  return state;
});

export const crashAsteroid = map((state: State): State => {
  const { asteroids, position: [x, y] } = state;

  for (let { position: [asteroidX, asteroidY], size } of asteroids) {
    if ((x > (asteroidX - size / 2)) && (x < (asteroidX + size / 2)) &&
        (y > (asteroidY - size / 2)) && (y < (asteroidY + size / 2))) {
      return { ...state, alive: false };
    }
  }

  return state;
});

export const throttle = map((state: State): State => {
  const { keys, velocity: [dx, dy], direction } = state;
  if (!keys.has('ArrowUp')) return state;

  let [newDx, newDy] = [
    dx + .01 * Math.cos(direction),
    dy + .01 * Math.sin(direction)
  ];

  const speed = Math.sqrt(newDx ** 2 + newDy ** 2);

  if (speed > 1) {
    const angle = Math.atan2(newDy, newDx);
    newDx = Math.cos(angle);
    newDy = Math.sin(angle);
  }

  return { ...state, velocity: [ newDx, newDy ] };
});

export const rotateLeft = map((state: State): State => {
  const { keys, direction } = state;
  if (!keys.has('ArrowLeft')) return state;
  return { ...state, direction: mod(direction - 0.1, Math.PI * 2) };
});

export const rotateRight = map((state: State): State => {
  const { keys, direction } = state;
  if (!keys.has('ArrowRight')) return state;
  return { ...state, direction: mod(direction + 0.1, Math.PI * 2) };
});

export const shoot = map((state: State): State => {
  const { time, position: [x, y], velocity: [dx, dy], direction, bullets, lastBulletTime, bulletInterval, keys } = state;

  if (lastBulletTime + bulletInterval > time) return state;
  if (!keys.has(' ')) return state;

  return {
    ...state,
    bullets: [ ...bullets, {
      position: [x + .6 * Math.cos(direction), y + .6 * Math.sin(direction)],
      velocity: [dx + .08 * Math.cos(direction), dy + .08 * Math.sin(direction)],
      spawnTime: time
    }],
    lastBulletTime: time
  };
});

export const move = map((state: State): State => {
  const { position: [x, y], velocity: [dx, dy], width, height } = state;
  return { ...state, position: [mod(x + dx, width), mod(y + dy, height)] };
});

export const moveBullets = map((state: State): State => {
  const { bullets, width, height } = state;
  return {
    ...state,
    bullets: bullets.map(bullet => {
      const { position: [x, y], velocity: [dx, dy] } = bullet;
      return { ...bullet, position: [mod(x + dx, width), mod(y + dy, height)] as Vector };
    })
  };
});

export const moveAsteroids = map((state: State): State => {
  const { asteroids, width, height } = state;
  return {
    ...state,
    asteroids: asteroids.map(asteroid => {
      const { position: [x, y], velocity: [dx, dy] } = asteroid;
      return { ...asteroid, position: [mod(x + dx, width), mod(y + dy, height)] as Vector };
    })
  };
});

export const spawnAsteroid = map((state: State): State => {
  const { time, asteroids, maxAsteroids, asteroidInterval, lastAsteroidTime, width, height } = state;

  if (lastAsteroidTime + asteroidInterval > time) return state;
  if (asteroids.length >= maxAsteroids) return state;

  const position: Vector = Math.random() > .5 ? [Math.random() * width, 0] : [0, Math.random() * height];
  return {
    ...state,
    lastAsteroidTime: time,
    asteroids: [...asteroids, { position, velocity: [0.1 * Math.random(), 0.1 * Math.random()] as Vector, size: 1.5 } ]
  };
});

export const despawnBullets = map((state: State): State => {
  const { time, bullets, bulletTimeToLive } = state;
  return {
    ...state,
    bullets: bullets.filter(({ spawnTime }) => spawnTime + bulletTimeToLive > time)
  };
});

export const reset = map((state: State): State => {
  const { alive, keys } = state;

  if (!alive && keys.has(' ')) return DEFAULT_STATE;
  return state;
});

export const tick = flatMap(async (state: State): Promise<State> => {
  const { alive, time } = state;
  if (!alive) {
    await delay(80);
    return state;
  }

  await delay(20);
  return { ...state, time: time + 1 };
});

export const handleInput = (keyEvents: Observable<KeyEvent>): OperatorFunction<State, State> => {
  const keys = keyEvents.pipe(
    scan<KeyEvent, Set<string>>((keys, { key, type }) => type === 'keydown' ? including(keys, key) : excluding(keys, key), new Set<string>()),
    startWith(new Set<string>())
  );

  return pipe(
    withLatestFrom(keys),
    map<[State, Set<string>], State>(([state, keys]) => ({ ...state, keys: new Set(keys) }))
  );
};

export const constructGame = (keyEvents: Observable<KeyEvent>, initialState: State): Observable<State> => {
  const subject = new Subject<State>();

  subject.pipe(
    handleInput(keyEvents),
    reset,
    throttle,
    rotateLeft,
    rotateRight,
    shoot,
    hitAsteroid,
    hitSelf,
    crashAsteroid,
    despawnBullets,
    spawnAsteroid,
    move,
    moveBullets,
    moveAsteroids,
    tick
  ).forEach(state => {
    subject.next(state);
  });

  subject.next(DEFAULT_STATE);
  return subject.asObservable();
};

export class Asteroids extends React.Component<Partial<State>, State> {
  keyEvents = new Subject<KeyEvent>();

  constructor(props: {}) {
    super(props);
    this.state = DEFAULT_STATE;
    constructGame(this.keyEvents, this.state).forEach(state => this.setState(state));
  }

  handleKey = (event: KeyEvent) => {
    this.keyEvents.next(event);
  }

  focusGame = (element: HTMLElement | null) => {
    if (element) element.focus();
  }

  render() {
    const { height, width, alive, position, direction, bullets, asteroids } = this.state;
    const [x, y] = position;
    const rotation = (direction / (2 * Math.PI)) * 360 + 90;

    return (
      <div className="Asteroids" tabIndex={1} ref={this.focusGame} onKeyDown={this.handleKey} onKeyUp={this.handleKey}>
        <div className={`Asteroids-container ${!alive ? 'Asteroids-container__dead' : ''}`}>
          {!alive && <div className="Asteroids-dead-message">
            <div>You are dead!</div>
            <div>Press space to play again.</div>
          </div>}
          <Stage width={width * 20} height={height * 20}>
            <Layer>
              {alive && <Shape
                x={x * 20}
                y={y * 20}
                sceneFunc={function(this: any, context: any) {
                  context.beginPath();
                  context.moveTo(0, -10);
                  context.lineTo(10, 10);
                  context.lineTo(-10, 10);
                  context.closePath();
                  context.fillStrokeShape(this);
                }}
                rotation={rotation}
                fill="#777"
              />}
              {bullets.map(({ position: [x, y] }, i) => <Circle key={i} x={x * 20} y={y * 20} radius={2} fill="red" />)}
            </Layer>
            {asteroids.map(({ position: [x, y], size }, i) => {
              return <Layer key={`asteroid-${i}`}>
                <Rect x={x * 20 - 10} y={y * 20 - 10} width={20 * size} height={20 * size} fill="blue" />
                <Rect x={x * 20 - width * 20 - 10} y={y * 20 - 10} width={20 * size} height={20 * size} fill="blue" />
                <Rect x={x * 20 + width * 20 - 10} y={y * 20 - 10} width={20 * size} height={20 * size} fill="blue" />
                <Rect x={x * 20 - 10} y={y * 20 - height * 20 - 10} width={20 * size} height={20 * size} fill="blue" />
                <Rect x={x * 20 - 10} y={y * 20 + height * 20 - 10} width={20 * size} height={20 * size} fill="blue" />
              </Layer>;
            })}
          </Stage>
        </div>
      </div>
    );
  }
}

export default Asteroids;
