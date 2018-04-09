import * as React from 'react';
import { Observable, Subject, OperatorFunction, pipe } from 'rxjs';
import { map, flatMap, withLatestFrom, startWith } from 'rxjs/operators';
import * as delay from 'delay';
const { Layer, Rect, Stage } = require('react-konva');

import { mod, clamp } from '../../helpers';

import './index.css';

export type KeyEvent = { key: string, type: string };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Point = [number, number];
export type Points = Array<Point>;
export type State = {
  time: number,
  alive: boolean,
  trail: Points,
  length: number
  direction: Direction,
  speed: number,
  food: Point | null,
  lastFoodTime: number,
  betweenFoodTime: number,
  width: number,
  height: number,
  keys: Set<string>
};

export const BETWEEN_FOOD_TIME = 5;
export const WIDTH = 20;
export const HEIGHT = 20;
export const DEFAULT_STATE: State = {
  time: 0,
  alive: true,
  trail: [[Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)]],
  length: 1,
  direction: 'up',
  speed: 1,
  food: null,
  lastFoodTime: 0,
  betweenFoodTime: BETWEEN_FOOD_TIME,
  width: WIDTH,
  height: HEIGHT,
  keys: new Set()
};

export const getSnake = (state: State): Points => {
  const { trail, length } = state;
  return trail.slice(clamp(trail.length - length, 0, Infinity), trail.length);
};

export const intersects = (points: Points, [x, y]: Point): boolean => {
  return points.some(([a, b]) => a === x && b === y);
};

export const selfIntersects = (points: Points): boolean => {
  return points.some(([a, b]) => points.filter(([x, y]) => a === x && b === y).length > 1);
};

export const randomPoint = ([x1, y1]: Point, [x2, y2]: Point): Point => {
  const width = x2 - x1;
  const height = y2 - y1;
  return [x1 + Math.floor(Math.random() * width), y1 + Math.floor(Math.random() * height)];
};

export const rotate = map((state: State): State => {
  const { direction, keys } = state;
  if (keys.has('ArrowUp') && direction !== 'down') return { ...state, direction: 'up' };
  if (keys.has('ArrowDown') && direction !== 'up') return { ...state, direction: 'down' };
  if (keys.has('ArrowLeft') && direction !== 'right') return { ...state, direction: 'left' };
  if (keys.has('ArrowRight') && direction !== 'left') return { ...state, direction: 'right' };
  return state;
});

export const eat = map((state: State): State => {
  const { alive, time, food, length, speed } = state;
  const snake = getSnake(state);

  if (!alive) return state;
  if (!food) return state;
  if (!intersects(snake, food)) return state;

  return {
    ...state,
    length: length + 1,
    food: null,
    lastFoodTime: time,
    speed: speed + 1
  };
});

export const spawn = map((state: State): State => {
  const { alive, time, food, lastFoodTime, betweenFoodTime, width, height } = state;
  const snake = getSnake(state);

  if (!alive) return state;
  if (food) return state;
  if (lastFoodTime + betweenFoodTime > time) return state;

  let newFood: Point;
  do newFood = randomPoint([0, 0], [width, height]); while (intersects(snake, newFood));

  return {
    ...state,
    food: newFood
  };
});

export const move = map((state: State): State => {
  const { alive, direction, trail, width, height } = state;

  if (!alive) return state;

  const [x, y]: Point = trail[trail.length - 1];
  let newHead: Point = [x, y];

  if (direction === 'up') newHead = [x, mod(y - 1, height)];
  if (direction === 'down') newHead = [x, mod(y + 1, height)];
  if (direction === 'left') newHead = [mod(x - 1, width), y];
  if (direction === 'right') newHead = [mod(x + 1, width), y];

  return {
    ...state,
    trail: [...trail, newHead]
  };
});

export const die = map((state: State): State => {
  const { alive } = state;
  const snake = getSnake(state);

  if (!alive) return state;
  if (!selfIntersects(snake)) return state;

  return {
    ...state,
    alive: false
  };
});

export const reset = map((state: State): State => {
  const { alive, keys } = state;

  if (!alive && keys.has(' ')) return DEFAULT_STATE;
  return state;
});

export const tick = flatMap(async (state: State): Promise<State> => {
  const { alive, time, speed } = state;
  const delayFor = Math.max(!alive ? 200 : 200 - ((speed - 1) * 5), 80);

  await delay(delayFor);
  if (!alive) return state;

  return { ...state, time: time + 1 };
});

export const handleInput = (keyEvents: Observable<KeyEvent>): OperatorFunction<State, State> => {
  return pipe(
    withLatestFrom(keyEvents.pipe(map(event => event.key), startWith('ArrowUp'))),
    map<[State, string], State>(([state, key]) => ({ ...state, keys: new Set([key]) }))
  );
};

export const constructGame = (keyEvents: Observable<KeyEvent>, initialState: State): Observable<State> => {
  const subject = new Subject<State>();

  subject.pipe(
    handleInput(keyEvents),
    reset,
    rotate,
    move,
    die,
    eat,
    spawn,
    tick,
  ).forEach(state => subject.next(state));

  subject.next(initialState);
  return subject.asObservable();
};

export class Snake extends React.Component<Partial<State>, State> {
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
    const { height, width, alive, food } = this.state;

    return (
      <div className="Snake" tabIndex={1} ref={this.focusGame} onKeyDown={this.handleKey}>
        <div className={`Snake-container ${!alive ? 'Snake-container__dead' : ''}`}>
          {!alive && <div className="Snake-dead-message">
            <div>You are dead!</div>
            <div>Press space to play again.</div>
          </div>}
          <Stage width={width * 20} height={height * 20}>
            <Layer>
              {getSnake(this.state).map(([x, y], i) => <Rect key={`${i}`} x={20 * x} y={20 * y} width={20} height={20} fill="#777" />)}
              {food && <Rect x={20 * food[0]} y={20 * food[1]} width={20} height={20} fill="red" />}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

export default Snake;
