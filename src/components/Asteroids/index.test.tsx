import { Subject, Observable, of } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { hitAsteroid, hitSelf, crashAsteroid, throttle, rotateLeft, rotateRight, shoot, move, moveBullets, moveAsteroids, spawnAsteroid, despawnBullets, reset, tick, handleInput, constructGame, KeyEvent, State, DEFAULT_STATE } from './';

describe('hitAsteroid', () => {
  it('does not change anything when there are no bullets or asteroids', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      bullets: []
    };

    const newState = await hitAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not change anything when are no bullets or asteroids intersect', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [{ size: 2, position: [2, 3], velocity: [0, 0] }],
      bullets: [{ position: [1, 2], velocity: [0, 0], spawnTime: 0 }]
    };

    const newState = await hitAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('removes a bullet and an asteroid when they intersect', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [{ size: 2, position: [2, 3], velocity: [0, 0] }],
      bullets: [{ position: [1.5, 3], velocity: [0, 0], spawnTime: 0 }]
    };

    const newState = await hitAsteroid(of(state)).toPromise();
    expect(newState).toEqual({ ...state, asteroids: [], bullets: [] });
  });
});

describe('hitSelf', () => {
  it('does not kill the player when no bullet is within a .5 radius of the player', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      bullets: [
        { spawnTime: 0, position: [4.5, 5], velocity: [0, 0] },
        { spawnTime: 0, position: [5.5, 5], velocity: [0, 0] },
        { spawnTime: 0, position: [5, 5.5], velocity: [0, 0] },
        { spawnTime: 0, position: [5, 4.5], velocity: [0, 0] }
      ]
    };

    const newState = await hitSelf(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('kills the player when a bullet is within a .5 radius of the player', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      bullets: [{ spawnTime: 0, position: [4.6, 5], velocity: [0, 0] }]
    };

    const newState = await hitSelf(of(state)).toPromise();
    expect(newState).toEqual({ ...state, alive: false });
  });
});

describe('crashAsteroid', () => {
  it('kills the player when the asteroid is too close', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      asteroids: [{ size: 1, position: [5.2, 5.2], velocity: [0, 0] }]
    };

    const newState = await crashAsteroid(of(state)).toPromise();
    expect(newState).toEqual({ ...state, alive: false });
  });

  it('does not kill the player when the asteroid is not too close', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      asteroids: [{ size: 1, position: [4.2, 5.2], velocity: [0, 0] }]
    };

    const newState = await crashAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });
});

describe('throttle', () => {
  it('does not increase the velocity when the up arrow key is not pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      velocity: [0, 0],
      keys: new Set()
    };

    const newState = await throttle(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('increases the velocity in the right direction when the up arrow key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      velocity: [0, 0],
      keys: new Set(['ArrowUp'])
    };

    const newState = await throttle(of(state)).toPromise();
    expect(newState.velocity).not.toEqual([0, 0]);
    expect(Math.atan2(newState.velocity[1], newState.velocity[0])).toEqual(newState.direction);
  });

  it('does not increase the velocity to more than 1', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      velocity: [1, 0],
      keys: new Set(['ArrowUp'])
    };

    const newState = await throttle(of(state)).toPromise();
    expect(Math.sqrt(newState.velocity[0] ** 2 + newState.velocity[1] ** 2)).not.toBeGreaterThan(1);
  });
});

describe('rotateLeft', () => {
  it('does not change direction when the left arrow key is not pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 1,
      keys: new Set()
    };

    const newState = await rotateLeft(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes direction when the left arrow key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 1,
      keys: new Set(['ArrowLeft'])
    };

    const newState = await rotateLeft(of(state)).toPromise();
    expect(newState.direction).toBeLessThan(state.direction);
  });
});

describe('rotateRight', () => {
  it('does not change direction when the right arrow key is not pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 1,
      keys: new Set()
    };

    const newState = await rotateRight(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes direction when the right arrow key is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      direction: 1,
      keys: new Set(['ArrowRight'])
    };

    const newState = await rotateRight(of(state)).toPromise();
    expect(newState.direction).toBeGreaterThan(state.direction);
  });
});

describe('shoot', () => {
  it('does not shoot a bullet when the space bar is not pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      bullets: [],
      keys: new Set()
    };

    const newState = await shoot(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not shoots a bullet when the last bullet was shot too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 3,
      lastBulletTime: 1,
      bulletInterval: 3,
      bullets: [],
      keys: new Set(' ')
    };

    const newState = await shoot(of(state)).toPromise();
    expect(newState.bullets.length).toBe(0);
  });

  it('does shoots a bullet when the space bar is pressed', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      time: 4,
      lastBulletTime: 1,
      bulletInterval: 3,
      bullets: [],
      keys: new Set(' ')
    };

    const newState = await shoot(of(state)).toPromise();
    expect(newState.bullets.length).toBe(1);
  });
});

describe('move', () => {
  it('does not change the position when there is no velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      velocity: [0, 0]
    };

    const newState = await move(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the position in the right direction when there is a velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      position: [5, 5],
      velocity: [.2, .4]
    };

    const newState = await move(of(state)).toPromise();

    expect(newState.position).not.toEqual(state.position);
    expect(Math.atan2(newState.position[1] - state.position[1], newState.position[0] - state.position[0])).toBeCloseTo(Math.atan2(state.velocity[1], state.velocity[0]));
  });
});

describe('moveBullets', () => {
  it('does not change the position of the bullet when there is no velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      bullets: [{ position: [5, 5], velocity: [0, 0], spawnTime: 0 }]
    };

    const newState = await moveBullets(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the position of the bullet in the right direction when there is a velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      bullets: [{ position: [5, 5], velocity: [.2, .4], spawnTime: 0 }]
    };

    const newState = await moveBullets(of(state)).toPromise();

    expect(newState.bullets[0].position).not.toEqual(state.bullets[0].position);
    expect(Math.atan2(newState.bullets[0].position[1] - state.bullets[0].position[1], newState.bullets[0].position[0] - state.bullets[0].position[0])).toBeCloseTo(Math.atan2(state.bullets[0].velocity[1], state.bullets[0].velocity[0]));
  });
});

describe('moveAsteroids', () => {
  it('does not change the position of the asteroid when there is no velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [{ position: [5, 5], velocity: [0, 0], size: 1 }]
    };

    const newState = await moveAsteroids(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('changes the position of the asteroid in the right direction when there is a velocity', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [{ position: [5, 5], velocity: [.2, .4], size: 1 }]
    };

    const newState = await moveAsteroids(of(state)).toPromise();

    expect(newState.asteroids[0].position).not.toEqual(state.asteroids[0].position);
    expect(Math.atan2(newState.asteroids[0].position[1] - state.asteroids[0].position[1], newState.asteroids[0].position[0] - state.asteroids[0].position[0])).toBeCloseTo(Math.atan2(state.asteroids[0].velocity[1], state.asteroids[0].velocity[0]));
  });
});

describe('spawnAsteroid', () => {
  it('does not create an asteroid when the previous one was created too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      time: 2,
      lastAsteroidTime: 0,
      asteroidInterval: 3
    };

    const newState = await spawnAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('creates an asteroid when the previous one was created not too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      time: 4,
      lastAsteroidTime: 0,
      asteroidInterval: 3
    };

    const newState = await spawnAsteroid(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.asteroids.length).toEqual(1);
  });
});

describe('spawnAsteroid', () => {
  it('does not create an asteroid when the previous one was created too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      time: 2,
      lastAsteroidTime: 0,
      asteroidInterval: 3
    };

    const newState = await spawnAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('does not create an asteroid when there are too many asteroids', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      time: 4,
      maxAsteroids: 0,
      lastAsteroidTime: 0,
      asteroidInterval: 3
    };

    const newState = await spawnAsteroid(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('creates an asteroid when the previous one was created not too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      asteroids: [],
      time: 4,
      lastAsteroidTime: 0,
      asteroidInterval: 3
    };

    const newState = await spawnAsteroid(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.asteroids.length).toEqual(1);
  });
});

describe('despawnBullets', () => {
  it('does not destroy a bullet when it was created too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      bullets: [{ position: [0, 0], velocity: [0, 0], spawnTime: 1 }],
      time: 2,
      bulletTimeToLive: 3
    };

    const newState = await despawnBullets(of(state)).toPromise();
    expect(newState).toEqual(state);
  });

  it('destroys a bullet when it was created not too short ago', async () => {
    const state: State = {
      ...DEFAULT_STATE,
      bullets: [{ position: [0, 0], velocity: [0, 0], spawnTime: 1 }],
      time: 4,
      bulletTimeToLive: 3
    };

    const newState = await despawnBullets(of(state)).toPromise();
    expect(newState).not.toEqual(state);
    expect(newState.asteroids.length).toEqual(0);
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
