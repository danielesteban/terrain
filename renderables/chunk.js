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
  Vector3,
} from 'three';

class Chunk extends Mesh {
  static getMaterial() {
    const { uniforms, vertexShader, fragmentShader } = ShaderLib.basic;
    return new ShaderMaterial({
      uniforms: {
        ...UniformsUtils.clone(uniforms),
        aoEnabled: { value: true },
        aoIntensity: { value: 0.05 },
        colors: {
          value: [...Array(6)].map((v, i) => (new Color()).setScalar(i / 5)),
        },
        colorsEnabled: { value: true },
        colorMapOffset: { value: new Vector3() },
        colorMapSize: { value: new Vector3() },
      },
      vertexShader: vertexShader
        .replace(
          '#include <common>',
          [
            'attribute float data;',
            'uniform vec3 colors[6];',
            'uniform bool aoEnabled;',
            'uniform float aoIntensity;',
            'uniform bool colorsEnabled;',
            'uniform vec3 colorMapOffset;',
            'uniform vec3 colorMapSize;',
            'const vec2 uvoffset[4] = vec2[4](vec2(0.5, -0.5), vec2(-0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5));',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <uv_vertex>',
          [
            'int corner = int(data) >> 4;',
            'vUv.xy = (position.xz + colorMapOffset.xz + uvoffset[corner]) / colorMapSize.xz;',
            'vUv.y = 1.0 - vUv.y;',
          ].join('\n')
        )
        .replace(
          '#include <color_vertex>',
          [
            'vColor.xyz = vec3(1.0);',
            'if (aoEnabled) {',
            '  float ao = float(int(data) & 0xF) * aoIntensity;',
            '  vColor.xyz -= ao;',
            '}',
            'if (colorsEnabled) {',
            '  float colorStep = (position.y + colorMapOffset.y) / colorMapSize.y * 5.0;',
            '  vColor.xyz *= mix(colors[int(floor(colorStep))], colors[int(ceil(colorStep))], fract(colorStep));',
            '}',
          ].join('\n')
        ),
      fragmentShader,
      vertexColors: true,
    });
  }

  constructor({
    x, y, z,
    geometry,
    material,
    origin,
  }) {
    super(new BufferGeometry(), material);
    this.update(geometry);
    this.colorMapOffset = new Vector3(x, y, z);
    this.position.set(origin.x + x, y, origin.z + z);
    this.updateMatrixWorld();
    this.matrixAutoUpdate = false;
  }

  dispose() {
    const { geometry } = this;
    geometry.dispose();
  }

  onBeforeRender() {
    const { colorMapOffset, material } = this;
    material.uniforms.colorMapOffset.value.copy(colorMapOffset);
    material.uniformsNeedUpdate = true;
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
