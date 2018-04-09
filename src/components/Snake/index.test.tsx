import { Subject, Observable, of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { getSnake, intersects, selfIntersects, randomPoint, rotate, eat, spawn, move, die, reset, tick, handleInput, constructGame, KeyEvent, State, Direction, DEFAULT_STATE } from './';

describe('getSnake', () => {
  it('returns the snake from the gamestate trail and length', () => {
    const state: State = {
      ...DEFAULT_STATE,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3
    };

    expect(getSnake(state)).toEqual([[0, 3], [1, 3], [2, 3]]);
  });
});

describe('intersects', () => {
  it('returns false when not intersecting', () => {
    expect(intersects([[0, 0]], [1, 1])).toBe(false);
    expect(intersects([[1, 0], [0, 1], [0, 0]], [1, 1])).toBe(false);
  });

  it('returns true when intersecting', () => {
    expect(intersects([[0, 0]], [0, 0])).toBe(true);
    expect(intersects([[1, 0], [0, 1], [0, 0]], [0, 0])).toBe(true);
  });
});

describe('selfIntersects', () => {
  it('returns true when self intersecting', () => {
    expect(selfIntersects([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])).toBe(true);
  });

  it('returns false when not self intersecting', () => {
    expect(selfIntersects([[0, 0], [1, 0], [1, 1], [0, 1]])).toBe(false);
  });
});

describe('randomPoint', () => {
  it('returns a point within the boundaries', () => {
    const x1 = Math.floor(Math.random() * 100);
    const y1 = Math.floor(Math.random() * 100);
    const x2 = x1 + Math.floor(Math.random() * 100);
    const y2 = y1 + Math.floor(Math.random() * 100);
    const [x, y] = randomPoint([x1, y1], [x2, y2]);

    expect(x).toBeGreaterThanOrEqual(x1);
    expect(x).toBeLessThan(x2);

    expect(y).toBeGreaterThanOrEqual(y1);
    expect(y).toBeLessThan(y2);
  });
});

describe('rotate', () => {
  it('does not change direction when no arrow was pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'up',
      keys: new Set()
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not change direction in the opposite direction of the pressed arrow', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'up',
      keys: new Set('ArrowDown')
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes direction to the left', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'up',
      keys: new Set(['ArrowLeft'])
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual({ ...state, direction: 'left' });
  });

  it('changes direction to the right', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'up',
      keys: new Set(['ArrowRight'])
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual({ ...state, direction: 'right' });
  });

  it('changes direction to up', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'left',
      keys: new Set(['ArrowUp'])
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual({ ...state, direction: 'up' });
  });

  it('changes direction to down', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 'left',
      keys: new Set(['ArrowDown'])
    };

    const newState = await rotate(of(state)).toPromise();
    expect(newState).toEqual({ ...state, direction: 'down' });
  });
});

describe('eat', () => {
  it('does not eat food when there is none', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      food: null
    };

    const newState = await eat(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not eat food when the snake does not intersect', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3,
      food: [3, 3],
    };

    const newState = await eat(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it ('does not eat food when the snake is not alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: false,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3,
      food: [2, 3]
    };

    const newState = await eat(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('eats food when the snake intersects', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3,
      food: [2, 3],
      speed: 1
    };

    const newState = await eat(of(state)).toPromise();
    expect(newState).toEqual({
      ...state, length: 4, food: null, speed: 2
    });
  });
});

describe('spawn', () => {
  it('does not generate food when there is still food', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      food: [2, 3]
    };

    const newState = await spawn(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not generate food when not enough time has passed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 7,
      lastFoodTime: 3,
      betweenFoodTime: 5
    };

    const newState = await spawn(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not generate food when the snake is not alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: false,
      time: 7,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3,
      food: null,
      lastFoodTime: 3,
      betweenFoodTime: 5
    };

    const newState = await spawn(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('generates food when there is no food and enough time has passed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      time: 10,
      trail: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      length: 3,
      food: null,
      lastFoodTime: 3,
      betweenFoodTime: 5
    };

    const newState = await spawn(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.food).toBeDefined();
  });
});

describe('move', () => {
  it('does not move the snake when it is dead', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: false,
      trail: [[0, 0]],
      length: 1,
      width: 10,
      height: 10
    };

    expect((await move(of({ ...state, direction: 'up' as Direction } as State)).toPromise()).trail.length).toEqual(1);
    expect((await move(of({ ...state, direction: 'down' as Direction } as State)).toPromise()).trail.length).toEqual(1);
    expect((await move(of({ ...state, direction: 'left' as Direction } as State)).toPromise()).trail.length).toEqual(1);
    expect((await move(of({ ...state, direction: 'right' as Direction } as State)).toPromise()).trail.length).toEqual(1);

  });

  it('moves the snake in the right direction when the snake is alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      trail: [[0, 0]],
      length: 1,
      width: 10,
      height: 10
    };

    expect((await move(of({ ...state, direction: 'up' as Direction })).toPromise()).trail[1]).toEqual([0, 9]);
    expect((await move(of({ ...state, direction: 'down' as Direction })).toPromise()).trail[1]).toEqual([0, 1]);
    expect((await move(of({ ...state, direction: 'left' as Direction })).toPromise()).trail[1]).toEqual([9, 0]);
    expect((await move(of({ ...state, direction: 'right' as Direction })).toPromise()).trail[1]).toEqual([1, 0]);
  });
});

describe('die', async () => {
  it('does not kill the snake when it does not intersect with itself', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      trail: [[0, 0], [0, 1]],
      length: 2,
      alive: true
    };

    const newState = await die(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not change anything when the player is dead', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      trail: [[0, 0], [0, 1], [1, 1], [0, 1], [0, 0]],
      length: 5,
      alive: false
    };

    const newState = await die(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('kills the snake when it intersects with itself', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      trail: [[0, 0], [0, 1], [1, 1], [0, 1], [0, 0]],
      length: 5,
      alive: true
    };

    const newState = await die(of(state)).toPromise();
    expect(newState).toEqual({ ...state, alive: false });
  });
});

describe('reset', () => {
  it('does not make the player alive when its not dead', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: true,
      keys: new Set([' '])
    };

    const newState = await reset(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('makes the player alive when its dead', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      alive: false,
      keys: new Set([' '])
    };

    const newState = await reset(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.alive).toBe(true);
  });
});

describe('tick', () => {
  it('does not move ahead time when the snake is alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 1,
      alive: false
    };

    expect((await tick(of(state)).toPromise()).time).toEqual(1);
  });

  it('moves ahead time when the snake is alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 1,
      alive: true
    };

    expect((await tick(of(state)).toPromise()).time).toEqual(2);
  });
});

describe('handleInput', () => {
  it('adds the latest keys to the state', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set()
    };

    const keys = of({ key: 'ArrowUp', type: 'keydown' });
    const newState = await handleInput(keys)(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.keys).toEqual(new Set(['ArrowUp']));
  });
});

describe('constructGame', () => {
  it('constructs a new game', async () => {
    const events = new Subject<KeyEvent>();
    const state = {
      ...DEFAULT_STATE
    };

    const states = constructGame(events, state);
    expect(states).toBeInstanceOf(Observable);
    expect(await (states.pipe(take(5), toArray()).toPromise())).toHaveLength(5);
  });
});
