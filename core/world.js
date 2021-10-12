import {
  DataTexture,
  FloatType,
  Group,
  RedFormat,
  RGBFormat,
  sRGBEncoding,
  UnsignedByteType,
  Vector3,
} from 'three';
import Chunk from '../renderables/chunk.js';
import Mesher from './mesher/index.js';

class World extends Group {
  constructor({
    width,
    height,
    depth,
    maps = {},
    onLoad,
  }) {
    super();
    this.auxVector = new Vector3();
    const mesher = new Mesher({
      width,
      height,
      depth,
      onLoad: () => {
        this.maps = {
          color: new DataTexture(
            (new Uint8Array(mesher.width * mesher.depth * 3)).fill(0xFF),
            mesher.width,
            mesher.depth,
            RGBFormat,
            UnsignedByteType
          ),
          height: new DataTexture(
            mesher.memory.heightmap.view,
            mesher.width,
            mesher.depth,
            RedFormat,
            FloatType
          ),
        };
        this.maps.color.encoding = sRGBEncoding;
        this.maps.color.flipY = this.maps.height.flipY = true;
        this.mesher = mesher;
        
        this.material = Chunk.getMaterial();
        this.material.map = this.material.uniforms.map.value = this.maps.color;
        this.material.uniforms.colorMapSize.value.set(
          mesher.width,
          mesher.height + 1,
          mesher.depth
        );
  
        this.chunks = [];
        this.origin = new Vector3(mesher.width * -0.5, 0, mesher.depth * -0.5);
        for (let z = 0; z < mesher.chunks.z; z++) {
          for (let x = 0; x < mesher.chunks.x; x++) {
            const subchunks = [];
            for (let y = 0; y < Math.ceil(mesher.height / mesher.chunkHeight); y++) {
              const chunk = new Chunk({
                x: x * mesher.chunkSize,
                y: y * mesher.chunkHeight,
                z: z * mesher.chunkSize,
                geometry: (maps.height || maps.both) ? false : mesher.mesh(x, y, z),
                material: this.material,
                origin: this.origin,
              });
              subchunks.push(chunk);
              this.add(chunk);
            }
            this.chunks.push(subchunks);
          }
        }

        Promise.all(
          Object.keys(maps).reduce((requests, map) => {
            requests.push(
              this
                .load({ map, url: maps[map] })
                .catch(() => {})
            );
            return requests;
          }, [])
        )
          .then(() => onLoad && onLoad());
      },
    });
  }

  dispose() {
    const { chunks, maps, material } = this;
    if (chunks) {
      chunks.forEach((subchunks) => subchunks.forEach((subchunk) => subchunk.dispose()));
    }
    if (maps) {
      maps.color.dispose();
      maps.height.dispose();
    }
    if (material) {
      material.dispose();
    }
  }

  getHeight(point) {
    const { auxVector, mesher, origin } = this;
    if (!mesher) {
      return point.y;
    }
    this.worldToLocal(auxVector.copy(point)).sub(origin).floor();
    const { x, z } = auxVector;
    if (
      x < 0 || x >= mesher.width
      || z < 0 || z >= mesher.depth
    ) {
      auxVector.y = 0;
    } else {
      auxVector.y = Math.round(mesher.height * mesher.memory.heightmap.view[z * mesher.width + x]);
    }
    return this.localToWorld(auxVector).y;
  }

  load({ map, url }) {
    const { maps, mesher } = this;
    if (!mesher) {
      return Promise.reject();
    }
    if (!this.renderer) {
      const canvas = document.createElement('canvas');
      canvas.width = mesher.width;
      canvas.height = mesher.depth;
      this.renderer = {
        canvas,
        ctx: canvas.getContext('2d'),
      };
    }
    const { canvas, ctx } = this.renderer;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        let x, y, width, height;
        if (image.width / image.height < canvas.width / canvas.height) {
          width = canvas.width;
          height = image.height * width / image.width;
          x = 0;
          y = canvas.height * 0.5 - height * 0.5;
        } else {
          height = canvas.height;
          width = image.width * height / image.height;
          x = canvas.width * 0.5 - width * 0.5;
          y = 0;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, width, height);
        const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let p = 0, c = 0, h = 0, l = pixels.length; p < l; p += 4, c += 3, h++) {
          const alpha = pixels[p + 3] / 0xFF;
          if (
            [
              'colorRGB',
              'colorRGBheightAlpha',
              'colorRGBheightRGB',
            ].includes(map)
          ) {
            maps.color.image.data.set([
              pixels[p] * alpha,
              pixels[p + 1] * alpha,
              pixels[p + 2] * alpha
            ], c);
          }
          if (
            [
              'heightRGB',
              'colorRGBheightRGB',
            ].includes(map)
          ) {
            maps.height.image.data[h] = (
              (0.21 * pixels[p] + 0.71 * pixels[p + 1] + 0.07 * pixels[p + 2]) / 0xFF
            ) * alpha;
          }
          if (
            [
              'heightAlpha',
              'colorRGBheightAlpha',
            ].includes(map)
          ) {
            maps.height.image.data[h] = alpha;
          }
          if (map === 'heightR') {
            maps.height.image.data[h] = pixels[p] / 0xFF;
          }
        }
        if (
          [
            'colorRGB',
            'colorRGBheightAlpha',
            'colorRGBheightRGB',
          ].includes(map)
        ) {
          maps.color.needsUpdate = true;
        }
        if (
          [
            'heightAlpha',
            'heightR',
            'heightRGB',
            'colorRGBheightAlpha',
            'colorRGBheightRGB',
          ].includes(map)
        ) {
          maps.height.needsUpdate = true;
          this.remesh();
        }
        resolve();
      };
      image.onerror = () => {
        reject();
      };
      image.src = url;
    });
  }

  remesh(uv) {
    const { chunks, mesher } = this;
    if (!mesher) {
      return;
    }
    if (!uv) {
      for (let z = 0, i = 0; z < mesher.chunks.z; z++) {
        for (let x = 0; x < mesher.chunks.x; x++, i++) {
          chunks[i].forEach((subchunk, y) => subchunk.update(mesher.mesh(x, y, z)));
        }
      }
      return;
    }
    const fromX = Math.max(Math.floor(uv.x * mesher.width / mesher.chunkSize) - 1, 0);
    const fromZ = Math.max(Math.floor(uv.y * mesher.depth / mesher.chunkSize) - 1, 0);
    const toX = Math.min(fromX + 2, mesher.chunks.x - 1);
    const toZ = Math.min(fromZ + 2, mesher.chunks.z - 1);
    for (let z = fromZ; z <= toZ; z++) {
      for (let x = fromX; x <= toX; x++) {
        chunks[z * mesher.chunks.x + x].forEach((subchunk, y) => subchunk.update(mesher.mesh(x, y, z)));
      }
    }
  }
}

export default World;
