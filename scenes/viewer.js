import { PerspectiveCamera, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Viewer extends Scene {
  constructor({ renderer, world }) {
    super();

    this.camera = new PerspectiveCamera(60, 1, 1, 2000);
    this.camera.position.set(
      0,
      world.mesher.height * 1.5,
      world.mesher.depth * 0.1
    );
    this.camera.updateMatrixWorld();
    this.controls = new OrbitControls(this.camera, renderer.renderer.domElement);
    this.controls.enableDamping = true;
    this.screen = {
      left: 0,
      bottom: 0,
      width: 0.5,
      height: 1,
    };

    this.add(world);
  }

  onAnimationTick({ mouse }) {
    const { controls } = this;
    if (!mouse.primary && !mouse.secondary) {
      controls.enabled = mouse.x < 0.5;
    }
    controls.update();
  }
}

export default Viewer;
