import Program from './mesher.wasm';

class Mesher {
  constructor({
    width,
    height,
    depth,
    chunkSize,
    onLoad,
  }) {
    this.chunks = {
      x: width / chunkSize,
      z: depth / chunkSize,
    };
    this.chunkSize = chunkSize;
    this.width = width;
    this.height = height;
    this.depth = depth;
    const maxFacesPerChunk = Math.ceil(chunkSize * height * chunkSize * 0.5) * 6;
    const layout = [
      { id: 'heightmap', type: Float32Array, size: width * depth },
      { id: 'vertices', type: Uint8Array, size: maxFacesPerChunk * 4 * 6 },
      { id: 'indices', type: Uint32Array, size: maxFacesPerChunk * 6 },
      { id: 'world', type: Int32Array, size: 3 },
    ];
    const pages = Math.ceil(layout.reduce((total, { type, size }) => (
      total + size * type.BYTES_PER_ELEMENT
    ), 0) / 65536) + 2;
    const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
    Program()
      .then((program) => (
        WebAssembly
          .instantiate(program, { env: { memory } })
          .then((instance) => {
            this.memory = layout.reduce((layout, { id, type, size }) => {
              const address = instance.exports.malloc(size * type.BYTES_PER_ELEMENT);
              layout[id] = {
                address,
                view: new type(memory.buffer, address, size),
              };
              return layout;
            }, {});
            this.memory.world.view.set([width, height, depth]);
            this._mesh = instance.exports.mesh;
            onLoad();
          })
      ));
  }

  mesh(x, z) {
    const { chunkSize, memory, _mesh } = this;
    const faces = _mesh(
      memory.world.address,
      memory.heightmap.address,
      memory.indices.address,
      memory.vertices.address,
      chunkSize,
      x * chunkSize,
      z * chunkSize
    );
    if (faces === 0) {
      return false;
    }
    return {
      indices: new ((faces * 4 - 1) <= 65535 ? Uint16Array : Uint32Array)(
        memory.indices.view.subarray(0, faces * 6)
      ),
      vertices: new Uint8Array(memory.vertices.view.subarray(0, faces * 4 * 6)),
    };
  }
}

export default Mesher;
