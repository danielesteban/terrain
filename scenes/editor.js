import {
  Color,
  OrthographicCamera,
  Raycaster,
  Scene,
  Vector2,
} from 'three';
import Heightmap from '../renderables/heightmap.js';

class Editor extends Scene {
  constructor({ mesher, renderer, world }) {
    super();

    this.background = new Color(0x111111);
    this.camera = new OrthographicCamera(0, 0, 0, 0, -1, 1);
    this.screen = {
      left: 0.5,
      bottom: 0,
      width: 0.5,
      height: 1,
    };
    this.viewport = {};

    this.brush = { radius: 24, intensity: 0.75 };
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();
    this.texture = new Heightmap(mesher.memory.heightmap.view, mesher.width, mesher.depth);
    this.add(this.texture);
    this.mouse = renderer.mouse;
    this.world = world;
  }

  onAnimationTick(animation) {
    const { brush, camera, mouse, pointer, raycaster, screen, texture, world } = this;
    if (!mouse.primary && !mouse.secondary) {
      return;
    }
    pointer
      .set((mouse.x - screen.left) / screen.width, 1 - ((mouse.y - screen.bottom) / screen.height))
      .multiplyScalar(2).addScalar(-1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(texture)[0];
    if (hit) {
      const uv = texture.worldToLocal(hit.point);
      uv.y = 1.0 - uv.y;
      texture.paint(
        uv,
        brush.radius,
        brush.intensity * animation.delta * (mouse.primary ? 1 : -1)
      );
      world.onUpdate(uv);
    }
  }

  onResize() {
    const { camera, viewport } = this;
    let x, y, w, h;
    if (viewport.width > viewport.height) {
      y = 0;
      h = 1;
      w = viewport.width / viewport.height;
      x = (1 - w) * 0.5;
    } else {
      x = 0;
      w = 1;
      h = viewport.height / viewport.width;
      y = (1 - h) * 0.5;
    }
    camera.left = x;
    camera.bottom = y;
    camera.right = x + w;
    camera.top = y + h;
    camera.updateProjectionMatrix();
  }
}

export default Editor;
