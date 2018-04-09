import * as React from 'react';
import { Observable, Subject, OperatorFunction, pipe } from 'rxjs';
import { map, flatMap, scan, withLatestFrom, startWith } from 'rxjs/operators';
import * as delay from 'delay';
const { Layer, Rect, Stage } = require('react-konva');

import { including, excluding, clamp } from '../../helpers';

import './index.css';

export type KeyEvent = { key: string, type: string };
export type Vector = [number, number];
export type Obstacle = { x: number, y: number, width: number, height: number };
export type State = {
  time: number,
  alive: boolean,
  x: number,
  y: number,
  dx: number,
  dy: number,
  dxPerX: number,
  minDx: number,
  maxDx: number,
  width: number,
  height: number,
  maxJumpHeight: number,
  obstacles: Array<Obstacle>,
  minDistanceBetweenObstacles: number,
  obstacleSpawnProbability: number,
  newObstacleTypeDistance: number,
  gameWidth: number,
  gameHeight: number,
  keys: Set<string>
};

export const WIDTH = 50;
export const HEIGHT = 20;
export const DX_PER_X = .0005;
export const MIN_DX = .4;
export const MAX_DX = 2;
export const MAX_JUMP_HEIGHT = 10;
export const MIN_DISTANCE_BETWEN_OBSTACLES = WIDTH * .4;
export const OBSTACLE_SPAWN_PROBABILITY = .08;
export const NEW_OBSTACLE_TYPE_DISTANCE = 300;
export const DEFAULT_STATE: State = {
  time: 0,
  alive: true,
  x: 0,
  y: 0,
  dx: MIN_DX,
  dy: 0,
  dxPerX: DX_PER_X,
  minDx: MIN_DX,
  maxDx: MAX_DX,
  width: 2,
  height: 4,
  maxJumpHeight: MAX_JUMP_HEIGHT,
  obstacles: [],
  minDistanceBetweenObstacles: MIN_DISTANCE_BETWEN_OBSTACLES,
  obstacleSpawnProbability: OBSTACLE_SPAWN_PROBABILITY,
  newObstacleTypeDistance: NEW_OBSTACLE_TYPE_DISTANCE,
  gameWidth: WIDTH,
  gameHeight: HEIGHT,
  keys: new Set()
};

const pickRandom = <T extends {}>(items: Array<T>): T => {
  return items[Math.floor(Math.random() * items.length)];
};

export const jump = map((state: State): State => {
  const { keys, y, dy, maxJumpHeight } = state;
  if ((keys.has(' ') || keys.has('ArrowUp')) && y < maxJumpHeight && dy >= 0) {
    return { ...state, dy: 1 };
  }
  return state;
});

export const duck = map((state: State): State => {
  const { keys } = state;
  if (keys.has('ArrowDown')) return { ...state, height: 2 };
  return { ...state, height: 4 };
});

export const gravity = map((state: State): State => {
  const { y, dy } = state;
  if (y === 0) return { ...state, dy: 0 };
  return { ...state, dy: dy - 0.15 };
});

export const accelerate = map((state: State): State => {
  const { x, dxPerX, minDx, maxDx } = state;
  return { ...state, dx: clamp(.3 + dxPerX * x, minDx, maxDx) };
});

export const move = map((state: State): State => {
  const { alive, x, y, dx, dy, gameHeight } = state;
  if (!alive) return state;
  return { ...state, x: x + dx, y: clamp(y + dy, 0, gameHeight) };
});

export const spawnObstacle = map((state: State): State => {
  const { x, gameWidth, obstacles, minDistanceBetweenObstacles, obstacleSpawnProbability, newObstacleTypeDistance } = state;
  const lastObstacle = obstacles[obstacles.length - 1];

  if (lastObstacle && (lastObstacle.x + minDistanceBetweenObstacles) > (x + gameWidth)) return state;
  if (Math.random() > obstacleSpawnProbability) return state;

  const newObstacle = { x: x + gameWidth, ...pickRandom([
    { y: 0, width: 4, height: 2 },
    { y: 0, width: 4, height: 4 },
    { y: 0, width: 6, height: 2 },
    { y: 8, width: 2, height: 2 },
    { y: 0, width: 2, height: 2 },
    { y: 2, width: 2, height: 2 }
  ].slice(0, 1 + Math.floor(x / newObstacleTypeDistance))) };

  return { ...state, obstacles: [...obstacles, newObstacle] };
});

export const despawnObstacle = map((state: State): State => {
  const { x, gameWidth, obstacles } = state;
  return { ...state, obstacles: obstacles.filter(obstacle => obstacle.x > x - gameWidth) };
});

export const die = map((state: State): State => {
  const { x, y, width, height, obstacles } = state;

  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  for (let obstacle of obstacles) {
    const obstacleX1 = obstacle.x;
    const obstacleX2 = obstacle.x + obstacle.width;
    const obstacleY1 = obstacle.y;
    const obstacleY2 = obstacle.y + obstacle.height;

    if (x1 <= obstacleX2 && x2 >= obstacleX1 && y1 <= obstacleY2 && y2 >= obstacleY1) {
      return { ...state, alive: false };
    }
  }

  return state;
});

export const reset = map((state: State): State => {
  const { alive, keys } = state;
  if (!alive && keys.has(' ')) return DEFAULT_STATE;
  return state;
});

export const tick = flatMap(async (state: State): Promise<State> => {
  const { alive, time } = state;
  await delay(25);
  if (!alive) return state;
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
    gravity,
    accelerate,
    jump,
    duck,
    move,
    die,
    spawnObstacle,
    despawnObstacle,
    reset,
    tick,
  ).forEach(state => subject.next(state));

  subject.next(initialState);
  return subject.asObservable();
};

export class Dinosaur extends React.Component<Partial<State>, State> {
  keyEvents = new Subject<KeyEvent>();

  constructor(props: Partial<State>) {
    super(props);
    this.state = { ...DEFAULT_STATE, ...props };
    constructGame(this.keyEvents, this.state).forEach(state => this.setState(state));
  }

  handleKey = (event: KeyEvent) => {
    this.keyEvents.next(event);
  }

  focusGame = (element: HTMLElement | null) => {
    if (element) element.focus();
  }

  render() {
    const zoom = 20;
    const { x, y, width, height, gameWidth, gameHeight, obstacles, alive } = this.state;
    const viewPortX = (x - 5) * zoom;
    const viewPortY = -gameHeight * zoom;

    return (
      <div className="Dinosaur" tabIndex={1} ref={this.focusGame} onKeyDown={this.handleKey} onKeyUp={this.handleKey}>
        <div className={`Dinosaur-container ${!alive ? 'Dinosaur-container__dead' : ''}`}>
          {!alive && <div className="Dinosaur-dead-message">
            <div>You are dead!</div>
            <div>Press space to play again.</div>
          </div>}
          <Stage width={gameWidth * zoom} height={gameHeight * zoom}>
            <Layer>
              <Rect x={x * zoom - viewPortX} y={-y * zoom - viewPortY} width={width * zoom} height={-height * zoom} fill="#777" />
              {obstacles.map(({ x, y, width, height }) => <Rect key={`${x}-${y}`} x={x * zoom - viewPortX} y={-y * zoom - viewPortY} width={width * zoom} height={-height * zoom} fill="#aaa" />)}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

export default Dinosaur;
