import {
  DataTexture,
  FloatType,
  Mesh,
  PlaneGeometry,
  RedFormat,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Vector2,
} from 'three';
import blur from '../core/blur.js';

class Heightmap extends Mesh {
  static setupGeometry() {
    Heightmap.geometry = new PlaneGeometry(1, 1);
    Heightmap.geometry.translate(0.5, 0.5, 0);
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Heightmap.material = new ShaderMaterial({
      uniforms: UniformsUtils.clone(uniforms),
      vertexShader,
      fragmentShader: fragmentShader.replace(
        '#include <map_fragment>',
        [
          '#include <map_fragment>',
          'diffuseColor.yz = diffuseColor.xx;',
        ].join('\n')
      ),
    });
  }

  constructor(data, width, height) {
    if (!Heightmap.geometry) {
      Heightmap.setupGeometry();
    }
    if (!Heightmap.material) {
      Heightmap.setupMaterial();
    }
    const material = Heightmap.material.clone();
    material.map = new DataTexture(data, width, height, RedFormat, FloatType);
    material.map.flipY = true;
    material.uniforms.map.value = material.map;
    super(
      Heightmap.geometry,
      material
    );
    this.matrixAutoUpdate = false;
  }

  blur(radius = 1) {
    const { material: { map } } = this;
    const { image: texture } = map;
    blur(texture.data, texture.width, texture.height, radius);
    map.needsUpdate = true;
  }

  load(pixels, scale = 1) {
    const { material: { map } } = this;
    const { image: texture } = map;
    for (let p = 0, i = 0, l = pixels.length; p < l; p += 4, i++) {
      texture.data[i] = ((0.21 * pixels[p] + 0.71 * pixels[p + 1] + 0.07 * pixels[p + 2]) / 0xFF) * (pixels[p + 3] / 0xFF) * scale;
    }
    map.needsUpdate = true;
  }

  paint(point, shape, radius, inc) {
    const { material: { map } } = this;
    const { image: texture } = map;
    Heightmap.getBrush(shape, radius).forEach(({ x, y }) => {
      x = Math.floor(point.x * texture.width + x);
      y = Math.floor(point.y * texture.height + y);
      if (x < 0 || x >= texture.width || y < 0 || y >= texture.height) {
        return;
      }
      const i = y * texture.width + x;
      texture.data[i] = Math.min(Math.max(texture.data[i] + inc, 0), 1);
    });
    map.needsUpdate = true;
  }

  static getBrush(shape, radius) {
    let brush = Heightmap.brushes.get(`${shape}:${radius}`);
    if (!brush) {
      brush = [];
      const center = (new Vector2()).setScalar(0.5);
      for (let y = -radius; y <= radius + 1; y += 1) {
        for (let x = -radius; x <= radius + 1; x += 1) {
          const point = new Vector2(x, y);
          const distance = shape === 'square' ? (
            Math.max(point.x - center.x, point.y - center.y)
          ) : (
            point[shape === 'diamond' ? 'manhattanDistanceTo' : 'distanceTo'](center)
          );
          if (distance <= radius) {
            brush.push(point);
          }
        }
      }
      brush.sort((a, b) => (a.distanceTo(center) - b.distanceTo(center)));
      Heightmap.brushes.set(`${shape}:${radius}`, brush);
    }
    return brush;
  }
}

Heightmap.brushes = new Map();

export default Heightmap;
