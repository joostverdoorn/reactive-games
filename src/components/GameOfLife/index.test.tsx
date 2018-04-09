import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Observable, Subject, of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { GameOfLife, createRandomGrid, getNeighbors, isAlive, evolve, handleInput, constructGame, State, MouseEvent } from './';

describe('createRandomGrid', () => {
  it('returns an square grid of the given size', () => {
    const size = 50;
    const grid = createRandomGrid(size);

    expect(grid.length).toBe(size);
    expect(grid[0].length).toBe(size);
  });

  it('fills the grid with about the correct fraction of life cells', () => {
    const size = 50;
    const fraction = Math.random();
    const grid = createRandomGrid(size, fraction);
    expect(grid.reduce((result, row) => [ ...result, ...row ]).filter(x => x).length / size ** 2).toBeCloseTo(fraction, 1);
  });
});

describe('getNeighbors', () => {
  it('returns the neighbors of given cell in a grid', () => {
    const grid = [
      [true, false, true],
      [false, false, true],
      [false, true, false]
    ];

    expect(getNeighbors(grid, 1, 1)).toEqual([true, false, true, false, true, false, true, false]);
  });
});

describe('isAlive', () => {
  it('returns false when the cell is alive but neighborhood is underpopulated', () => {
    const grid = [
      [false, false, false],
      [false, true, false],
      [false, true, false]
    ];

    expect(isAlive(grid, 1, 1)).toBe(false);
  });

  it('returns false when the cell is alive but neighborhood is overpopulated', () => {
    const grid = [
      [true, false, false],
      [true, true, false],
      [true, true, false]
    ];

    expect(isAlive(grid, 1, 1)).toBe(false);
  });

  it('returns true when the cell is dead but neighborhood is populated enough', () => {
    const grid = [
      [true, false, false],
      [true, false, false],
      [true, false, false]
    ];

    expect(isAlive(grid, 1, 1)).toBe(true);
  });

  it('returns false when the cell is dead and neighborhood is not populated enough', () => {
    const grid = [
      [true, false, false],
      [true, false, false],
      [false, false, false]
    ];

    expect(isAlive(grid, 1, 1)).toBe(false);
  });

  it('returns true when the cell is alive and neighborhood is populated enough', () => {
    const grid = [
      [true, false, false],
      [true, true, false],
      [false, false, false]
    ];

    expect(isAlive(grid, 1, 1)).toBe(true);
  });
});

describe('evolve', () => {
  it('evolves the grid', async () => {
    const state = { grid: createRandomGrid(50) };
    const newState = await evolve(of(state)).toPromise();
    expect(newState).not.toEqual(state);
  });
});

describe('handleInput', () => {
  it('negates clicked cells', () => {
    const grid = [
      [false, false, false],
      [false, false, false],
      [false, false, false]
    ];

    const state = { grid };
    const states = new Subject<State>();
    const events = new Subject<MouseEvent>();
    const statesWithInput = handleInput(events)(states);

    const async = statesWithInput.toPromise().then(newState => {
      expect(newState.grid[1][1]).toBe(!state.grid[1][1]);
    });

    events.next({ row: 1, col: 1 });
    states.next(state);

    states.complete();
    events.complete();

    return async;
  });
});

describe('constructGame', () => {
  it('constructs a new game', async () => {
    const events = new Subject<MouseEvent>();
    const initialState = { grid: createRandomGrid(50) };
    const states = constructGame(events, initialState);

    expect(states).toBeInstanceOf(Observable);
    expect(await (states.pipe(take(5), toArray()).toPromise())).toHaveLength(5);
  });
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<GameOfLife />, div);
});
