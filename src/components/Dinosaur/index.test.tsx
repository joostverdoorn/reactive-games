import { Subject, Observable, of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { jump, duck, gravity, accelerate, move, spawnObstacle, despawnObstacle, die, reset, tick, handleInput, constructGame, State, KeyEvent, DEFAULT_STATE } from './';

describe('jump', () => {
  it('does not change the vertical speed when no key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set(),
    };

    const newState = await jump(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the vertical speed when the space bar is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set([' ']),
    };

    const newState = await jump(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.dy).toBeGreaterThan(0);
  });

  it('changes the vertical speed when the arrow up key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set(['ArrowUp']),
    };

    const newState = await jump(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.dy).toBeGreaterThan(0);
  });

  it('does not change the vertical speed when the dino is too high in the air', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      y: 6,
      maxJumpHeight: 5,
      keys: new Set(['ArrowUp']),
    };

    const newState = await jump(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not change the vertical speed when the dino is falling', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      dy: -1,
      keys: new Set(['ArrowUp']),
    };

    const newState = await jump(of(state)).toPromise();
    expect(newState).toEqual(state);
  });
});

describe('duck', () => {
  it('does not change the player height when no key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set(),
    };

    const newState = await duck(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the player height when the arrow down key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set(['ArrowDown']),
    };

    const newState = await duck(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.height).toBeLessThan(state.height);
  });
});

describe('gravity', () => {
  it('does not change the vertical speed when the dino is on the ground', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set(),
      y: 0,
      dy: 0
    };

    const newState = await gravity(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the vertical speed when the dino is not on the ground', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      y: 1,
      dy: 0
    };

    const newState = await gravity(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.dy).toBeLessThan(state.dy);
  });
});

describe('accelerate', () => {
  it('accelerates the dino further depending on the traveled distance', async () => {
    const state0: State = {
      ...DEFAULT_STATE,
      dxPerX: 1,
      x: 0
    };

    const state1: State = {
      ...DEFAULT_STATE,
      dxPerX: 1,
      x: 10
    };

    const newState0 = await accelerate(of(state0)).toPromise();
    const newState1 = await accelerate(of(state1)).toPromise();
    expect(newState0).not.toEqual(newState1);
    expect(newState0.dx).toBeLessThan(newState1.dx);
  });

  it('never accelerates the dino above the max velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 100000,
      dxPerX: 1,
      maxDx: 2
    };

    const newState = await accelerate(of(state)).toPromise();
    expect(newState.dx).toBeLessThanOrEqual(newState.maxDx);
  });

  it('never accelerates the dino below the min velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      dxPerX: 0,
      minDx: .5
    };

    const newState = await accelerate(of(state)).toPromise();
    expect(newState.dx).toBeGreaterThanOrEqual(newState.minDx);
  });
});

describe('move', () => {
  it('does not move the dino when it is dead', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      dx: 1,
      dy: 0,
      alive: false
    };

    const newState = await move(of(state)).toPromise();
    expect(state).toEqual(newState);
  });

  it('does not move the dino when there is no velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0
    };

    const newState = await move(of(state)).toPromise();
    expect(state).toEqual(newState);
  });

  it('moves the dino horizontally when there is a horizontal velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      dx: 1,
      dy: 0
    };

    const newState = await move(of(state)).toPromise();
    expect(state).not.toEqual(newState);
    expect(newState.x).toBeGreaterThan(state.x);
    expect(newState.y).toBe(state.y);
  });

  it('moves the dino vertically when there is a vertical velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      dx: 0,
      dy: 1
    };

    const newState = await move(of(state)).toPromise();
    expect(state).not.toEqual(newState);
    expect(newState.y).toBeGreaterThan(state.y);
    expect(newState.x).toBe(state.x);
  });

  it('never moves the dino below the game', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      y: 0,
      dy: -100
    };

    const newState = await move(of(state)).toPromise();
    expect(newState.y).not.toBeLessThan(0);
  });

  it('never moves the dino above the game', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      y: 20,
      dy: 100,
      gameHeight: 20
    };

    const newState = await move(of(state)).toPromise();
    expect(newState.y).not.toBeGreaterThan(state.gameHeight);
  });
});

describe('spawnObstacle', () => {
  it('does not spawn an obstacle when the previous obstacle is too close', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      gameWidth: 10,
      obstacleSpawnProbability: 1,
      minDistanceBetweenObstacles: 10,
      obstacles: [{ x: 5, y: 0, width: 2, height: 2 }],
    };

    const newState = await spawnObstacle(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not spawn an obstacle when the probability is too low', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      gameWidth: 10,
      obstacleSpawnProbability: 0,
      minDistanceBetweenObstacles: 5,
      obstacles: [{ x: 5, y: 0, width: 2, height: 2 }],
    };

    const newState = await spawnObstacle(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('spawns an obstacle when there is none', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      obstacleSpawnProbability: 1,
      obstacles: []
    };

    const newState = await spawnObstacle(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.obstacles.length).toBe(1);
  });

  it('spawns an obstacle when the previous obstacle is not too close', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      gameWidth: 10,
      obstacleSpawnProbability: 1,
      minDistanceBetweenObstacles: 5,
      obstacles: [{ x: 5, y: 0, width: 2, height: 2 }],
    };

    const newState = await spawnObstacle(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.obstacles.length).toBe(2);
  });
});

describe('despawnObstacle', () => {
  it('does not despawn an obstacle when it is not too far behind the player', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      gameWidth: 10,
      obstacles: [{ x: -9, y: 0, width: 2, height: 2 }],
    };

    const newState = await despawnObstacle(of(state)).toPromise();
    expect(newState).toEqual(state);
    expect(newState.obstacles.length).toBe(1);
  });

  it('despawns an obstacle when it is too far behind the player', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      gameWidth: 10,
      obstacles: [{ x: -10, y: 0, width: 2, height: 2 }],
    };

    const newState = await despawnObstacle(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.obstacles.length).toBe(0);
  });
});

describe('die', () => {
  it('does not kill the player when it does not intersect with an obstacle', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      width: 2,
      height: 4,
      obstacles: [{ x: 3, y: 0, width: 2, height: 2 }],
    };

    const newState = await die(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('kills the player when it intersects with an obstacle', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      x: 0,
      y: 0,
      width: 2,
      height: 4,
      obstacles: [{ x: 1, y: 0, width: 2, height: 2 }],
    };

    const newState = await die(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.alive).toBe(false);
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
  it('does not move ahead time when the player is alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 1,
      alive: false
    };

    const newState = await(tick(of(state))).toPromise();
    expect(newState.time).toEqual(1);
  });

  it('moves ahead time when the player is alive', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 1,
      alive: true
    };

    const newState = await(tick(of(state))).toPromise();
    expect(newState.time).toEqual(2);
  });
});

describe('handleInput', () => {
  it('adds pressed keys to the state', async () => {
    const keys = of({ key: 'ArrowUp', type: 'keydown' });

    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set()
    };

    const newState = await handleInput(keys)(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.keys).toEqual(new Set(['ArrowUp']));
  });

  it('removes unpressed keys from the state', async () => {
    const keys = of({ key: 'ArrowUp', type: 'keyup' });

    const state: State = {
      ...DEFAULT_STATE,
      keys: new Set('ArrowUp')
    };

    const newState = await handleInput(keys)(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.keys).toEqual(new Set());
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
