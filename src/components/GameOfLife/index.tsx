import * as React from 'react';
import { Subject, Observable, interval, OperatorFunction } from 'rxjs';
import { map, sample, buffer, withLatestFrom } from 'rxjs/operators';
import { mod } from '../../helpers';

import './index.css';

export type MouseEvent = { row: number, col: number };
export type Grid = Array<Array<boolean>>;

export type State = {
  grid: Grid
};

export const createRandomGrid = (size: number, filledFraction: number = .5) => {
  return new Array(size).fill(null).map(() => new Array(size).fill(null).map(() => Math.random() < filledFraction));
};

export const getNeighbors = (grid: Grid, row: number, col: number): Array<boolean> => {
  const { length } = grid;
  return [
    grid[mod(row - 1, length)][mod(col - 1, length)],
    grid[mod(row - 1, length)][col],
    grid[mod(row - 1, length)][mod(col + 1, length)],
    grid[row][mod(col - 1, length)],
    grid[row][mod(col + 1, length)],
    grid[mod(row + 1, length)][mod(col - 1, length)],
    grid[mod(row + 1, length)][col],
    grid[mod(row + 1, length)][mod(col + 1, length)]
  ];
};

export const isAlive = (grid: Grid, row: number, col: number): boolean => {
  const alive = grid[row][col];
  const count = getNeighbors(grid, row, col).filter(alive => alive).length;

  if (count < 2 && alive) return false;
  if (count > 3 && alive) return false;
  if (count === 3 && !alive) return true;
  return alive;
};

export const evolve = map((state: State): State => {
  const { grid } = state;
  return {
    grid: grid.map((row, i) => row.map((cell, j) => isAlive(grid, i, j)))
  };
});

export const handleInput = (mouseEvents: Observable<MouseEvent>): OperatorFunction<State, State> => {
  return observable => {
    return mouseEvents.pipe(
      buffer(observable),
      withLatestFrom(observable),
      map<[Array<MouseEvent>, State], State>(([events, state]) => {
        const newGrid = events.reduce((result, { row, col }) => {
          result[row][col] = !result[row][col];
          return result;
        }, [ ...state.grid.map(row => [ ...row ]) ]);

        return { grid: newGrid };
      }),
    );
  };
};

export const constructGame = (mouseEvents: Observable<MouseEvent>, initialState: State): Observable<State> => {
  const subject = new Subject<State>();
  const clock = interval(200);

  subject.pipe(
    sample(clock),
    evolve,
    handleInput(mouseEvents),
  ).forEach(state => subject.next(state));

  subject.next(initialState);
  return subject.asObservable();
};

export class GameOfLife extends React.Component<Partial<State>, State> {
  mouseEvents = new Subject<MouseEvent>();

  constructor(props: Partial<State>) {
    super(props);
    this.state = { grid: createRandomGrid(50) };

    constructGame(this.mouseEvents, this.state).forEach(({ grid }) => {
      this.setState({ grid });
    });
  }

  handleMouseEvent = (event: MouseEvent) => {
    this.mouseEvents.next(event);
  }

  render() {
    const { grid } = this.state;

    return (
      <div className="GameOfLife" tabIndex={1}>
        <div className="GameOfLife-container">
          {grid.map((row, i) =>
            <div key={`${i}`}>
              {row.map((cell, j) =>
                <div
                  key={`${i}-${j}`}
                  className={'GameOfLife-cell ' + (cell ? 'GameOfLife-cell-alive' : 'GameOfLife-cell-dead')}
                  onMouseOver={event => event.buttons === 1 && this.handleMouseEvent({ row: i, col: j })}
                  onClick={() => this.handleMouseEvent({ row: i, col: j })}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default GameOfLife;
