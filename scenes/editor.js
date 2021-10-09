import {
  Color,
  OrthographicCamera,
  Raycaster,
  Scene,
  Vector2,
} from 'three';
import Maps from '../renderables/maps.js';

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

    this.brush = {
      enabled: true,
      shape: 'circle',
      radius: 31,
      color: [0xFF, 0xFF, 0xFF],
      blending: 0.75,
    };
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();
    this.maps = new Maps(world.maps);
    this.add(this.maps);
    this.mouse = renderer.mouse;
    this.world = world;

    {
      let color;
      const editor = document.getElementById('editor');
      const brush = document.getElementById('brush');
      const map = document.createElement('select');
      map.style.textTransform = 'capitalize';
      ['color', 'height', 'height+color'].forEach((value) => {
        const option = document.createElement('option');
        option.innerText = value;
        map.appendChild(option);
      });
      map.value = 'height+color';
      map.oninput = () => {
        this.maps.display(map.value);
        color.style.display = map.value === 'color' ? '' : 'none';
      };
      editor.appendChild(map);
      color = document.createElement('input');
      color.style.marginRight = '0.5rem';
      color.style.display = 'none';
      color.type = 'color';
      const aux = (new Color()).setRGB(
        this.brush.color[0] / 0xFF,
        this.brush.color[1] / 0xFF,
        this.brush.color[2] / 0xFF
      );
      color.value = `#${aux.convertLinearToSRGB().getHexString()}`;
      color.oninput = () => {
        aux.set(color.value).convertSRGBToLinear();
        this.brush.color[0] = Math.floor(aux.r * 0xFF);
        this.brush.color[1] = Math.floor(aux.g * 0xFF);
        this.brush.color[2] = Math.floor(aux.b * 0xFF);
      };
      brush.appendChild(color);
      const shape = document.createElement('select');
      shape.style.marginRight = '0.5rem';
      shape.style.textTransform = 'capitalize';
      ['circle', 'diamond', 'square'].forEach((value) => {
        const option = document.createElement('option');
        option.innerText = value;
        shape.appendChild(option);
      });
      shape.oninput = () => { this.brush.shape = shape.value; };
      brush.appendChild(shape);
      const radius = document.createElement('input');
      radius.type = 'range';
      radius.min = 1;
      radius.step = 2;
      radius.max = 31;
      radius.oninput = () => { this.brush.radius = parseInt(radius.value, 10); };
      brush.appendChild(radius);
    }
  }

  onAnimationTick(animation) {
    const { brush, camera, maps, mouse, pointer, raycaster, screen, world } = this;
    if (!mouse.primary && !mouse.secondary) {
      brush.enabled = mouse.x > 0.5;
      return;
    }
    if (!brush.enabled) {
      return;
    }
    pointer
      .set((mouse.x - screen.left) / screen.width, 1 - ((mouse.y - screen.bottom) / screen.height))
      .multiplyScalar(2).addScalar(-1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(maps)[0];
    if (hit) {
      const uv = maps.worldToLocal(hit.point);
      uv.y = 1.0 - uv.y;
      maps.paint(
        uv,
        brush.shape,
        brush.radius,
        brush.color,
        brush.blending * animation.delta * (mouse.primary ? 1 : -1)
      );
      if (maps.material.uniforms.display.value > 0) {
        world.onUpdate(uv);
      }
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
