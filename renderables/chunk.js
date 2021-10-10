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
  Vector4,
} from 'three';

class Chunk extends Mesh {
  static setupMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    Chunk.material = new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        colors: {
          value: [...Array(6)].map((v, i) => (new Color()).setScalar(i / 5)),
        },
        colorMapOffset: { value: new Vector4() },
        height: { value: 0 },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            'attribute float data;',
            'uniform vec3 colors[6];',
            'uniform vec4 colorMapOffset;',
            'uniform float height;',
            'vec2 uvoffset[4] = vec2[4](vec2(0.5, -0.5), vec2(-0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5));',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <uv_vertex>',
          [
            'int corner = int(data) >> 4;',
            'vec3 colorPosition = (modelMatrix * vec4(position, 1.0)).xyz;',
            'vUv.xy = (colorPosition.xz - colorMapOffset.xy + uvoffset[corner]) / colorMapOffset.zw;',
            'vUv.y = 1.0 - vUv.y;',
          ].join('\n')
        )
        .replace(
          '#include <color_vertex>',
          [
            'float ao = float(int(data) & 0xF) * 0.06;',
            'float colorStep = colorPosition.y / (height + 1.0) * 5.0;',
            'vColor.xyz = mix(colors[int(floor(colorStep))], colors[int(ceil(colorStep))], fract(colorStep)) * vec3(1.0 - ao);',
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
    geometry.setAttribute('data', new InterleavedBufferAttribute(vertices, 1, 3));
    if (geometry.boundingSphere === null) {
      geometry.boundingSphere = new Sphere();
    }
    geometry.boundingSphere.set({ x: bounds[0], y: bounds[1], z: bounds[2] }, bounds[3]);
    this.visible = true;
  }
}

export default Chunk;
