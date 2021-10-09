import Program from './mesher.wasm';

class Mesher {
  constructor({
    width,
    height,
    depth,
    chunkHeight = 0x40,
    chunkSize = 0x20,
    onLoad,
  }) {
    if (width % chunkSize || depth % chunkSize) {
      throw new Error('width and depth must be multiples of chunkSize');
    }
    this.chunks = {
      x: width / chunkSize,
      z: depth / chunkSize,
    };
    this.chunkHeight = chunkHeight;
    this.chunkSize = chunkSize;
    this.width = width;
    this.height = height;
    this.depth = depth;
    const maxFacesPerChunk = Math.ceil(chunkSize * chunkSize * 0.5) * (Math.min(height, 0xFF) * 4 + 1);
    const layout = [
      { id: 'bounds', type: Float32Array, size: 4 },
      { id: 'heightmap', type: Float32Array, size: width * depth },
      { id: 'vertices', type: Uint8Array, size: maxFacesPerChunk * 4 * 4 },
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

  mesh(x, y, z) {
    const { chunkHeight, chunkSize, memory, _mesh } = this;
    const faces = _mesh(
      memory.world.address,
      memory.heightmap.address,
      memory.bounds.address,
      memory.indices.address,
      memory.vertices.address,
      chunkHeight,
      chunkSize,
      x * chunkSize,
      y * chunkHeight,
      z * chunkSize
    );
    if (faces === -1) {
      throw new Error('requested chunk is out of bounds');
    }
    return faces === 0 ? false : {
      bounds: new Float32Array(memory.bounds.view),
      indices: new ((faces * 4 - 1) <= 65535 ? Uint16Array : Uint32Array)(
        memory.indices.view.subarray(0, faces * 6)
      ),
      vertices: new Uint8Array(memory.vertices.view.subarray(0, faces * 4 * 4)),
    };
  }
}

export default Mesher;
