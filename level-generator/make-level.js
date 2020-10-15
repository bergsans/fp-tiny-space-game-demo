const { PNG } = require('pngjs');
const fs = require('fs');

const TILE_SIZE = 20;

fs.createReadStream('level.png')
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const { height, width, data } = this;
    const level = Array.from(
      { length: Math.ceil(height / TILE_SIZE) },
      (_) => Array.from(
        { length: Math.ceil(width / TILE_SIZE) },
        (_) => 0)
    );
    for (let y = 0; y < height; y+=TILE_SIZE) {
      for (let x = 0; x < width; x+=TILE_SIZE) {
        let n = y * (width * 4) + (x * 4);
        const indexX = Math.ceil(x / TILE_SIZE);
        const indexY = Math.ceil(y / TILE_SIZE);
        level[indexY][indexX] = data[n];
      }
    }
    console.log(JSON.stringify(level));
  });
