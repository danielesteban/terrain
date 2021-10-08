import {
  BufferGeometry,
  BufferAttribute,
  Color,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  ShaderLib,
  ShaderMaterial,
  Sphere,
  UniformsUtils,
} from 'three';

class Chunk extends Mesh {
  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Chunk.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        colors: {
          value: [
            new Color(0),
            new Color(0x333333),
            new Color(0x666666),
            new Color(0x999999),
            new Color(0xBBBBBB),
            new Color(0xFFFFFF),
          ],
        },
        height: { value: 0 },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            'attribute float ao;',
            'uniform float height;',
            'uniform vec3 colors[6];',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <color_vertex>',
          [
            'float colorStep = (modelMatrix * vec4(position, 1.0)).y / height * 5.0;',
            'vColor.xyz = mix(colors[int(floor(colorStep))], colors[int(ceil(colorStep))], fract(colorStep)) * vec3(1.0 - ao / 255.0);',
          ].join('\n')
        ),
      fragmentShader,
      vertexColors: true,
    });
  }

  constructor({
    x, y, z,
    geometry,
  }) {
    if (!Chunk.material) {
      Chunk.setupMaterial();
    }
    super(new BufferGeometry(), Chunk.material);
    this.update(geometry);
    this.position.set(x, y, z);
    this.updateMatrixWorld();
    this.matrixAutoUpdate = false;
  }

  dispose() {
    const { geometry } = this;
    geometry.dispose();
  }

  update({ bounds, indices, vertices } = {}) {
    if (!indices || !indices.length) {
      this.visible = false;
      return;
    }
    const { geometry } = this;
    vertices = new InterleavedBuffer(vertices, 4);
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute('position', new InterleavedBufferAttribute(vertices, 3, 0));
    geometry.setAttribute('ao', new InterleavedBufferAttribute(vertices, 1, 3));
    if (geometry.boundingSphere === null) {
      geometry.boundingSphere = new Sphere();
    }
    geometry.boundingSphere.set({ x: bounds[0], y: bounds[1], z: bounds[2] }, bounds[3]);
    this.visible = true;
  }
}

export default Chunk;
