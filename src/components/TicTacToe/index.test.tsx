import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Subject, Observable, of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { TicTacToe, win, draw, handleInput, tick, constructGame, State, MouseEvent, DEFAULT_STATE } from './';

describe('win', () => {
  it('lets x win when it has a row', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['x', 'x', 'x'],
        ['o', ' ', 'o'],
        ['x', 'o', 'o']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('x');
    expect(newState.finished).toBe(true);
  });

  it('lets x win when it has a column', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['o', 'o', 'x'],
        ['o', ' ', 'x'],
        ['x', 'o', 'x']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('x');
    expect(newState.finished).toBe(true);
  });

  it('lets x win when it has a diagonal', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['o', 'o', 'x'],
        ['o', 'x', 'o'],
        ['x', 'o', 'x']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('x');
    expect(newState.finished).toBe(true);
  });

  it('lets o win when it has a row', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['x', 'o', 'x'],
        ['o', 'o', 'o'],
        ['x', 'o', 'x']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('o');
    expect(newState.finished).toBe(true);
  });

  it('lets o win when it has a column', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['o', 'o', 'x'],
        ['o', ' ', 'o'],
        ['o', 'o', 'x']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('o');
    expect(newState.finished).toBe(true);
  });

  it('lets o win when it has a diagonal', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['o', 'x', 'x'],
        ['o', 'o', 'x'],
        ['x', 'o', 'o']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe('o');
    expect(newState.finished).toBe(true);
  });

  it('lets noone win when noone has a line', async () => {
    const state: State = {
      ...DEFAULT_STATE
      board: [
        ['o', 'x', 'o'],
        ['o', 'x', 'x'],
        ['x', 'o', 'o']
      ]
    };

    const newState = await win(of(state)).toPromise();
    expect(newState.winningPlayer).toBe(null);
  });
});

describe('draw', () => {
  it('does not stop the game when less then 9 moves have been made', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 7
    };

    const newState = await draw(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('stops the game when 9 moves have been made', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 8
    };

    const newState = await draw(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.finished).toBe(true);
  });
});

describe('handleInput', () => {
  it('does not do anything when the clicked cell is already taken', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      board: [
        [' ', ' ', ' '],
        [' ', 'x', ' '],
        [' ', ' ', ' ']
      ]
    };

    const events = of({ row: 1, col: 1 });
    const states = of(state);

    const newState = await handleInput(events)(states).toPromise();
    expect(newState).toEqual(state);
  });

  it('claims the cell and changes the player', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      currentPlayer: 'o'
    };

    const events = of({ row: 1, col: 1 });
    const states = of(state);

    const newState = await handleInput(events)(states).toPromise();
    expect(newState.board).not.toEqual(state);
    expect(newState.board[1][1]).toEqual('o');
    expect(newState.currentPlayer).toEqual('x');
  });
});

describe('tick', () => {
  it('moves ahead time', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 1
    };

    expect((await tick(of(state)).toPromise()).time).toEqual(2);
  });
});

describe('constructGame', () => {
  it('constructs a new game', async () => {
    const events = new Subject<MouseEvent>();
    const state = {
      ...DEFAULT_STATE
    };

    const states = constructGame(events, state);

    events.next({ row: 0, col: 0 });
    events.next({ row: 1, col: 0 });
    events.next({ row: 2, col: 0 });
    events.next({ row: 0, col: 1 });
    events.next({ row: 1, col: 1 });

    expect(states).toBeInstanceOf(Observable);
    expect(await (states.pipe(take(5), toArray()).toPromise())).toHaveLength(5);
  });
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<TicTacToe />, div);
});
