const tee = (fn) => (data) => {
  fn(data);
  return data;
};

const compose = (...fns) => (initial) => fns.reduceRight(
  (a, b) => b(a),
  initial,
);

const eventHandler = () => {
  let keys = {
    ArrowDown: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false,
  };
  const handleKeyDown = (e) => keys = e.key in keys && { ...keys, [e.key]: true };
  const handleKeyUp = (e) => keys = e.key in keys && { ...keys, [e.key]: false };
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  return {
    getValues() {
      return keys;
    },
  };
};

const getData = async () => {
  const LEVEL = 'https://herebeseaswines.net/tiny-space-game/level.json';
  const IMG_DATA = 'https://herebeseaswines.net/tiny-space-game/image-data.json';
  const levelResponse = await fetch(LEVEL);
  const level = await levelResponse.json();
  const imgDataResponse = await fetch(IMG_DATA);
  const imgData = await imgDataResponse.json();
  return { level, imgData };
};

const isCanMove = ({ x1, y1, x2, y2, }, level, TILE_SIZE) => {
  const _x1 = Math.floor(x1 / TILE_SIZE);
  const _y1 = Math.floor(y1 / TILE_SIZE);
  const _x2 = Math.floor(x2 / TILE_SIZE);
  const _y2 = Math.floor(y2 / TILE_SIZE);
  return (level[_y1][_x1] === 255)
         && (level[_y2][_x1] === 255)
         && (level[_y1][_x2] === 255)
         && (level[_y2][_x2] === 255);
};

const isMovingTo = (direction) => direction === true;

const isPlayerAttemptingToMove = (e) => Object.values(e).some(isMovingTo);

const drawLevel = ({
  ctx, G, level, pos, TILE_SIZE,
}) => {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 900, 600);
  const lowerBoundary = (Math.floor(pos.x / TILE_SIZE) - 4) < 0
    ? 0
    : Math.floor(pos.x / TILE_SIZE);
  const upperBoundary = lowerBoundary + 50;
  (function loopY(y = 0) {
    if (y >= 30) {
      return;
    }
    (function loopX(x = lowerBoundary) {
      if (x >= upperBoundary) {
        return;
      } if (level[y][x] !== 255) {
        ctx.drawImage(
          G.image,
          ...G.imgData.tile,
          (x * TILE_SIZE) - pos.x,
          (y * TILE_SIZE),
          TILE_SIZE,
          TILE_SIZE,
        );
      }
      return loopX(x + 1);
    }());
    return loopY(y + 1);
  }());
};

const drawPlayer = ({ ctx, G, pos }) => ctx.drawImage(
  G.image,
  ...G.imgData.plr,
  75,
  pos.y,
  80,
  80,
);

const drawNav = ({ e, ctx, G }) => {
  ctx.drawImage(
    G.image,
    ...G.imgData.instructions,
    690,
    375,
    200,
    216,
  );
  if (isPlayerAttemptingToMove(e.getValues())) {
    const [direction] = Object
      .entries(e.getValues())
      .find(([_, v]) => v === true);
    ctx.drawImage(G.image, ...G.imgData.pressed[direction], 690, 375, 200, 216);
  }
};

const drawBackground = ({ ctx, G }) => ctx.drawImage(
  G.image,
  ...G.imgData.background,
  600,
  0,
  300,
  600,
);

const drawMessage = (ctx, msg) => document.fonts.load('140px "Arcade"')
  .then(() => {
    ctx.font = '140px Arcade';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(msg, 450, 300);
  });

const handleMovement = (app) => {
  const { pos, speed } = app;
  if (!isCanMove(
    {
      x1: pos.x, y1: pos.y, x2: pos.x + 145, y2: pos.y + 80,
    },
    app.level,
    app.TILE_SIZE,
  )) {
    return { ...app, isPlaying: false };
  } if (isPlayerAttemptingToMove(app.e.getValues())) {
    const [direction] = Object
      .entries(app.e.getValues())
      .find(([_, v]) => v === true);
    if (direction === 'ArrowDown') {
      return {
        ...app,
        pos: {
          x: pos.x + speed,
          y: pos.y + speed,
        },
      };
    } if (direction === 'ArrowUp') {
      return {
        ...app,
        pos: {
          x: pos.x + speed,
          y: pos.y - speed,
        },
      };
    } if (direction === 'ArrowLeft') {
      return {
        ...app,
        speed: speed > 1 ? speed - 1 : 1,
        pos: { ...pos, x: pos.x + speed },
      };
    } if (direction === 'ArrowRight') {
      return {
        ...app,
        speed: speed <= 5 ? speed + 1 : 5,
        pos: { ...pos, x: pos.x + speed },
      };
    }
  }
  return {
    ...app,
    pos: {
      x: pos.x + speed,
      y: pos.y,
    },
  };
};

const gameLoop = (prevState) => {
  const nextState = compose(
    handleMovement,
    tee(drawPlayer),
    tee(drawNav),
    tee(drawBackground),
    tee(drawLevel),
  )(prevState);
  return nextState.isPlaying
    ? requestAnimationFrame(() => gameLoop(nextState))
    : drawMessage(prevState.ctx, 'GAME OVER');
};

(async () => {
  const ctx = document.querySelector('#canvas').getContext('2d');
  const image = new Image();
  image.src = 'assets/graphics.png';
  const { imgData, level } = await getData();
  requestAnimationFrame(() => gameLoop({
    isPlaying: true,
    TILE_SIZE: 20,
    ctx,
    e: eventHandler(),
    G: {
      imgData,
      image,
    },
    pos: { x: 0, y: 200 },
    loadTime: 50,
    speed: 1,
    level,
    explosions: [],
    missiles: [],
  }));
})();
