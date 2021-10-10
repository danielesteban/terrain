import {
  Mesh,
  PlaneGeometry,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Vector2,
} from 'three';
import blur from '../core/blur.js';

class Maps extends Mesh {
  static setupGeometry() {
    Maps.geometry = new PlaneGeometry(1, 1);
    Maps.geometry.translate(0.5, 0.5, 0);
  }

  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Maps.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        display: { value: 0 },
        heightmap: { value: null },
      },
      vertexShader,
      fragmentShader: fragmentShader
        .replace(
          '#include <common>',
          [
            'uniform int display;',
            'uniform sampler2D heightmap;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <map_fragment>',
          [
            'vec3 texelColor = mapTexelToLinear(texture2D(map, vUv)).xyz;',
            'vec3 texelHeight = texture2D(heightmap, vUv).xxx;',
            'if (display == 0) diffuseColor.xyz *= texelColor;',
            'else if (display == 1) diffuseColor.xyz *= texelHeight;',
            'else if (display == 2) diffuseColor.xyz *= texelColor * texelHeight;',
          ].join('\n')
        ),
    });
  }

  constructor(maps) {
    if (!Maps.geometry) {
      Maps.setupGeometry();
    }
    if (!Maps.material) {
      Maps.setupMaterial();
    }
    const material = Maps.material.clone();
    material.map = material.uniforms.map.value = maps.color;
    material.uniforms.heightmap.value = maps.height;
    super(
      Maps.geometry,
      material
    );
    this.matrixAutoUpdate = false;
    this.maps = maps;
    this.display('color*height');
  }

  blur(radius = 1) {
    const { maps } = this;
    blur(maps.height.image.data, maps.height.image.width, maps.height.image.height, radius);
    maps.height.needsUpdate = true;
  }
  
  display(map) {
    const { material } = this;
    material.uniforms.display.value = ['color', 'height', 'color*height'].indexOf(map);
  }

  load(pixels, scale = 1) {
    const { maps, material: { uniforms: { display: { value: display } } } } = this;
    for (let p = 0, c = 0, h = 0, l = pixels.length; p < l; p += 4, c += 3, h++) {
      if (display === 0 || display === 2) {
        maps.color.image.data.set([pixels[p], pixels[p + 1], pixels[p + 2]], c);
      }
      if (display === 1 || display === 2) {
        maps.height.image.data[h] = ((0.21 * pixels[p] + 0.71 * pixels[p + 1] + 0.07 * pixels[p + 2]) / 0xFF) * (pixels[p + 3] / 0xFF) * scale;
      }
    }
    maps.color.needsUpdate = true;
    maps.height.needsUpdate = true;
  }

  paint(point, shape, radius, color, blending) {
    const { maps, material: { uniforms: { display: { value: display } } } } = this;
    const map = display > 0 ? maps.height : maps.color;
    const { image: texture } = map;
    Maps.getBrush(shape, radius).forEach(({ x, y }) => {
      x = Math.floor(point.x * texture.width + x);
      y = Math.floor(point.y * texture.height + y);
      if (x < 0 || x >= texture.width || y < 0 || y >= texture.height) {
        return;
      }
      if (display > 0) {
        const i = y * texture.width + x;
        texture.data[i] = Math.min(Math.max(texture.data[i] + blending, 0), 1);
      } else {
        texture.data.set(color, (y * texture.width + x) * 3);
      }
    });
    map.needsUpdate = true;
  }

  static getBrush(shape, radius) {
    let brush = Maps.brushes.get(`${shape}:${radius}`);
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
      Maps.brushes.set(`${shape}:${radius}`, brush);
    }
    return brush;
  }
}

Maps.brushes = new Map();

export default Maps;
