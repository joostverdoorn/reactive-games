import * as React from 'react';
import { Observable, Subject, OperatorFunction, zip } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';

import './index.css';

export type MouseEvent = { row: number, col: number } | null;

export type Player = 'o' | 'x';
export type Empty = ' ';
export type Cell = Empty | Player;
export type Row = [Cell, Cell, Cell];
export type Board = [Row, Row, Row];

export type State = {
  time: number,
  currentPlayer: Player,
  winningPlayer: Player | null,
  finished: boolean
  board: Board
};

export const DEFAULT_STATE: State = {
  time: 0,
  currentPlayer: 'o',
  winningPlayer: null,
  finished: false,
  board: [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
  ]
};

export const isPlayer = (maybePlayer: string): maybePlayer is Player => {
  return maybePlayer === 'x' || maybePlayer === 'o';
};

export const win = map((state: State): State => {
  const { board } = state;
  const { columns, rows, diagonals } = board.reduce((memo, row, i) => {
    return row.reduce((memo, cell, j) => {
      if (!isPlayer(cell)) return memo;

      const additive = cell === 'x' ? 1 : -1;

      memo.rows[i] += additive;
      memo.columns[j] += additive;

      if (i === j) memo.diagonals[0] += additive;
      if (i === 2 - j) memo.diagonals[1] += additive;

      return memo;
    }, memo);
  }, { columns: [0, 0, 0], rows: [0, 0, 0], diagonals: [0, 0] });

  if ([...columns, ...rows, ...diagonals].some(v => v === 3)) return { ...state, finished: true, winningPlayer: 'x' };
  if ([...columns, ...rows, ...diagonals].some(v => v === -3)) return { ...state, finished: true, winningPlayer: 'o' };

  return state;
});

export const draw = map((state: State) => {
  const { time } = state;
  if (time >= 8) return { ...state, finished: true};
  return state;
});

export const tick = flatMap(async (state: State): Promise<State> => {
  const { time } = state;
  return { ...state, time: time + 1 };
});

export const handleInput = (mouseEvents: Observable<MouseEvent>): OperatorFunction<State, State> => {
  return observable => {
    return zip(observable, mouseEvents).pipe(map(([state, event]) => {
      const { currentPlayer, board, finished } = state;

      if (event === null) {
        if (finished) return DEFAULT_STATE;
        return state;
      }

      if (isPlayer(board[event.row][event.col])) return state;

      const newBoard: Board = board.map((row, i): Row => {
        return row.map((cell, j) => {
          return i === event.row && j === event.col ? currentPlayer : cell;
        }) as Row;
      }) as Board;

      return {
        ...state,
        currentPlayer: (currentPlayer === 'o' ? 'x' : 'o') as Player,
        board: newBoard
      };
    }));
  };
};

export const constructGame = (mouseEvents: Observable<MouseEvent>, initialState: State): Observable<State> => {
  const subject = new Subject<State>();

  subject.pipe(
    handleInput(mouseEvents),
    win,
    draw,
    tick,
  ).forEach(state => subject.next(state));

  subject.next(initialState);
  return subject.asObservable();
};

export class TicTacToe extends React.Component<Partial<State>, State> {
  mouseEvents = new Subject<MouseEvent>();

  constructor(props: Partial<State>) {
    super(props);
    this.state = { ...DEFAULT_STATE, ...props };
    constructGame(this.mouseEvents, this.state).forEach(state => this.setState(state));
  }

  handleMouseEvent = (event: MouseEvent) => {
    this.mouseEvents.next(event);
  }

  render() {
    const { board, finished, winningPlayer } = this.state;

    return (
      <div className="TicTacToe" tabIndex={1}>
        <div className={`TicTacToe-container ${finished ? 'TicTacToe-container__dead' : ''}`}>
          {finished && <div className="TicTacToe-finished-message" onClick={() => this.handleMouseEvent(null)}>
            <div>Game over!</div>
            <div>{winningPlayer ? `${winningPlayer} won!` : 'The game ended in a draw!'}</div>
            <div>Click to play again.</div>
          </div>}
          {board.map((row, i) => <div className="TicTacToe-row" key={`row-${i}`}>
            {row.map((cell, j) => <div className="TicTacToe-cell" key={`cell-${i}-${j}`} onClick={() => this.handleMouseEvent({ row: i, col: j })}>{cell}</div>)}
          </div>)}
        </div>
      </div>
    );
  }
}

export default TicTacToe;
