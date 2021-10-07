import {
  BufferGeometry,
  BufferAttribute,
  Color,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  ShaderLib,
  ShaderMaterial,
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
            'uniform float height;',
            'uniform vec3 colors[6];',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <color_vertex>',
          [
            'float colorStep = position.y / height * 5.0;',
            'vColor.xyz = mix(colors[int(floor(colorStep))], colors[int(ceil(colorStep))], fract(colorStep)) * (color.xyz / 255.0);',
          ].join('\n')
        ),
      fragmentShader,
      vertexColors: true,
    });
  }

  constructor({
    x, z,
    geometry,
  }) {
    if (!Chunk.material) {
      Chunk.setupMaterial();
    }
    super(new BufferGeometry(), Chunk.material);
    if (geometry && geometry.indices.length > 0) {
      this.update(geometry);
    }
    this.position.set(x, 0, z);
    this.updateMatrixWorld();
    this.matrixAutoUpdate = false;
  }

  dispose() {
    const { geometry } = this;
    geometry.dispose();
  }

  update({ indices, vertices }) {
    const { geometry } = this;
    vertices = new InterleavedBuffer(vertices, 6);
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute('position', new InterleavedBufferAttribute(vertices, 3, 0));
    geometry.setAttribute('color', new InterleavedBufferAttribute(vertices, 3, 3));
    geometry.computeBoundingSphere();
  }
}

export default Chunk;
