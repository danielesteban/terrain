import { PerspectiveCamera, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Chunk from '../renderables/chunk.js';

class World extends Scene {
  constructor({ mesher, renderer }) {
    super();

    this.camera = new PerspectiveCamera(60, 1, 1, 2000);
    this.camera.position.set(
      0,
      mesher.height,
      mesher.depth * 0.1
    );
    this.camera.updateMatrixWorld();
    this.controls = new OrbitControls(this.camera, renderer.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.screen = {
      left: 0,
      bottom: 0,
      width: 0.5,
      height: 1,
    };
    this.viewport = {};

    this.chunks = [];
    const origin = { x: mesher.width * 0.5, z: mesher.depth * 0.5 };
    for (let z = 0; z < mesher.chunks.z; z++) {
      for (let x = 0; x < mesher.chunks.x; x++) {
        const subchunks = [];
        for (let y = 0; y < Math.ceil(mesher.height / mesher.chunkHeight); y++) {
          const chunk = new Chunk({
            x: x * mesher.chunkSize - origin.x,
            y: y * mesher.chunkHeight,
            z: z * mesher.chunkSize - origin.z,
            geometry: mesher.mesh(x, y, z),
          });
          subchunks.push(chunk);
          this.add(chunk);
        }
        this.chunks.push(subchunks);
      }
    }
    Chunk.material.uniforms.height.value = mesher.height;
    this.mesher = mesher;
    this.mouse = renderer.mouse;
  }

  onAnimationTick() {
    const { controls, mouse } = this;
    if (!mouse.primary && !mouse.secondary) {
      controls.enabled = mouse.x < 0.5;
    }
    controls.update();
  }

  onUpdate(uv) {
    const { chunks, mesher } = this;
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

  remesh() {
    const { chunks, mesher } = this;
    for (let z = 0, i = 0; z < mesher.chunks.z; z++) {
      for (let x = 0; x < mesher.chunks.x; x++, i++) {
        chunks[i].forEach((subchunk, y) => subchunk.update(mesher.mesh(x, y, z)));
      }
    }
  }
}

export default World;
